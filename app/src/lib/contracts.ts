import { ethers } from "ethers";
import { FACTORY_ADDRESS, LOCKER_ADDRESS } from "../config";

export const FACTORY_ABI = [
  "function createLaunch(string name_, string symbol_, uint256 totalSupply_, uint256 maxWalletBps_, tuple(address beneficiary, uint256 amount, uint64 start, uint64 duration)[] allocations) returns (address token)",
  "function launchCount() view returns (uint256)",
  "function launchFee() view returns (uint256)",
  "function launches(uint256) view returns (address token, address creator, address[] vestingWallets, uint256 timestamp)",
  "event LaunchCreated(address indexed token, address indexed creator, address[] vestingWallets, uint256 totalSupply, uint256 timestamp)",
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

export function getFactory(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signerOrProvider);
}

export function getLocker(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(LOCKER_ADDRESS, LOCKER_ABI, signerOrProvider);
}

export function getToken(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, TOKEN_ABI, signerOrProvider);
}

export function getVesting(address: string, signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(address, VESTING_ABI, signerOrProvider);
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
