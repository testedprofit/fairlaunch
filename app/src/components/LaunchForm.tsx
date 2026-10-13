import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getFactory, getProvider, getSigner, shortAddr } from "../lib/contracts";

interface Allocation {
  beneficiary: string;
  amount: string;
  startDate: string;
  durationDays: string;
}

const emptyAlloc = (): Allocation => ({
  beneficiary: "",
  amount: "",
  startDate: new Date().toISOString().slice(0, 10),
  durationDays: "365",
});

export default function LaunchForm({
  account,
  onLaunched,
}: {
  account: string | null;
  onLaunched: (token: string) => void;
}) {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [supply, setSupply] = useState("1000000");
  const [maxWalletPct, setMaxWalletPct] = useState("2");
  const [allocs, setAllocs] = useState<Allocation[]>([emptyAlloc()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const [fee, setFee] = useState<bigint>(0n);

  useEffect(() => {
    (async () => {
      try {
        const factory = getFactory(await getProvider());
        setFee(await factory.launchFee());
      } catch {
        /* factory not deployed / no wallet — fee stays 0 */
      }
    })();
  }, []);

  const setAlloc = (i: number, patch: Partial<Allocation>) => {
    setAllocs((a) => a.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setDone("");
    if (!account) {
      setError("Connect your wallet first.");
      return;
    }
    try {
      setBusy(true);
      const signer = await getSigner();
      const factory = getFactory(signer);
      const allocations = allocs
        .filter((a) => a.beneficiary && a.amount)
        .map((a) => ({
          beneficiary: a.beneficiary,
          amount: ethers.parseEther(a.amount),
          start: Math.floor(new Date(a.startDate + "T00:00:00Z").getTime() / 1000),
          duration: Number(a.durationDays) * 86400,
        }));
      const tx = await factory.createLaunch(
        name,
        symbol,
        ethers.parseEther(supply),
        Math.round(Number(maxWalletPct) * 100), // % -> bps
        allocations,
        { value: fee }
      );
      const receipt = await tx.wait();
      let tokenAddr = "";
      for (const log of receipt.logs) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed && parsed.name === "LaunchCreated") {
            tokenAddr = parsed.args.token;
            break;
          }
        } catch {
          /* not our event */
        }
      }
      setDone(tokenAddr || tx.hash);
      if (tokenAddr) onLaunched(tokenAddr);
    } catch (err: any) {
      setError(err?.reason || err?.message || "Transaction failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>Launch a fair token</h2>
      <p className="muted">
        Deploys your token with an anti-whale wallet cap, a trading gate you control, and
        audited vesting vaults for team allocations — in one transaction.
      </p>
      <form onSubmit={submit}>
        <div className="row">
          <div>
            <label>Token name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Moon Creator" required />
          </div>
          <div>
            <label>Symbol</label>
            <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="MOON" required />
          </div>
        </div>
        <div className="row">
          <div>
            <label>Total supply</label>
            <input value={supply} onChange={(e) => setSupply(e.target.value)} placeholder="1000000" required />
          </div>
          <div>
            <label>Max wallet (% of supply)</label>
            <input value={maxWalletPct} onChange={(e) => setMaxWalletPct(e.target.value)} placeholder="2" required />
          </div>
        </div>

        <h3>Team vesting allocations</h3>
        <p className="muted">Locked in audited OpenZeppelin vesting vaults, released linearly.</p>
        {allocs.map((a, i) => (
          <div className="vest-row" key={i}>
            <div style={{ flex: 2 }}>
              <input value={a.beneficiary} onChange={(e) => setAlloc(i, { beneficiary: e.target.value })} placeholder="Beneficiary 0x…" />
            </div>
            <div style={{ flex: 1 }}>
              <input value={a.amount} onChange={(e) => setAlloc(i, { amount: e.target.value })} placeholder="Amount" />
            </div>
            <div style={{ flex: 1 }}>
              <input type="date" value={a.startDate} onChange={(e) => setAlloc(i, { startDate: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <input value={a.durationDays} onChange={(e) => setAlloc(i, { durationDays: e.target.value })} placeholder="Days" />
            </div>
            <button type="button" className="btn secondary" style={{ marginTop: 0 }} onClick={() => setAllocs((x) => x.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
        ))}
        <button type="button" className="btn secondary" onClick={() => setAllocs((x) => [...x, emptyAlloc()])}>
          + Add allocation
        </button>

        <p className="muted" style={{ marginTop: 16 }}>
          Protocol fee: <strong>{ethers.formatEther(fee)} BNB</strong> — funds audits and
          development. Gas is ~$0.01 on BNB Chain.
        </p>

        {error && <div className="alert error">{error}</div>}
        {done && (
          <div className="alert ok">
            Launched! Token: <code>{shortAddr(done)}</code>
          </div>
        )}
        <button className="btn" disabled={busy} type="submit">
          {busy ? "Deploying…" : "Deploy fair launch"}
        </button>
      </form>
    </div>
  );
}
