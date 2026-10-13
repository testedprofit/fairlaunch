# FairLaunch Whitepaper

**Fair token launches on BNB Chain — trust by default, not by premium.**
Version 1.0 · October 2026

---

## 1. Abstract

Retail token launches are a trust lottery. On BNB Chain — the largest retail
trading venue in crypto — most new tokens launch with unlocked team wallets,
snipeable openings, uncapped whale accumulation, and pullable liquidity. Buyers
cannot distinguish a fair launch from a slow rug, and creators who *want* to
launch fairly must either pay an extractive launchpad or hand-roll Solidity.

FairLaunch is a creator-first fair-launch factory: **one transaction** deploys a
token with four trust mechanics baked in — an anti-whale wallet cap, a trading
gate the creator controls, team tokens locked in audited vesting vaults, and
provable liquidity locks. Launching the *safe* way becomes the *easy* way, at a
flat protocol fee of 0.02 BNB (~$1–2).

## 2. The problem

Three failure modes destroy holder trust in retail launches:

1. **Whale concentration.** A single holder with 15–20% of supply can nuke the
   chart at will. Holders find out *after* the dump.
2. **Unlocked team supply.** "Team tokens" with no vesting schedule are a
   promise, not a mechanism. Promises get broken.
3. **Pullable liquidity.** If LP tokens aren't locked, liquidity is a rumor.
   Removal is one transaction away, forever.

Existing options don't fix this. Launchpads charge for trust as a premium
feature and optimize for their own fees. Bonding-curve launchers offer no
vesting or locks. Hand-rolling is inaccessible to the creators who need it
most — and unaudited copy-paste Solidity is how hacks happen.

## 3. The solution

FairLaunch inverts the default: every token launched through the factory ships
with all four trust mechanics **on by default**, configured by the creator in a
web form, deployed in a single transaction for ~$0.01 in gas plus the flat
protocol fee.

The buyer-facing promise is simple and verifiable on-chain: *this token's team
can't dump, whales are capped, and liquidity is locked until <date>.*

## 4. How it works

**Creator flow (under 10 minutes):**
1. Connect wallet on the FairLaunch dApp.
2. Fill the launch form: name, symbol, supply, max-wallet %, team vesting
   allocations (beneficiary, amount, start, duration).
3. Submit — one transaction deploys the token, funds each vesting vault, and
   returns remaining supply to the creator for LP seeding.
4. Add liquidity on PancakeSwap, then lock the LP tokens in the FairLaunch
   locker until a chosen date.
5. Enable public trading when ready. The gate prevents snipers during setup.

**Holder flow:** open any launch page and verify — wallet cap, vesting vaults
with countdowns, LP lock with unlock date — all on-chain, no trust required.

## 5. Architecture

Three contracts, no proxies, no admin keys beyond the documented switches:

- **`CreatorToken.sol`** — ERC20 with `maxWalletBps` (anti-whale cap, enforced
  only after trading is enabled so pre-launch setup is never blocked) and a
  `tradingEnabled` gate. Owner can exempt addresses (e.g. the PancakeSwap
  router). Built on OpenZeppelin `ERC20` + `Ownable`.
- **`FairLaunchFactory.sol`** — `createLaunch()` deploys the token, deploys one
  audited OpenZeppelin `VestingWallet` per team allocation (exempted on the
  token so releases always work), funds them, and emits `LaunchCreated` for
  transparent indexing. Collects the flat protocol fee to the treasury.
- **`LiquidityLocker.sol`** — time-lock vault for any LP tokens. `lock()` /
  `withdraw()`; early withdrawal reverts on-chain. Deposits are
  balance-measured, so fee-on-transfer tokens can't brick a lock. Compatible
  with PancakeSwap v2/v3 LP tokens.

**Multichain-native.** The factory deploys tokens via CREATE2 with
`salt = keccak256(creator, nonce)`, and the factory itself is deployed via the
canonical keyless deployer — so FairLaunch lives at the same addresses on every
EVM chain. One registry, one frontend, per-chain sovereignty, zero bridges
(bridges are unnecessary attack surface for a factory). Full procedure:
[MULTICHAIN.md](./MULTICHAIN.md). Security review: [SECURITY.md](./SECURITY.md).

Deliberate omissions: no custom vesting math (audited OZ instead), no
upgradeable proxies (immutable = trustworthy), no blacklist/tax functions
(those are the tools of the scams this project fights).

## 6. Tokenomics

### 6.1 Launch-template tokenomics

FairLaunch doesn't dictate tokenomics — it enforces *whatever the creator
commits to, transparently*. The dApp ships three recommended presets:

| | Meme / creator coin | Community / DAO | Utility |
|---|---|---|---|
| Supply | 1,000,000,000 | 100,000,000 | 10,000,000 |
| Team (vested) | 10% · 12 mo linear | 15% · 18 mo linear | 20% · 24 mo + 6 mo cliff |
| Liquidity (LP locked) | 60% · lock 12 mo | 40% · lock 12 mo | 30% · lock 12 mo |
| Community / rewards | 20% | 35% | 40% ecosystem |
| Treasury / creator liquid | 10% | 10% | 10% |
| Max wallet | 2% | 3% | 5% |

The non-negotiable principle: **team allocations must vest, liquidity must
lock.** The durations are the creator's choice — but the *existence* of the
lock is what holders verify.

### 6.2 The four trust mechanics (why each exists)

- **Wallet cap** kills the single-whale-dump vector. Set too low it hurts
  legitimate accumulation; 2–5% is the sane band.
- **Trading gate** separates *setup* from *trading*. Snipers feast on chaotic
  openings; the gate lets the creator finish vesting + liquidity first.
- **Vesting vaults** convert "trust me" into "verify the contract." Linear
  release, beneficiary-claimed, no backdoors.
- **LP locks** convert "liquidity is safe" into a timestamp anyone can read.

### 6.3 Protocol economics (FairLaunch itself)

FairLaunch charges a **flat 0.02 BNB per launch** (~$1–2) — orders of magnitude
below launchpad fees, enough to sustain the project:

| Treasury allocation | Share | Purpose |
|---|---|---|
| Security fund | 50% | Audits, bug bounties, monitoring |
| Development | 30% | Features, maintenance, infra |
| Creator rebates | 20% | Fee rebates for verified creators |

Sustainability sketch: 500 launches/month → 10 BNB/month covers infrastructure
and ongoing development; every additional launch is margin. The fee is settable
by the factory owner (currently the deployer; intended to move to a timelock /
multisig post-traction) and can be lowered to zero — the fee is a sustainability
mechanism, not a rent extraction.

### 6.4 Future protocol token — $FLNCH (NOT launched)

FairLaunch has **no token today, and needs none** — the fee model works in BNB.
A protocol token will only be considered after **1,000+ cumulative launches**,
and only with utility from day one:

- **Fee payment** — pay launch fees in $FLNCH at 50% discount.
- **Governance** — vote on fee level and treasury allocation.
- **Staking for visibility** — stake to feature launches (no pay-to-win).

If launched: 100M fixed supply — 40% community rewards (earned, never sold),
25% treasury, 20% team (4-year vest), 15% liquidity. **No presale, no private
sale, no VC allocation.** The token must be earned through usage, mirroring the
fairness the product sells. This section is a commitment device: if a token
ever appears without these properties, it isn't following this paper.

## 7. Use cases

1. **Creator coins (primary).** A YouTuber or streamer launches a community
   token with vested team allocation and locked liquidity — the audience can
   verify fairness instead of taking the creator's word. The founder's own
   60k-subscriber channel is the first distribution channel.
2. **Fair meme launches.** The BNB Chain casino, minus the standard scams:
   capped whales, locked team, locked LP — the three things meme buyers
   actually check.
3. **DAO / community bootstrapping.** Transparent team vesting + treasury
   allocation, all verifiable before anyone buys in.
4. **Gaming guild tokens.** Vested allocations for guild leadership, locked
   liquidity for the in-game economy's trading pair.
5. **Fundraiser / charity tokens.** Donors verify the team's allocation is
   locked and the liquidity can't be pulled — accountability as a feature.

## 8. Competitive landscape

| | FairLaunch | PinkSale-style launchpads | Bonding-curve launchers | Hand-rolled |
|---|---|---|---|---|
| Cost to launch fairly | ~$1–2 flat | % of raise + fees | Low | Free but risky |
| Vesting built in | ✅ (audited) | Paid add-on | ❌ | DIY |
| LP locking built in | ✅ | Paid add-on | ❌ | DIY |
| Wallet caps | ✅ | Optional | ❌ | DIY |
| Trust model | Verify on-chain | Trust the platform | None | Trust the dev |
| Open / composable | ✅ | ❌ | Partial | n/a |

FairLaunch's edge isn't a feature — it's the *default*. Competitors sell trust
as an upsell; FairLaunch makes it the only option.

## 9. Roadmap

- **Phase 1 (now)** — Testnet dApp live; 16/16 contract tests passing (incl. CREATE2 proof + red-team cases); grant
  application (BNB Chain Builder Grant, Nov 2026 window).
- **Phase 2 (grant-funded)** — Professional audit + remediation; mainnet
  deployment; one-click "add PancakeSwap liquidity + lock LP"; per-launch
  holder-distribution analytics.
- **Phase 3** — Creator onboarding (10 verified creator launches); video
  tutorial series; timelock/multisig for factory ownership; $FLNCH evaluation
  *only* if the 1,000-launch threshold is met.

## 10. Team

Solo founder: Robert Serrano ("Maskedmage") — launched and operated a token
(PNET, Algorand) and learned the failure modes firsthand: whale concentration,
unlocked-supply fear, fragmented liquidity. Content creator (60k YouTube, 25k
Twitch) — distribution most devs lack. Builds AI-assisted (Cursor/Claude);
independent audit provides the second pair of eyes.

## 11. Risks & disclosures

- **Contracts are unaudited.** They compose audited OpenZeppelin primitives and
  are covered by automated tests; a professional audit precedes any mainnet
  promotion involving real user funds.
- **Smart-contract risk** is inherent; users should never launch with more at
  stake than they can afford to lose.
- **Creators are responsible for their own launches** — FairLaunch provides
  mechanics, not legal or financial advice. Securities considerations are the
  launcher's responsibility.
- **BNB Chain dependence** — fees, throughput, and ecosystem health are
  inherited from the chain.
- **Key management** — the token owner controls the trading gate; lost keys
  mean a permanently gated token. Multisig ownership is recommended for
  serious launches (Phase 3).

## 12. Conclusion

The retail launch market doesn't have a technology problem — it has a
*defaults* problem. Every tool a fair launcher needs already exists; they're
just never all turned on. FairLaunch turns them all on, in one transaction,
for a dollar. Trust stops being a marketing claim and becomes something you
can read on-chain.

---

*FairLaunch is open source. Verify, don't trust.*
