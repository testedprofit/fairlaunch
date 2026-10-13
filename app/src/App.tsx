import { useEffect, useState } from "react";
import { ethers } from "ethers";
import LaunchForm from "./components/LaunchForm";
import Explore from "./components/Explore";
import LaunchDetail from "./components/LaunchDetail";
import { CHAINS, isDeployed } from "./config";
import { switchChain } from "./lib/contracts";

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [tab, setTab] = useState<"launch" | "explore">("launch");
  const [selected, setSelected] = useState<string | null>(null);

  async function refresh() {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts: string[] = await provider.send("eth_accounts", []);
      setAccount(accounts.length ? accounts[0] : null);
      const net = await provider.getNetwork();
      setChainId(Number(net.chainId));
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    refresh();
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", refresh);
      window.ethereum.on("chainChanged", () => window.location.reload());
    }
    return () => {
      window.ethereum?.removeListener?.("accountsChanged", refresh);
    };
  }, []);

  async function connect() {
    if (!window.ethereum) {
      alert("Install MetaMask to use FairLaunch.");
      return;
    }
    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    refresh();
  }

  const netKnown = chainId !== null && CHAINS[chainId] !== undefined;
  const netLive = chainId !== null && isDeployed(chainId);

  return (
    <div className="wrap">
      <header className="top">
        <div>
          <div className="logo">Fair<span>Launch</span></div>
          <p className="tagline">Fair token launches on BNB Chain — anti-whale caps, vesting & LP locks in one click.</p>
        </div>
        {account ? (
          <div className="addr">
            <span style={{ color: "var(--green)" }}>●</span>
            {account.slice(0, 6)}…{account.slice(-4)}
          </div>
        ) : (
          <button className="btn" style={{ marginTop: 0 }} onClick={connect}>
            Connect wallet
          </button>
        )}
      </header>

      {chainId !== null && !netKnown && (
        <div className="alert warn">
          You're on an unsupported network (chain {chainId}). Pick a supported chain below.
        </div>
      )}
      {chainId !== null && netKnown && !netLive && (
        <div className="alert warn">
          FairLaunch isn't deployed on {CHAINS[chainId].name} yet — switch to a live chain below.
        </div>
      )}

      <nav className="tabs" style={{ marginBottom: 16 }}>
        {Object.values(CHAINS).map((c) => (
          <button
            key={c.chainId}
            className={chainId === c.chainId ? "active" : ""}
            disabled={!isDeployed(c.chainId)}
            onClick={() => switchChain(c.chainId).catch(() => {})}
            title={isDeployed(c.chainId) ? `Switch to ${c.name}` : `${c.name} — coming soon`}
          >
            {c.shortName}
            {!isDeployed(c.chainId) && " · soon"}
          </button>
        ))}
      </nav>

      {selected ? (
        <LaunchDetail token={selected} account={account} onBack={() => setSelected(null)} />
      ) : (
        <>
          <div className="hero">
            <h1>Launch a token your <span>holders can trust</span></h1>
            <p>
              Every FairLaunch token ships with a max-wallet anti-whale cap, a trading gate you
              control, team tokens locked in audited vesting vaults, and provable liquidity locks.
            </p>
            <div className="checks">
              <div>✓ Anti-whale wallet cap</div>
              <div>✓ Vesting vaults</div>
              <div>✓ LP locking</div>
              <div>✓ One transaction</div>
            </div>
          </div>
          <nav className="tabs">
            <button className={tab === "launch" ? "active" : ""} onClick={() => setTab("launch")}>
              🚀 Launch
            </button>
            <button className={tab === "explore" ? "active" : ""} onClick={() => setTab("explore")}>
              🔍 Explore
            </button>
          </nav>
          {tab === "launch" ? (
            <LaunchForm account={account} onLaunched={(t) => setSelected(t)} />
          ) : (
            <Explore onSelect={(t) => setSelected(t)} />
          )}
        </>
      )}
    </div>
  );
}
