// Fill these in after deploying (see README), or set VITE_FACTORY_ADDRESS /
// VITE_LOCKER_ADDRESS in app/.env
export const FACTORY_ADDRESS =
  import.meta.env.VITE_FACTORY_ADDRESS ||
  "0x0000000000000000000000000000000000000000";
export const LOCKER_ADDRESS =
  import.meta.env.VITE_LOCKER_ADDRESS ||
  "0x0000000000000000000000000000000000000000";

// BNB Chain networks
export const NETWORKS: Record<number, { name: string; rpc: string; explorer: string }> = {
  97: {
    name: "BSC Testnet",
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
    explorer: "https://testnet.bscscan.com",
  },
  56: {
    name: "BNB Chain",
    rpc: "https://bsc-dataseed.binance.org",
    explorer: "https://bscscan.com",
  },
  31337: { name: "Local Hardhat", rpc: "http://127.0.0.1:8545", explorer: "" },
};
