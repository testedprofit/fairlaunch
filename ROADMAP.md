# FairLaunch — Phased Plan: Concept → Mainnet → Scale

> Owner split: **Muse (AI dev)** builds; **Robert (human dev)** handles wallets,
> accounts, money, and submissions. Nothing is submitted or signed in his name
> without his explicit approval.

---

## Phase 0 — Concept & build ✅ DONE (Oct 13, 2026)

- Contracts written, 16/16 tests passing (incl. 3 real bugs caught by tests: trading-gate/vesting, fee-on-transfer locks, 24KB factory limit)
- Frontend built (launch / explore / manage), builds clean
- Protocol fee model (0.02 BNB/launch → treasury)
- Whitepaper, grant-application draft ($25k ask), README runbook
- Deployer wallet generated (`deployer-key.txt`, his to import)

**Exit:** everything above exists in `~/workspace/fairlaunch/`.

## Phase 1 — Testnet launch 🔄 IN PROGRESS

**Goal:** live contracts on BSC Testnet + working demo dApp.

| # | Task | Owner | Cost |
|---|------|-------|------|
| 1 | Fund deployer `0x5576Cb7F445e214aca6A1909e6D94AB3F822Ff2c` with ≥0.002 BNB on BSC **mainnet** (faucet anti-bot rule) | Robert | ~$2 |
| 2 | Retry faucet → 0.3 tBNB to deployer | Muse | $0 |
| 3 | `DEPLOYER_KEY=… npx hardhat run scripts/deploy.js --network bscTestnet` | Muse | ~$0.05 gas |
| 4 | Verify contracts on BscScan testnet | Muse | $0 |
| 5 | Fill contract addresses into `app/.env`, rebuild frontend | Muse | $0 |
| 6 | Robert imports `deployer-key.txt` into MetaMask, then deletes the file | Robert | $0 |
| 7 | End-to-end demo: launch a test token, vest, enable trading, lock LP | Muse + Robert | $0 |

**Workarounds if (1) is a problem:**
- **A.** Robert claims the faucet himself from any wallet holding ≥0.002
  mainnet BNB, then sends the 0.3 tBNB (testnet, free) to the deployer address.
- **B.** Robert creates a free QuickNode/Chainstack account and drips tBNB
  straight to the deployer address — no mainnet BNB needed at all.
- **C.** Skip testnet and deploy straight to mainnet — **not recommended**:
  unaudited contracts + real money violates our own whitepaper.

**Exit:** BscScan testnet links for factory + locker; demo video recorded.

## Phase 2 — Public presence (days)

**Goal:** look like a real project before the grant window opens Nov 1.

| # | Task | Owner | Cost |
|---|------|-------|------|
| 1 | Push code to a public GitHub repo | Robert (5-min account) + Muse (prepares repo) | $0 |
| 2 | Buy domain (`fairlaunch.xyz` suggested) on Cloudflare Registrar | Robert | ~$10/yr |
| 3 | Deploy frontend to Vercel (free), point domain at it | Robert (1-click) + Muse (guides) | $0 |
| 4 | Record demo video (README has the script; ~5 min) | Robert | $0 |
| 5 | Fill demo/contract links into `grant-application.md` | Muse | $0 |

**Exit:** live URL, public repo, demo video, completed application draft.

## Phase 3 — Grant application (Nov 1–7, 2026)

**Goal:** submit to the BNB Chain Builder Grant.

| # | Task | Owner |
|---|------|-------|
| 1 | Paste drafted answers into the Monday form, attach demo + repo + whitepaper | Robert |
| 2 | Announce the build to his audience (content = traction evidence) | Robert |
| 3 | If rejected: re-apply Dec 1–7 with improvements; meanwhile pursue Base Creator Grant + Superteam bounties in parallel | Muse + Robert |

**Exit:** application submitted; decision expected end of November.

## Phase 4 — Audit & hardening (grant-funded, ~4 weeks)

**Goal:** make mainnet safe.

| # | Task | Owner | Cost |
|---|------|-------|------|
| 1 | Professional audit of the 3 contracts (e.g. Coinspect, Hacken, or equivalent) | Grant ($12k) | $12,000 |
| 2 | Remediate findings, re-test, redeploy to testnet | Muse | $0 |
| 3 | Small public bug bounty (e.g. $1–2k pool) | Grant | ~$1,500 |
| 4 | Move factory ownership toward multisig/timelock design | Muse | $0 |

**Exit:** published audit report, all findings addressed.

## Phase 5 — Mainnet launch (~2–4 weeks after audit)

**Goal:** real users, real launches.

| # | Task | Owner | Cost |
|---|------|-------|------|
| 1 | Deploy factory + locker to BNB Chain mainnet | Robert (his mainnet wallet this time) | ~$2–5 gas |
| 2 | Verify on BscScan, point production frontend at mainnet | Muse | $0 |
| 3 | Ship one-click "add PancakeSwap liquidity + lock LP" | Muse | grant ($8k) |
| 4 | Ship per-launch holder-distribution analytics | Muse | grant |
| 5 | First 3 creator launches — dogfood via Robert's own channel | Robert | $0 |

**Exit:** mainnet dApp live, ≥3 real launches, analytics working.

## Phase 6 — Scale (months 3–6)

**Goal:** usage that justifies the project's existence.

- **Creator onboarding:** 10 verified creator launches; tutorial video series on
  the 60k-sub channel (grant $5k).
- **Metrics that matter:** launches/week, total value locked in lockers,
  % of launches with full trust checklist. Publish them.
- **Second funding:** re-apply to BNB Builder Grant with traction, or Base/Sui
  equivalents; Superteam content bounties for ongoing marketing.
- **$FLNCH evaluation:** only if 1,000+ cumulative launches (per whitepaper).
- **Decentralization:** factory ownership to multisig/timelock; publish
  treasury reports.

**Exit:** self-sustaining fee revenue or follow-on funding; path to 1,000 launches.

---

## Cost summary (out of Robert's pocket, excluding grant)

| Item | Cost |
|---|---|
| Faucet unlock (0.002 BNB mainnet, stays his) | ~$2 |
| Domain (optional but recommended) | ~$10/yr |
| Mainnet deploy gas (Phase 5) | ~$2–5 |
| **Total to reach mainnet** | **under $20** |

The expensive part (audit) is what the grant pays for — that's the entire
strategy: grant funds security, Robert's distribution drives usage, fees
sustain the project.
