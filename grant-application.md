# FairLaunch — BNB Chain Builder Grant application (draft)

> Prepared 2026-10-13. Paste into the Monday form during the Nov 1–7 window.
> Contract addresses + demo link get filled in after testnet deployment.

## Project name
FairLaunch

## One-liner
One-click fair token launches on BNB Chain — anti-whale caps, team vesting, and
provable liquidity locks baked in from block one.

## Description
Memecoins drive the majority of retail activity on BNB Chain, but launching one
fairly today means either trusting an extractive pay-to-play launchpad or
hand-rolling Solidity. FairLaunch is the creator-first fair launcher: a low-fee,
open, one-click factory that makes the *safe* way to launch also the *easy* way.

Every FairLaunch token ships with:
- **Anti-whale wallet cap** — no wallet can hold more than a set % of supply
  once trading is live (configurable, e.g. 2%).
- **Trading gate** — the creator funds vesting and seeds liquidity *before* the
  public can trade. No snipers at block zero.
- **Team vesting vaults** — allocations locked in audited OpenZeppelin
  `VestingWallet` contracts, released linearly. No team dump on day one.
- **Provable LP locks** — lock PancakeSwap LP tokens until a chosen date,
  verifiable on-chain by any holder.

The dApp (launch form, explorer of all launches, per-token manage page) is live
on BSC Testnet. Contracts are tested (16/16 Hardhat tests, including a
CREATE2 determinism proof and adversarial cases) and compose audited
OpenZeppelin primitives; a professional audit is the first use of grant funds
before mainnet promotion. The protocol charges a flat 0.02 BNB per launch
(~$1–2) to a transparent treasury (50% security fund, 30% development, 20%
creator rebates) — full economics in the whitepaper.

## Problem
Retail token launches on BNB Chain are a trust lottery. Buyers can't tell a
fair launch from a slow rug: unlocked team wallets, snipeable openings, and
pullable liquidity are the norm, not the exception. Existing launchpads charge
for the privilege and optimize for their own fees, not holder safety.

## Solution
Make fairness the default, not a premium feature. FairLaunch bakes the four
trust mechanics every buyer wishes existed directly into the token at deploy
time — in a single transaction costing ~$0.01 in gas — so creators compete on
ideas and community, not on who can engineer the most favorable tokenomics
in the shadows.

## Why BNB Chain
- BNB Chain has the largest retail memecoin audience in crypto — the exact users
  who need fair launches.
- $0.01 fees make one-click factory launches economically sane (impossible on
  Ethereum mainnet for this use case).
- The ecosystem is actively rewarding trust/UX tooling (liquidity incentive
  programs, AI-agent tooling grants) — FairLaunch extends that thesis to launch
  fairness.

## Team
Solo founder: Robert Serrano ("Maskedmage").
- Launched and operated a token himself (PNET, Algorand) — learned the failure
  modes firsthand: whale concentration, unlocked-supply fear, fragmented
  liquidity. FairLaunch is the tool he wishes existed.
- Content creator: 60k YouTube subscribers + 25k Twitch followers — built-in
  distribution to drive real creators and real launches, the metric BNB Chain
  rewards.
- Technical background: field-deployed connected hardware systems (remote
  cameras, solar/cellular); builds with AI-assisted development (Cursor/Claude).
- Development is AI-assisted solo; audit and security review will be done by an
  independent professional firm (budgeted below).

## Technical architecture
- `CreatorToken.sol` — ERC20 + max-wallet cap (bps) + trading gate. Cap
  applies only after trading is enabled so pre-launch setup is never blocked.
- `FairLaunchFactory.sol` — one `createLaunch()` call deploys the token, spins
  up one OpenZeppelin `VestingWallet` per team allocation, funds them, and
  returns remaining supply to the creator for LP seeding. Emits `LaunchCreated`
  for transparent indexing.
- `LiquidityLocker.sol` — time-lock vault for any LP tokens (PancakeSwap v2/v3
  compatible); early withdrawal reverts on-chain.
- Frontend: Vite + React + ethers v6, static hosting (Vercel/IPFS).
- No custom vesting math, no upgradeable proxies, no admin keys beyond the
  token owner's trading-gate switch.

## Milestones (12 weeks)

**M1 — Security hardening (weeks 1–4)**
Professional audit of the three contracts + remediation + testnet hardening.
Deliverable: published audit report, fixed contracts redeployed to testnet.

**M2 — Mainnet launch (weeks 5–8)**
Mainnet deployment; one-click "add PancakeSwap liquidity + lock LP" (currently
two steps); holder-distribution analytics per launch.
Deliverable: live mainnet dApp, 3+ real creator launches.

**M3 — Creator onboarding (weeks 9–12)**
Onboard 10 creators to launch via FairLaunch; video tutorial series (leveraging
founder's 60k-sub channel); docs.
Deliverable: 10 launches, tutorial series, usage metrics.

## Funding ask
**$25,000** (tier 1 of the Builder Grant), structured so the majority is founder
execution, with a credible security line (reviewers check for this):
- $8,000 — security review (audit contest / smaller firm) + remediation
- $10,000 — founder development runway: one-click PancakeSwap liquidity+lock,
  holder analytics, mainnet hardening (M2)
- $7,000 — creator onboarding + video content production on founder's channel (M3)

Every dollar maps to a verifiable deliverable; the security line is what makes
the application credible to reviewers and protects the project at mainnet.

## Links
- Demo (BSC Testnet): <FILL after deploy>
- Factory contract: <FILL after deploy> (BscScan testnet)
- Locker contract: <FILL after deploy> (BscScan testnet)
- Code: <GitHub URL after push>
- Founder: <YouTube / X links>

## Disclosures
- Contracts are not yet audited; they compose audited OpenZeppelin primitives
  and are covered by automated tests. Audit is M1, funded by this grant, before
  any mainnet promotion involving real user funds.
- Solo, AI-assisted development; independent audit provides the second pair of
  eyes.
