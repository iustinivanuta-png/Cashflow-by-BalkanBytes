import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = ""; // folosim proxy-ul din Vite: /transactions, /summary

// ✅ format frumos pentru numere mari (ro-RO)
function fmt(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "0";
  return new Intl.NumberFormat("ro-RO").format(x);
}

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // form add
  const [form, setForm] = useState({
    type: "expense",
    amount: "",
    category: "Food",
    date: new Date().toISOString().slice(0, 10),
    description: "",
  });

  const balanceClass = useMemo(() => {
    if (summary.balance > 0) return "pos";
    if (summary.balance < 0) return "neg";
    return "";
  }, [summary.balance]);

  async function fetchAll() {
    setLoading(true);
    setErr("");
    try {
      const [txRes, sumRes] = await Promise.all([
        fetch(`${API}/transactions`),
        fetch(`${API}/summary`),
      ]);

      if (!txRes.ok)
        throw new Error(
          "Backend-ul nu răspunde (/transactions). Pornește serverul pe 4000."
        );
      if (!sumRes.ok)
        throw new Error(
          "Backend-ul nu răspunde (/summary). Pornește serverul pe 4000."
        );

      const tx = await txRes.json();
      const sum = await sumRes.json();

      setTransactions(Array.isArray(tx) ? tx : []);
      setSummary({
        totalIncome: Number(sum.totalIncome || 0),
        totalExpenses: Number(sum.totalExpenses || 0),
        balance: Number(sum.balance || 0),
      });
    } catch (e) {
      setErr(e.message || "Eroare necunoscută");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  async function addTransaction(e) {
    e.preventDefault();
    setErr("");

    const payload = {
      ...form,
      amount: Number(form.amount),
    };

    if (!payload.amount || Number.isNaN(payload.amount)) {
      setErr("Amount trebuie să fie număr.");
      return;
    }

    try {
      const res = await fetch(`${API}/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Eroare la POST /transactions");
      }

      await fetchAll();

      setForm((f) => ({
        ...f,
        amount: "",
        description: "",
      }));
    } catch (e) {
      setErr(e.message || "Eroare la adăugare");
    }
  }

  async function deleteTransaction(id) {
    if (!id) return;
    setErr("");

    const ok = window.confirm("Sigur vrei să ștergi tranzacția?");
    if (!ok) return;

    try {
      const res = await fetch(`${API}/transactions/${id}`, {
        method: "DELETE",
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Eroare la DELETE");

      await fetchAll();
    } catch (e) {
      setErr(e.message || "Eroare la ștergere");
    }
  }

  return (
    <div className="page">
      <header className="header">
        <div className="title">💰 CashFlow</div>
        <button className="btn" onClick={fetchAll} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      {err && <div className="error">⚠ {err}</div>}

      <section className="card">
        <div className="row">
          <div>
            Total Income: <b>{fmt(summary.totalIncome)}</b>
          </div>
          <div>
            Total Expenses: <b>{fmt(summary.totalExpenses)}</b>
          </div>
          <div className={balanceClass}>
            Balance: <b>{fmt(summary.balance)}</b>
          </div>
        </div>
      </section>

      <section className="card">
        <h2>Add transaction</h2>

        <form className="form" onSubmit={addTransaction}>
          <label>
            Type
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="income">income</option>
              <option value="expense">expense</option>
            </select>
          </label>

          <label>
            Amount
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="ex: 25.5"
            />
          </label>

          <label>
            Category
            <input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="ex: Food"
            />
          </label>

          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </label>

          <label className="full">
            Description
            <input
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="ex: pizza"
            />
          </label>

          <button className="btn primary" type="submit">
            Add
          </button>
        </form>
      </section>

      <section className="card">
        <h2>Transactions</h2>

        {transactions.length === 0 ? (
          <div className="muted">Nu există tranzacții încă.</div>
        ) : (
          <ul className="list">
            {transactions.map((t) => (
              <li key={t._id} className="item">
                <div className="left">
                  <div className="main">
                    <b>{t.date?.slice(0, 10)}</b> — {t.category} —{" "}
                    {fmt(t.amount)}
                    <span
                      className={"tag " + (t.type === "income" ? "inc" : "exp")}
                    >
                      {t.type}
                    </span>
                  </div>
                  {t.description && <div className="muted">{t.description}</div>}
                </div>

                <button
                  className="btn danger"
                  onClick={() => deleteTransaction(t._id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
