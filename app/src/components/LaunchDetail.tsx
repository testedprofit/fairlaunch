import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  getFactory, getLocker, getProvider, getSigner, getToken, getVesting,
  fmt, fmtDate, shortAddr,
} from "../lib/contracts";

interface VestInfo {
  address: string;
  beneficiary: string;
  start: number;
  duration: number;
  released: bigint;
  releasable: bigint;
}

interface LockInfo {
  id: number;
  lpToken: string;
  beneficiary: string;
  amount: bigint;
  unlockTime: number;
  withdrawn: boolean;
}

export default function LaunchDetail({
  token: tokenAddr,
  account,
  onBack,
}: {
  token: string;
  account: string | null;
  onBack: () => void;
}) {
  const [info, setInfo] = useState<any>(null);
  const [vests, setVests] = useState<VestInfo[]>([]);
  const [locks, setLocks] = useState<LockInfo[]>([]);
  const [vestedPct, setVestedPct] = useState<string>("0");
  const [exemptions, setExemptions] = useState<string[]>([]);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  // LP lock form
  const [lpToken, setLpToken] = useState("");
  const [lpAmount, setLpAmount] = useState("");
  const [unlockDate, setUnlockDate] = useState("");

  async function load() {
    setError("");
    try {
      const provider = await getProvider();
      const t = getToken(tokenAddr, provider);
      const [name, symbol, supply, bps, enabled, owner] = await Promise.all([
        t.name(), t.symbol(), t.totalSupply(), t.maxWalletBps(), t.tradingEnabled(), t.owner(),
      ]);
      setInfo({ name, symbol, supply, bps: Number(bps), enabled, owner });

      // vesting wallets from the LaunchCreated event
      const factory = await getFactory(provider);
      const events = await factory.queryFilter(factory.filters.LaunchCreated(tokenAddr));
      const v: VestInfo[] = [];
      for (const ev of events) {
        const wallets: string[] = (ev as any).args.vestingWallets;
        for (const w of wallets) {
          const vw = getVesting(w, provider);
          const [beneficiary, start, duration, released, releasable] = await Promise.all([
            vw.beneficiary(), vw.start(), vw.duration(),
            vw["released(address)"](tokenAddr), vw["releasable(address)"](tokenAddr),
          ]);
          v.push({
            address: w, beneficiary, start: Number(start), duration: Number(duration),
            released: released as bigint, releasable: releasable as bigint,
          });
        }
      }
      setVests(v);

      // trust metrics: % of supply locked in vesting + current exemptions
      let vestedTotal = 0n;
      for (const w of v) {
        const bal: bigint = await t.balanceOf(w.address);
        vestedTotal += (w.released as bigint) + bal;
      }
      if (supply > 0n) setVestedPct(((vestedTotal * 10000n) / (supply as bigint)).toString());

      const exEvents = await t.queryFilter(t.filters.ExemptionUpdated());
      const exMap = new Map<string, boolean>();
      for (const e of exEvents) {
        const a = (e as any).args;
        exMap.set(a.account.toLowerCase(), a.exempt);
      }
      const addrs: string[] = [];
      exMap.forEach((on, addr) => {
        if (on) addrs.push(addr);
      });
      setExemptions(addrs);

      // all LP locks
      const locker = await getLocker(provider);
      const n: bigint = await locker.lockCount();
      const ls: LockInfo[] = [];
      for (let i = 0; i < Number(n); i++) {
        const l = await locker.locks(i);
        ls.push({
          id: i, lpToken: l.lpToken, beneficiary: l.beneficiary, amount: l.amount,
          unlockTime: Number(l.unlockTime), withdrawn: l.withdrawn,
        });
      }
      setLocks(ls);
    } catch (e: any) {
      setError(e?.message || "Failed to load token");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddr]);

  async function enableTrading() {
    setError(""); setOk("");
    try {
      setBusy("trade");
      const t = getToken(tokenAddr, await getSigner());
      const tx = await t.enableTrading();
      await tx.wait();
      setOk("Trading enabled — the public can now buy (within the wallet cap).");
      load();
    } catch (e: any) {
      setError(e?.reason || e?.message || "Failed");
    } finally {
      setBusy("");
    }
  }

  async function releaseVest(wallet: string) {
    setError(""); setOk("");
    try {
      setBusy(wallet);
      const vw = getVesting(wallet, await getSigner());
      const tx = await vw["release(address)"](tokenAddr);
      await tx.wait();
      setOk("Vested tokens released to the beneficiary.");
      load();
    } catch (e: any) {
      setError(e?.reason || e?.message || "Failed");
    } finally {
      setBusy("");
    }
  }

  async function lockLp(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setOk("");
    if (!account) { setError("Connect your wallet first."); return; }
    try {
      setBusy("lock");
      const signer = await getSigner();
      const locker = await getLocker(signer);
      const unlockTime = Math.floor(new Date(unlockDate + "T00:00:00Z").getTime() / 1000);
      const amount = ethers.parseEther(lpAmount);
      // approve first
      const lp = getToken(lpToken, signer);
      const lockerAddr = await locker.getAddress();
      const allowance: bigint = await lp.allowance(account, lockerAddr);
      if (allowance < amount) {
        const atx = await lp.approve(lockerAddr, amount);
        await atx.wait();
      }
      const tx = await locker.lock(lpToken, amount, unlockTime, account);
      await tx.wait();
      setOk("LP tokens locked. Holders can verify the lock on-chain.");
      setLpToken(""); setLpAmount(""); setUnlockDate("");
      load();
    } catch (e: any) {
      setError(e?.reason || e?.message || "Failed");
    } finally {
      setBusy("");
    }
  }

  async function withdrawLock(id: number) {
    setError(""); setOk("");
    try {
      setBusy("w" + id);
      const locker = await getLocker(await getSigner());
      const tx = await locker.withdraw(id);
      await tx.wait();
      setOk("Lock withdrawn.");
      load();
    } catch (e: any) {
      setError(e?.reason || e?.message || "Failed");
    } finally {
      setBusy("");
    }
  }

  if (!info) return <div className="card"><p className="muted">Loading…</p></div>;

  return (
    <div>
      <button className="btn secondary" style={{ marginTop: 0, marginBottom: 16 }} onClick={onBack}>
        ← All launches
      </button>

      <div className="card">
        <h2>{info.name} <span className="muted">${info.symbol}</span></h2>
        <p className="muted">{shortAddr(tokenAddr)}</p>
        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="stat"><div className="k">Total supply</div><div className="v">{fmt(info.supply)}</div></div>
          <div className="stat"><div className="k">Max wallet</div><div className="v">{(info.bps / 100).toFixed(2)}%</div></div>
          <div className="stat"><div className="k">Trading</div><div className="v"><span className={`pill ${info.enabled ? "on" : "off"}`}>{info.enabled ? "LIVE" : "GATED"}</span></div></div>
          <div className="stat"><div className="k">Owner</div><div className="v" style={{ fontSize: 15 }}>{shortAddr(info.owner)}</div></div>
        </div>
        {!info.enabled && account?.toLowerCase() === info.owner.toLowerCase() && (
          <div>
            <p className="muted">Trading is gated. Enable it when vesting is funded and liquidity is seeded.</p>
            <button className="btn" disabled={busy === "trade"} onClick={enableTrading}>
              {busy === "trade" ? "Enabling…" : "Enable public trading"}
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Trust checklist</h2>
        <p className="muted">Everything below is verifiable on-chain — no trust required.</p>
        <table>
          <tbody>
            <tr>
              <td>✓</td>
              <td>Whale cap</td>
              <td>No wallet can hold more than {(info.bps / 100).toFixed(2)}% of supply</td>
            </tr>
            <tr>
              <td>{info.enabled ? "✓" : "•"}</td>
              <td>Trading gate</td>
              <td>{info.enabled ? "Public trading is live" : "Gated — team is still setting up"}</td>
            </tr>
            <tr>
              <td>{Number(vestedPct) > 0 ? "✓" : "•"}</td>
              <td>Team vesting</td>
              <td>{(Number(vestedPct) / 100).toFixed(2)}% of supply locked in vesting vaults</td>
            </tr>
            <tr>
              <td>{locks.filter((l) => !l.withdrawn).length > 0 ? "✓" : "•"}</td>
              <td>Liquidity locks</td>
              <td>
                {locks.filter((l) => !l.withdrawn).length > 0
                  ? `${locks.filter((l) => !l.withdrawn).length} active lock(s) — liquidity can't be pulled`
                  : "No LP locks yet — ask the creator before buying"}
              </td>
            </tr>
          </tbody>
        </table>
        <h3>Exempt addresses</h3>
        <p className="muted">
          These addresses bypass the wallet cap and trading gate (owner, factory,
          vesting vaults). Any <em>new</em> exemption the owner adds appears here —
          watch this list.
        </p>
        {exemptions.map((a) => (
          <div key={a} className="muted" style={{ fontFamily: "monospace", marginBottom: 4 }}>
            {a}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Team vesting</h2>
        {vests.length === 0 && <p className="muted">No vesting allocations on this launch.</p>}
        {vests.map((v) => (
          <div key={v.address} className="stat" style={{ marginBottom: 12 }}>
            <div className="k">Vault {shortAddr(v.address)} → {shortAddr(v.beneficiary)}</div>
            <div style={{ marginTop: 8, fontSize: 14 }}>
              Vesting {fmtDate(v.start)} → {fmtDate(v.start + v.duration)} ·{" "}
              Released: {fmt(v.released)} · Claimable now: <strong>{fmt(v.releasable)}</strong>
            </div>
            {account?.toLowerCase() === v.beneficiary.toLowerCase() && v.releasable > 0n && (
              <button className="btn secondary" disabled={busy === v.address} onClick={() => releaseVest(v.address)}>
                {busy === v.address ? "Releasing…" : `Release ${fmt(v.releasable)} ${info.symbol}`}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h2>Liquidity locks</h2>
        <p className="muted">Lock LP tokens until a date you choose — proof to holders that liquidity can't be pulled.</p>
        <form onSubmit={lockLp}>
          <div className="row3">
            <div>
              <label>LP token address</label>
              <input value={lpToken} onChange={(e) => setLpToken(e.target.value)} placeholder="0x…" required />
            </div>
            <div>
              <label>Amount</label>
              <input value={lpAmount} onChange={(e) => setLpAmount(e.target.value)} placeholder="1000" required />
            </div>
            <div>
              <label>Unlock date</label>
              <input type="date" value={unlockDate} onChange={(e) => setUnlockDate(e.target.value)} required />
            </div>
          </div>
          <button className="btn" disabled={busy === "lock"} type="submit">
            {busy === "lock" ? "Locking…" : "Lock LP tokens"}
          </button>
        </form>

        <h3>Existing locks</h3>
        {locks.length === 0 && <p className="muted">No locks yet.</p>}
        <table>
          <tbody>
            {locks.map((l) => {
              const unlocked = Date.now() / 1000 >= l.unlockTime;
              const mine = account?.toLowerCase() === l.beneficiary.toLowerCase();
              return (
                <tr key={l.id}>
                  <td>#{l.id}<br /><span className="muted">{shortAddr(l.lpToken)}</span></td>
                  <td>{fmt(l.amount)}<br /><span className="muted">→ {shortAddr(l.beneficiary)}</span></td>
                  <td>Unlocks {fmtDate(l.unlockTime)}<br />
                    <span className={`pill ${l.withdrawn ? "off" : unlocked ? "on" : "off"}`}>
                      {l.withdrawn ? "WITHDRAWN" : unlocked ? "UNLOCKED" : "LOCKED"}
                    </span>
                  </td>
                  <td>
                    {!l.withdrawn && unlocked && mine && (
                      <button className="btn secondary" style={{ marginTop: 0 }} disabled={busy === "w" + l.id} onClick={() => withdrawLock(l.id)}>
                        Withdraw
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && <div className="alert error">{error}</div>}
      {ok && <div className="alert ok">{ok}</div>}
    </div>
  );
}
