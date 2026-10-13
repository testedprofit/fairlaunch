import { ethers } from "ethers";
import { CHAINS, ZERO, isDeployed } from "../config";

export const FACTORY_ABI = [
  "function createLaunch(string name_, string symbol_, uint256 totalSupply_, uint256 maxWalletBps_, tuple(address beneficiary, uint256 amount, uint64 start, uint64 duration)[] allocations) returns (address token)",
  "function launchCount() view returns (uint256)",
  "function launchFee() view returns (uint256)",
  "function creatorLaunchNonce(address) view returns (uint256)",
  "function launches(uint256) view returns (address token, address creator, address[] vestingWallets, uint256 timestamp)",
  "event LaunchCreated(address indexed token, address indexed creator, address[] vestingWallets, uint256 totalSupply, uint256 timestamp, uint256 launchNonce)",
];

export const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function maxWalletBps() view returns (uint256)",
  "function tradingEnabled() view returns (bool)",
  "function owner() view returns (address)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function approve(address,uint256) returns (bool)",
  "function transfer(address,uint256) returns (bool)",
  "function enableTrading()",
  "event ExemptionUpdated(address indexed account, bool exempt)",
];

export const LOCKER_ABI = [
  "function lock(address lpToken, uint256 amount, uint64 unlockTime, address beneficiary) returns (uint256)",
  "function withdraw(uint256 lockId)",
  "function locks(uint256) view returns (address lpToken, address beneficiary, uint256 amount, uint64 unlockTime, bool withdrawn)",
  "function lockCount() view returns (uint256)",
];

export const VESTING_ABI = [
  "function beneficiary() view returns (address)",
  "function start() view returns (uint256)",
  "function duration() view returns (uint256)",
  "function released(address) view returns (uint256)",
  "function releasable(address) view returns (uint256)",
  "function release(address)",
];

export async function getSigner(): Promise<ethers.Signer> {
  if (!window.ethereum) throw new Error("No wallet found — install MetaMask.");
  const provider = new ethers.BrowserProvider(window.ethereum);
  return provider.getSigner();
}

export async function getProvider(): Promise<ethers.BrowserProvider> {
  if (!window.ethereum) throw new Error("No wallet found — install MetaMask.");
  return new ethers.BrowserProvider(window.ethereum);
}

export async function chainIdOf(signerOrProvider: ethers.Signer | ethers.Provider): Promise<number> {
  const provider: ethers.Provider | undefined =
    "getNetwork" in signerOrProvider
      ? (signerOrProvider as ethers.Provider)
      : (signerOrProvider as ethers.Signer).provider ?? undefined;
  if (!provider) throw new Error("No provider available");
  return Number((await provider.getNetwork()).chainId);
}

/** Resolve the chain config for the connected wallet; throws if not deployed there. */
export async function activeChain(signerOrProvider: ethers.Signer | ethers.Provider) {
  const chainId = await chainIdOf(signerOrProvider);
  const cfg = CHAINS[chainId];
  if (!cfg) throw new Error(`Chain ${chainId} is not supported by FairLaunch.`);
  if (!isDeployed(chainId))
    throw new Error(`FairLaunch is not deployed on ${cfg.name} yet — coming soon.`);
  return cfg;
}

export async function getFactory(signerOrProvider: ethers.Signer | ethers.Provider) {
  const cfg = await activeChain(signerOrProvider);
  return new ethers.Contract(cfg.factory, FACTORY_ABI, signerOrProvider);
}

export async function getLocker(signerOrProvider: ethers.Signer | ethers.Provider) {
  const cfg = await activeChain(signerOrProvider);
  return new ethers.Contract(cfg.locker, LOCKER_ABI, signerOrProvider);
}

export function getToken(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, TOKEN_ABI, signerOrProvider);
}

export function getVesting(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, VESTING_ABI, signerOrProvider);
}

/** Ask the wallet to switch to a supported chain. */
export async function switchChain(chainId: number) {
  const cfg = CHAINS[chainId];
  if (!cfg) throw new Error("Unknown chain");
  if (!window.ethereum) throw new Error("No wallet found.");
  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: cfg.hexId }],
    });
  } catch (e: any) {
    if (e?.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: cfg.hexId,
            chainName: cfg.name,
            rpcUrls: [cfg.rpc],
            blockExplorerUrls: [cfg.explorer],
            nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
          },
        ],
      });
    } else {
      throw e;
    }
  }
}

export function fmt(bn: bigint): string {
  const s = ethers.formatEther(bn);
  const [i, d] = s.split(".");
  return d ? `${Number(i).toLocaleString()}.${d.slice(0, 4)}` : Number(i).toLocaleString();
}

export function fmtDate(ts: bigint | number): string {
  return new Date(Number(ts) * 1000).toLocaleDateString();
}

export function shortAddr(a: string): string {
  return a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
}

export { ZERO };
