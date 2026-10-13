# FairLaunch — Multichain Deployment Guide

## Philosophy

FairLaunch is **multichain-native, not multichain-bridged**. Each chain gets a
sovereign deployment: the same contracts, the same trust guarantees, no
cross-chain messaging, no bridges. Bridges are the most-hacked infrastructure
in crypto; a token factory has no legitimate need for them.

The multichain feature is **determinism**: the factory lives at the same
address on every chain, and a creator's Nth launch lands at the same token
address on every chain. Holders learn one address pattern; indexers and
frontends need one registry.

## How determinism works

1. **Factory address** — deployed via the canonical keyless CREATE2 deployer
   (`0x4e59b44847b379578588920cA78FBF26c0B3c19D`, Arachnid's deterministic
   deployment proxy, present on all major EVM chains). Same deployer + same
   init code + same salt → same factory address everywhere.
2. **Token addresses** — the factory deploys tokens with
   `salt = keccak256(creator, creatorLaunchNonce[creator])`. The nonce starts
   at 0 and increments per launch, so the Nth launch by an address is
   deterministic given the same factory address. The `launchNonce` is emitted
   in `LaunchCreated` so anyone can recompute the address offline.
3. **Vesting vaults** — `salt = keccak256(tokenSalt, index)`, deterministic
   for the same reason.

Caveat: if a creator launches in a different *order* on two chains, the
addresses diverge per chain (nonce is per-chain state). Documented, not a bug.

## Chain registry

| Chain | Chain ID | Factory | Locker | Status |
|---|---|---|---|---|
| BSC Testnet | 97 | TBD | TBD | Deploying |
| BNB Chain | 56 | TBD | TBD | Post-audit (Phase 5) |
| Base | 8453 | TBD | TBD | Planned (grant-eligible) |
| Arbitrum One | 42161 | TBD | TBD | Planned |
| Optimism | 10 | TBD | TBD | Planned (RetroPGF-eligible) |

The frontend reads this registry from `app/src/config.ts`. A zero address
means "coming soon" — the UI shows the chain as unavailable.

## Deploying to a new chain

```bash
# 1. Fund the deployer with native gas tokens on the target chain.
# 2. Deploy (works on any network in hardhat.config.js):
npx hardhat run scripts/deploy.js --network <name>

# 3. Verify on the chain's explorer:
npx hardhat verify --network <name> <FACTORY_ADDRESS>
npx hardhat verify --network <name> <LOCKER_ADDRESS>

# 4. For mainnet-grade determinism, deploy via the keyless CREATE2 deployer
#    instead of scripts/deploy.js so the address matches other chains:
#    - init code: factory artifact bytecode (no constructor args)
#    - salt: 0x0000000000000000000000000000000000000000000000000000000000000000
#    - submit the raw transaction to 0x4e59b44847b379578588920cA78FBF26c0B3c19D

# 5. Add the addresses to app/src/config.ts and rebuild the frontend.
# 6. Optional: set a chain-appropriate launch fee via setLaunchFee().
```

## Per-chain considerations

- **Launch fee** is set per deployment (owner-controlled, capped at 1 BNB).
  Cheaper chains can run a lower fee; the treasury can be per-chain or shared.
- **Treasury** should be an EOA or multisig on each chain (see SECURITY.md #6).
- **Ownership** should move to a multisig before mainnet on any chain.

## Non-goals (explicit)

- No cross-chain messaging (LayerZero, CCIP, etc.) — unnecessary attack surface.
- No "omnichain" token standard — each launch is a native token on its chain.
- No shared liquidity across chains — liquidity is per-chain by nature.
