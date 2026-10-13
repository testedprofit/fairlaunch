# FairLaunch — Security & Red-Team Report

Internal adversarial review, October 2026. Updated as findings are fixed.
This document exists because grant reviewers (and holders) should see the
attack thinking, not just the happy path.

## Findings

| # | Finding | Severity | Status |
|---|---------|----------|--------|
| 1 | **Factory exceeded the 24KB contract-size limit** once CREATE2 init code was embedded — deployment would revert on every chain | High (deploy blocker) | **Fixed.** Optimizer enabled (`runs: 200`, standard production setting). Lesson: test deployment, not just logic. |
| 2 | **Vesting releases blocked by the trading gate** — beneficiaries couldn't claim vested tokens until the creator enabled trading | Medium | **Fixed.** Vesting vaults are deployed first and exempted in the token constructor. |
| 3 | **Locker recorded requested, not received, amounts** — fee-on-transfer / deflationary LP tokens would deliver less than recorded, bricking the lock (withdraw reverts forever) | Medium | **Fixed.** Deposits are balance-measured (`received = after - before`); the lock stores what actually arrived. |
| 4 | **No cap on the launch fee** — a compromised factory-owner key could set an absurd fee (e.g. 1000 BNB), bricking all future launches | Medium | **Fixed.** `MAX_LAUNCH_FEE = 1 BNB`; `setLaunchFee` reverts above it. |
| 5 | **Exemptions were invisible** — a malicious creator could silently exempt their own wallets from the cap and gate, defeating the "fair" label | Medium | **Mitigated.** `ExemptionUpdated` events on every change; the dApp surfaces the live exemption list with a "watch this list" warning. |
| 6 | **Treasury griefing** — if `treasury` were set to a malicious contract that reverts on receive, every `createLaunch` would brick | Low | **Documented.** Treasury should be an EOA or multisig; the owner can rotate it instantly via `setTreasury`. Considered acceptable: recovery is one transaction. |
| 7 | **Wallet cap bypass via sybil** — the cap is per-wallet; a whale can split across 50 wallets | Inherent | **Documented as a known limitation** (see below). The cap raises the cost of concentration; it doesn't prevent a determined sybil. |
| 8 | **`enableTrading` is mempool-visible** — snipers can buy in the same block the gate opens | Low | **Documented.** Mitigation is procedural: seed deep liquidity before enabling. A commit-reveal scheme was considered and rejected as over-engineering for v1. |
| 9 | **Single-EOA factory owner** — key compromise = fee/treasury control (bounded by finding #4's cap) | Medium | **Documented.** `transferOwnership` exists; the roadmap moves ownership to a multisig/timelock post-traction. The 1 BNB fee cap bounds the damage. |
| 10 | **Cross-chain messaging** — deliberately absent | N/A (design) | **Documented.** Each chain is sovereign; there are no bridges and no messaging. Bridges are the #1 hack vector in crypto history; FairLaunch doesn't need them. |

## Known limitations (honest, by design)

- **Sybil vs. the wallet cap** (finding #7): no on-chain mechanism distinguishes one human with 50 wallets from 50 humans. Identity solutions would centralize the product; we accept this.
- **The creator's liquid allocation is theirs.** Trust mechanics cover team vesting, whale caps, and LP locks — not what the creator does with their own liquid share. The dApp shows the distribution so holders can judge.
- **Vesting start in the past** is allowed (some launches want partial immediate release). The dApp warns when start < now.
- **Rebasing / exotic LP tokens** are not supported by the locker (balance-measured deposits handle fee-on-transfer; rebases remain out of scope).

## What's formally verified by tests (16/16 passing)

- CREATE2 determinism: the deployed token address exactly matches the independently computed CREATE2 formula (test recomputes from bytecode + args).
- Fee mechanics: underpayment reverts; exact fee forwarding; 1 BNB cap enforced.
- Guards: trading gate blocks non-exempt transfers; wallet cap enforced post-launch.
- Vesting: linear release math (via audited OZ `VestingWallet`).
- Locker: early withdrawal reverts; post-unlock withdrawal works; fee-on-transfer tokens don't brick locks.

## Audit scope (for the funded professional audit)

1. `CreatorToken._update` — cap/gate interaction in all transfer paths (incl. `transferFrom`).
2. `FairLaunchFactory.createLaunch` — CREATE2 salt uniqueness, fee forwarding, exemption wiring.
3. `LiquidityLocker.lock/withdraw` — accounting under adversarial ERC20s.
4. Access control — owner capabilities and their blast radius (bounded by `MAX_LAUNCH_FEE`).
5. Out of scope: OpenZeppelin primitives (already audited), the frontend (no custody).

## Disclosure policy

Found a vulnerability? The contracts are not yet audited — please report
responsibly via the repo's issue tracker. A bug-bounty pool is budgeted
post-grant (see roadmap Phase 4).
