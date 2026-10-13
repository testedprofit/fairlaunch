# FairLaunch — fair token launches on BNB Chain

**One transaction. A token holders can trust.**

FairLaunch lets any creator launch a token on BNB Chain with the trust mechanics
baked in from block one:

- **Anti-whale wallet cap** — no single wallet (outside exemptions) can hold more
  than X% of supply once trading is live.
- **Trading gate** — the creator funds vesting and seeds liquidity *before* the
  public can trade. No snipers, no chaos at block zero.
- **Team vesting vaults** — allocations locked in audited OpenZeppelin
  `VestingWallet` contracts, released linearly. No "team dumps on day one".
- **Provable LP locks** — lock PancakeSwap (or any) LP tokens until a date you
  choose, verifiable on-chain by anyone.

## Grant pitch (for the BNB Chain Builder Grant)

Memecoins drive the majority of retail activity on BNB Chain, but launching one
fairly today requires either trusting a pay-to-play launchpad or hand-rolling
Solidity. FairLaunch is the creator-first fair launcher: a free, open,
one-click factory that makes the *safe* way to launch also the *easy* way —
growing trustworthy on-chain activity, which is exactly what the ecosystem
rewards.

## Repo layout

```
fairlaunch/
├── contracts/
│   ├── CreatorToken.sol      # ERC20 + wallet cap + trading gate
│   ├── FairLaunchFactory.sol # one-click launch: token + vesting vaults + fee
│   └── LiquidityLocker.sol   # time-lock vault for LP tokens
├── test/
│   └── FairLaunch.test.js    # 11 tests, all passing
├── scripts/
│   └── deploy.js             # deploys factory + locker
├── app/                      # Vite + React + ethers v6 frontend
│   └── src/
│       ├── components/       # LaunchForm, Explore, LaunchDetail
│       └── lib/contracts.ts  # ABIs + wallet helpers
├── WHITEPAPER.md             # tokenomics, use cases, competition, roadmap
├── grant-application.md      # BNB Builder Grant draft answers
└── README.md
```

Vesting uses OpenZeppelin's audited `VestingWallet` — no custom vesting math.

## Local development

```bash
cd ~/workspace/fairlaunch
npm install --legacy-peer-deps   # first time only

# run the test suite
npx hardhat test

# terminal 1: local chain
npx hardhat node
# terminal 2: deploy to it
npx hardhat run scripts/deploy.js --network localhost
# terminal 3: frontend (paste the printed addresses into app/.env)
cd app && npm install --legacy-peer-deps && npm run dev
```

Open http://localhost:5173, connect MetaMask (import a Hardhat test key), and
launch a token.

## Testnet deployment (BSC Testnet, chain 97)

1. Get test BNB from the [BSC testnet faucet](https://testnet.bnbchain.org/faucet-smart).
2. Deploy (key never touches a file — pass it as an env var):
   ```bash
   DEPLOYER_KEY=0xYourPrivateKey npx hardhat run scripts/deploy.js --network bscTestnet
   ```
3. Copy the printed addresses into `app/.env`:
   ```
   VITE_FACTORY_ADDRESS=0x...
   VITE_LOCKER_ADDRESS=0x...
   ```
4. (Optional) verify on BscScan:
   ```bash
   npx hardhat verify --network bscTestnet <FACTORY_ADDRESS>
   npx hardhat verify --network bscTestnet <LOCKER_ADDRESS>
   ```

## Demo script (for your grant video)

1. **Connect** MetaMask on BSC Testnet.
2. **Launch tab** — deploy "DemoCoin": 1M supply, 2% max wallet, one team
   allocation vesting over 365 days. One transaction, ~$0.01 in gas + 0.02 BNB protocol fee.
3. **Token page** — show trading is GATED, vesting vault funded, countdown live.
4. **Enable trading** as the owner — show the pill flip to LIVE.
5. **Vesting** — as the beneficiary, release the claimable portion.
6. **LP locks** — lock mock LP tokens for 30 days, show the on-chain lock; try
   withdrawing early (reverts), the money stays put.
7. **Explore tab** — every launch is listed transparently.

## Honest disclosures (put these in the grant app)

- Contracts are **not yet audited**. They compose audited OpenZeppelin
  primitives (`ERC20`, `Ownable`, `VestingWallet`, `SafeERC20`); the custom
  logic (wallet cap, trading gate, factory orchestration, locker) is covered
  by 9 automated tests. A professional audit is the planned use of grant
  funds before mainnet promotion with real user funds.
- Testnet-first: the live demo runs on BSC Testnet; mainnet deployment follows
  audit + a bug-bounty window.

## Roadmap

- One-click "add PancakeSwap liquidity + lock LP" (currently two steps)
- Per-launch pages with holder-distribution charts (the due-diligence view)
- Timelock + multisig option for team-controlled launches
- Creator profiles: verify your YouTube/Twitch and badge your launches
