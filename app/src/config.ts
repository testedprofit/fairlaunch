// Multichain registry. FairLaunch is deployed per chain at deterministic
// addresses (see MULTICHAIN.md). A zero factory address means "not deployed
// yet" — the UI shows the chain as coming soon.
export const ZERO = "0x0000000000000000000000000000000000000000";

export interface ChainConfig {
  chainId: number;
  name: string;
  shortName: string;
  factory: string;
  locker: string;
  explorer: string;
  rpc: string;
  // hex chain id for wallet_switchEthereumChain
  hexId: string;
}

export const CHAINS: Record<number, ChainConfig> = {
  97: {
    chainId: 97,
    name: "BSC Testnet",
    shortName: "BSC Test",
    factory: ZERO, // fill after testnet deploy
    locker: ZERO,
    explorer: "https://testnet.bscscan.com",
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
    hexId: "0x61",
  },
  56: {
    chainId: 56,
    name: "BNB Chain",
    shortName: "BNB",
    factory: ZERO, // mainnet deploy follows audit (Phase 4/5)
    locker: ZERO,
    explorer: "https://bscscan.com",
    rpc: "https://bsc-dataseed.binance.org",
    hexId: "0x38",
  },
  8453: {
    chainId: 8453,
    name: "Base",
    shortName: "Base",
    factory: ZERO, // planned: qualifies for Base grants
    locker: ZERO,
    explorer: "https://basescan.org",
    rpc: "https://mainnet.base.org",
    hexId: "0x2105",
  },
  42161: {
    chainId: 42161,
    name: "Arbitrum One",
    shortName: "Arb",
    factory: ZERO, // planned
    locker: ZERO,
    explorer: "https://arbiscan.io",
    rpc: "https://arb1.arbitrum.io/rpc",
    hexId: "0xa4b1",
  },
  10: {
    chainId: 10,
    name: "Optimism",
    shortName: "OP",
    factory: ZERO, // planned (RetroPGF eligibility)
    locker: ZERO,
    explorer: "https://optimistic.etherscan.io",
    rpc: "https://mainnet.optimism.io",
    hexId: "0xa",
  },
};

export function isDeployed(chainId: number): boolean {
  const c = CHAINS[chainId];
  return !!c && c.factory !== ZERO && c.locker !== ZERO;
}

export function deployedChains(): ChainConfig[] {
  return Object.values(CHAINS).filter((c) => isDeployed(c.chainId));
}
