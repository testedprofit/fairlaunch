# FairLaunch — Gitcoin Grants 24 application (draft)

> Target round: **OSS Developer Tooling and Libraries**
> Apply at: https://builder.gitcoin.co (see round page for the exact form)
> Deadline: **October 16, 2026** — late applications accepted until **October 29**
> Status: DRAFT — submit via the portal (requires his wallet/GitHub sign-in)

## Project name
FairLaunch

## Tagline
One-click fair token launches — anti-whale caps, team vesting, and provable
liquidity locks baked in from block one.

## Description
Retail token launches are a trust lottery. On EVM chains, most new tokens
launch with unlocked team wallets, snipeable openings, uncapped whale
accumulation, and pullable liquidity. Buyers can't distinguish a fair launch
from a slow rug — and creators who want to launch fairly must either pay an
extractive launchpad or hand-roll Solidity.

FairLaunch is a creator-first, open-source fair-launch factory: one transaction
deploys a token with four trust mechanics on by default — a max-wallet
anti-whale cap, a trading gate the creator controls, team allocations locked in
audited OpenZeppelin vesting vaults, and a time-lock vault for provable LP
locks. A flat 0.02 BNB protocol fee sustains development; everything else is
free and MIT-licensed.

Multichain-native by design: deterministic CREATE2 deployments put the factory
at the same address on every EVM chain, with per-chain sovereignty and zero
bridges. A trust dashboard lets any holder verify the cap, the vesting
schedule, and the LP locks on-chain — no trust required.

## Why this round
FairLaunch is developer tooling and public infrastructure: a factory contract,
a locker, and a dApp that any creator or developer can use and fork. It makes
the *safe* way to launch also the *easy* way — directly reducing the scam
surface for retail users across EVM ecosystems.

## Links
- Code (MIT): https://github.com/testedprofit/fairlaunch
- Whitepaper: https://github.com/testedprofit/fairlaunch/blob/main/WHITEPAPER.md
- Security red-team report: https://github.com/testedprofit/fairlaunch/blob/main/SECURITY.md
- Multichain guide: https://github.com/testedprofit/fairlaunch/blob/main/MULTICHAIN.md
- Demo: BSC Testnet deployment in progress (addresses to be added)

## Team
Solo founder: Rob Serrano (testedprofit) — full-stack/product engineer; builder
of AlgoFlow, a 12-tool Algorand Web3 suite live on mainnet (React + PuyaPy).
Launched and operated a token (PNET) and learned the failure modes firsthand —
FairLaunch is the tool he wishes existed. Content creator (60k YouTube, 25k
Twitch): distribution most devs lack.

## What the funds do
- **$8,000** — professional security review (audit contest) + remediation.
  Contracts are tested (16/16, incl. CREATE2 proofs and adversarial cases) and
  compose audited OpenZeppelin primitives; an independent review precedes any
  mainnet promotion with real user funds.
- **$10,000** — founder development runway: one-click PancakeSwap
  liquidity+lock, per-launch holder analytics, mainnet hardening.
- **$7,000** — creator onboarding and video documentation on the founder's
  channel (distribution → real launches → real usage).

## Roadmap
- Now: testnet dApp, grant applications, first dogfood launch (founder's own
  community token through the factory).
- Post-funding: audit → mainnet → 10 creator launches → published usage metrics.
- Gated future: protocol token only after 1,000+ launches, utility-first, no
  presale (committed in the whitepaper).

## Public-goods justification
MIT-licensed, forkable by anyone. Every launch through FairLaunch makes the
EVM retail ecosystem marginally safer — fewer rugs, verifiable fairness. The
fee model (0.02 BNB/launch) sustains maintenance without rent extraction, and
the security report is published so other builders learn from the findings.

---

## QF campaign plan (not submitted — his playbook)

Quadratic funding rewards *breadth* of support: many small donors beat a few
large ones. His edge is 60k subscribers.

1. **Apply by Oct 16** (late window until Oct 29 if needed).
2. **When the donation round opens**, publish a video: "my open-source project
   is in Gitcoin Grants — $1 from you unlocks matching funds." Explain QF
   simply: small donations from many people = big matching.
3. **Make donating frictionless**: pin the grant link, do a live walkthrough
   of donating $1–5 on stream.
4. **Sybil honesty**: only real humans count (Passport/COCM filters bots) —
   ask the actual community, don't farm.
5. Every donor is also a future user: follow up with the dogfood token launch.
