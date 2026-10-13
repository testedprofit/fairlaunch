// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title LiquidityLocker
/// @notice Time-lock vault for LP tokens. Lock PancakeSwap (or any) LP tokens
/// until a chosen timestamp to prove to holders that liquidity can't be pulled.
contract LiquidityLocker {
    using SafeERC20 for IERC20;

    struct Lock {
        address lpToken;
        address beneficiary;
        uint256 amount;
        uint64 unlockTime;
        bool withdrawn;
    }

    Lock[] public locks;

    event Locked(
        uint256 indexed lockId,
        address indexed lpToken,
        address indexed beneficiary,
        uint256 amount,
        uint64 unlockTime
    );
    event Withdrawn(uint256 indexed lockId, address indexed beneficiary, uint256 amount);

    function lock(
        address lpToken,
        uint256 amount,
        uint64 unlockTime,
        address beneficiary
    ) external returns (uint256 lockId) {
        require(amount > 0, "zero amount");
        require(unlockTime > block.timestamp, "unlock in past");
        require(beneficiary != address(0), "bad beneficiary");
        IERC20(lpToken).safeTransferFrom(msg.sender, address(this), amount);
        lockId = locks.length;
        locks.push(Lock(lpToken, beneficiary, amount, unlockTime, false));
        emit Locked(lockId, lpToken, beneficiary, amount, unlockTime);
    }

    function withdraw(uint256 lockId) external {
        Lock storage l = locks[lockId];
        require(!l.withdrawn, "already withdrawn");
        require(block.timestamp >= l.unlockTime, "still locked");
        require(msg.sender == l.beneficiary, "not beneficiary");
        l.withdrawn = true;
        IERC20(l.lpToken).safeTransfer(l.beneficiary, l.amount);
        emit Withdrawn(lockId, l.beneficiary, l.amount);
    }

    function lockCount() external view returns (uint256) {
        return locks.length;
    }
}
