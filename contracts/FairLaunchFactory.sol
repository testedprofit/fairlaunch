// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./CreatorToken.sol";
import "@openzeppelin/contracts/finance/VestingWallet.sol";

/// @title FairLaunchFactory
/// @notice One-click fair token launches: deploys a CreatorToken (anti-whale
/// cap + trading gate), spins up audited OpenZeppelin VestingWallets for team
/// allocations, and hands the remaining supply to the creator for LP seeding.
contract FairLaunchFactory {
    struct VestingAllocation {
        address beneficiary;
        uint256 amount;
        uint64 start;
        uint64 duration;
    }

    struct Launch {
        address token;
        address creator;
        address[] vestingWallets;
        uint256 timestamp;
    }

    Launch[] public launches;
    mapping(address => uint256[]) public launchesByCreator;

    /// @notice Flat protocol fee per launch, in wei. 0 = free.
    uint256 public launchFee;
    /// @notice Hard cap on the launch fee: a compromised owner key can't set an absurd fee.
    uint256 public constant MAX_LAUNCH_FEE = 1 ether;
    /// @notice Where launch fees are sent.
    address public treasury;
    address public owner;

    /// @notice Per-creator launch counter. Salt = keccak256(creator, nonce), so the
    /// Nth launch by an address lands at the same token address on every chain
    /// where this factory is deployed (via the same deterministic deployer).
    mapping(address => uint256) public creatorLaunchNonce;

    event LaunchCreated(
        address indexed token,
        address indexed creator,
        address[] vestingWallets,
        uint256 totalSupply,
        uint256 timestamp,
        uint256 launchNonce
    );
    event LaunchFeeUpdated(uint256 newFee);
    event TreasuryUpdated(address newTreasury);

    constructor() {
        owner = msg.sender;
        treasury = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    function setLaunchFee(uint256 fee_) external onlyOwner {
        require(fee_ <= MAX_LAUNCH_FEE, "fee too high");
        launchFee = fee_;
        emit LaunchFeeUpdated(fee_);
    }

    function setTreasury(address treasury_) external onlyOwner {
        require(treasury_ != address(0), "bad treasury");
        treasury = treasury_;
        emit TreasuryUpdated(treasury_);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "bad owner");
        owner = newOwner;
    }

    function createLaunch(
        string calldata name_,
        string calldata symbol_,
        uint256 totalSupply_,
        uint256 maxWalletBps_,
        VestingAllocation[] calldata allocations
    ) external payable returns (address token) {
        require(msg.value >= launchFee, "insufficient fee");
        if (msg.value > 0) {
            (bool ok, ) = treasury.call{value: msg.value}("");
            require(ok, "fee transfer failed");
        }

        uint256 vestedTotal = 0;
        for (uint256 i = 0; i < allocations.length; i++) {
            require(allocations[i].beneficiary != address(0), "bad beneficiary");
            vestedTotal += allocations[i].amount;
        }
        require(vestedTotal <= totalSupply_, "vesting exceeds supply");

        // Deterministic salt: same creator + same nonce => same token address on
        // every chain where this factory is deployed at the same address.
        uint256 nonce = creatorLaunchNonce[msg.sender]++;
        bytes32 salt = keccak256(abi.encode(msg.sender, nonce));

        // 1. Deploy vesting vaults first (deterministic salts) so they can be exempted.
        address[] memory wallets = new address[](allocations.length);
        for (uint256 i = 0; i < allocations.length; i++) {
            VestingAllocation calldata a = allocations[i];
            VestingWallet w = new VestingWallet{salt: keccak256(abi.encode(salt, i))}(
                a.beneficiary,
                a.start,
                a.duration
            );
            wallets[i] = address(w);
        }

        // 2. Deploy the token via CREATE2 (owner = creator, supply minted to factory).
        CreatorToken t = new CreatorToken{salt: salt}(
            name_,
            symbol_,
            totalSupply_,
            maxWalletBps_,
            msg.sender,
            address(this),
            wallets
        );
        token = address(t);

        // 3. Fund vesting vaults, send the rest to the creator for LP seeding.
        for (uint256 i = 0; i < allocations.length; i++) {
            t.transfer(wallets[i], allocations[i].amount);
        }

        uint256 remaining = t.balanceOf(address(this));
        if (remaining > 0) {
            t.transfer(msg.sender, remaining);
        }

        launches.push(Launch(token, msg.sender, wallets, block.timestamp));
        launchesByCreator[msg.sender].push(launches.length - 1);
        emit LaunchCreated(token, msg.sender, wallets, totalSupply_, block.timestamp, nonce);
    }

    function launchCount() external view returns (uint256) {
        return launches.length;
    }
}
