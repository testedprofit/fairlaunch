// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CreatorToken
/// @notice ERC20 with fair-launch guards: a max-wallet cap (anti-whale) and a
/// trading gate so the creator can fund vesting + seed liquidity before the
/// public can trade. The wallet cap only applies once trading is enabled, so
/// pre-launch setup transfers (vesting vaults, LP seeding) are never blocked.
contract CreatorToken is ERC20, Ownable {
    /// @notice Max tokens per wallet, in basis points of total supply (e.g. 200 = 2%).
    uint256 public immutable maxWalletBps;

    /// @notice When false, only exempt addresses can move tokens.
    bool public tradingEnabled;

    mapping(address => bool) public isExempt;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 totalSupply_,
        uint256 maxWalletBps_,
        address owner_,
        address mintTo_,
        address[] memory extraExempt_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        require(maxWalletBps_ > 0 && maxWalletBps_ <= 10000, "bad bps");
        require(owner_ != address(0) && mintTo_ != address(0), "bad address");
        maxWalletBps = maxWalletBps_;
        isExempt[owner_] = true;
        isExempt[mintTo_] = true;
        for (uint256 i = 0; i < extraExempt_.length; i++) {
            isExempt[extraExempt_[i]] = true;
        }
        _mint(mintTo_, totalSupply_);
    }

    function setExempt(address account, bool exempt) external onlyOwner {
        isExempt[account] = exempt;
    }

    function enableTrading() external onlyOwner {
        tradingEnabled = true;
    }

    function _update(address from, address to, uint256 value) internal override {
        if (!tradingEnabled) {
            require(
                from == address(0) || isExempt[from] || isExempt[to] || from == owner(),
                "trading disabled"
            );
        }
        if (tradingEnabled && to != address(0) && !isExempt[to] && to != owner()) {
            uint256 maxWallet = (totalSupply() * maxWalletBps) / 10000;
            require(balanceOf(to) + value <= maxWallet, "max wallet exceeded");
        }
        super._update(from, to, value);
    }
}
