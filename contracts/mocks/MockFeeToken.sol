// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @notice TEST-ONLY mock: takes a 10% fee on every transfer (fee is burned).
/// Used to verify the LiquidityLocker records actual received balances.
contract MockFeeToken is ERC20 {
    uint256 public constant FEE_BPS = 1000; // 10%

    constructor(uint256 supply) ERC20("Fee Token", "FEE") {
        _mint(msg.sender, supply);
    }

    function _update(address from, address to, uint256 value) internal override {
        uint256 fee = (from == address(0) || to == address(0)) ? 0 : (value * FEE_BPS) / 10000;
        super._update(from, to, value - fee);
        // fee is implicitly burned
    }
}
