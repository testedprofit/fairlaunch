import { useEffect, useState } from "react";
import { getFactory, getProvider, getToken, fmt, fmtDate, shortAddr } from "../lib/contracts";

interface LaunchRow {
  token: string;
  creator: string;
  timestamp: number;
  name: string;
  symbol: string;
  supply: string;
}

export default function Explore({ onSelect }: { onSelect: (token: string) => void }) {
  const [rows, setRows] = useState<LaunchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const provider = await getProvider();
        const factory = await getFactory(provider);
        const count: bigint = await factory.launchCount();
        const out: LaunchRow[] = [];
        for (let i = Number(count) - 1; i >= 0 && out.length < 50; i--) {
          const l = await factory.launches(i);
          const t = getToken(l.token, provider);
          const [name, symbol, supply] = await Promise.all([
            t.name(),
            t.symbol(),
            t.totalSupply(),
          ]);
          out.push({
            token: l.token,
            creator: l.creator,
            timestamp: Number(l.timestamp),
            name,
            symbol,
            supply: fmt(supply),
          });
        }
        setRows(out);
      } catch (e: any) {
        setError(e?.message || "Failed to load launches");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="card"><p className="muted">Loading launches…</p></div>;
  if (error) return <div className="card"><div className="alert error">{error}</div></div>;
  if (!rows.length)
    return (
      <div className="card">
        <h2>No launches yet</h2>
        <p className="muted">Be the first — head to the Launch tab.</p>
      </div>
    );

  return (
    <div className="card">
      <h2>All launches</h2>
      <table>
        <thead>
          <tr>
            <th>Token</th>
            <th>Supply</th>
            <th>Creator</th>
            <th>Launched</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.token} className="clickable" onClick={() => onSelect(r.token)}>
              <td>
                <strong>{r.name}</strong> <span className="muted">${r.symbol}</span>
                <br />
                <span className="muted">{shortAddr(r.token)}</span>
              </td>
              <td>{r.supply}</td>
              <td>{shortAddr(r.creator)}</td>
              <td>{fmtDate(r.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
