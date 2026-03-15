import { useState } from "react";
import Head from "next/head";

const SCORE_CONFIG = {
  5: { label: "Excellent",  color: "text-green-400",  border: "border-green-400",  bg: "bg-green-400/10",  desc: "Strong buy signal for your profile" },
  4: { label: "Good",       color: "text-lime-400",   border: "border-lime-400",   bg: "bg-lime-400/10",   desc: "Looks promising for your needs" },
  3: { label: "Neutral",    color: "text-yellow-400", border: "border-yellow-400", bg: "bg-yellow-400/10", desc: "Mixed signals — proceed carefully" },
  2: { label: "Weak",       color: "text-orange-400", border: "border-orange-400", bg: "bg-orange-400/10", desc: "Several concerns for your profile" },
  1: { label: "Poor",       color: "text-red-400",    border: "border-red-400",    bg: "bg-red-400/10",    desc: "Not suitable for your investment goals" },
};

const HORIZON_OPTIONS = [
  { value: "short",  label: "Short-term",  sub: "1–6 months" },
  { value: "medium", label: "Mid-term",    sub: "6 mo – 2 yr" },
  { value: "long",   label: "Long-term",   sub: "2+ years" },
];

const RISK_OPTIONS = [
  { value: "low",    label: "Conservative", sub: "Capital preservation" },
  { value: "medium", label: "Balanced",     sub: "Growth + stability" },
  { value: "high",   label: "Aggressive",   sub: "Max growth" },
];

function ScoreDots({ score }) {
  return (
    <div className="flex gap-1.5 justify-center mt-2">
      {[1, 2, 3, 4, 5].map((d) => (
        <div
          key={d}
          className={`w-2.5 h-2.5 rounded-full transition-all ${
            d <= score ? "bg-current opacity-100 scale-110" : "bg-gray-700"
          }`}
        />
      ))}
    </div>
  );
}

function MetricRow({ label, value, note, good }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <div className="text-right">
        <span className="text-gray-100 font-medium text-sm">{value}</span>
        {note && (
          <span
            className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
              good === true  ? "bg-green-500/20 text-green-400" :
              good === false ? "bg-red-500/20 text-red-400" :
                               "bg-gray-700 text-gray-400"
            }`}
          >
            {note}
          </span>
        )}
      </div>
    </div>
  );
}

function SelectCard({ options, value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg p-3 border text-left transition-all ${
            value === opt.value
              ? "border-green-500 bg-green-500/10 text-green-400"
              : "border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500"
          }`}
        >
          <div className="font-semibold text-sm">{opt.label}</div>
          <div className="text-xs mt-0.5 opacity-70">{opt.sub}</div>
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [ticker, setTicker]     = useState("");
  const [horizon, setHorizon]   = useState("long");
  const [risk, setRisk]         = useState("medium");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState(null);

  async function handleAnalyze(e) {
    e.preventDefault();
    if (!ticker.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: ticker.trim().toUpperCase(), horizon, risk }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const cfg = result ? SCORE_CONFIG[result.score] : null;

  return (
    <>
      <Head>
        <title>Stock Advisor AI</title>
        <meta name="description" content="AI-powered stock scoring for your investment goals" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center text-gray-950 font-black text-sm">
              AI
            </div>
            <div>
              <h1 className="font-bold text-gray-100 leading-none">Stock Advisor</h1>
              <p className="text-xs text-gray-500">Personalized investment scoring</p>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

          {/* Input form */}
          <div className="card space-y-5">
            <div>
              <h2 className="font-bold text-lg text-gray-100">Analyze a Stock</h2>
              <p className="text-sm text-gray-500 mt-0.5">Enter a ticker and your preferences to get a personalized score</p>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-5">
              {/* Ticker input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stock Ticker
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="e.g. AAPL, MSFT, TSLA, NVDA"
                    className="input-field pr-12 font-mono text-lg uppercase"
                    maxLength={10}
                    disabled={loading}
                  />
                  {ticker && (
                    <button
                      type="button"
                      onClick={() => setTicker("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Investment horizon */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Investment Horizon
                </label>
                <SelectCard options={HORIZON_OPTIONS} value={horizon} onChange={setHorizon} />
              </div>

              {/* Risk tolerance */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Risk Tolerance
                </label>
                <SelectCard options={RISK_OPTIONS} value={risk} onChange={setRisk} />
              </div>

              <button
                type="submit"
                disabled={!ticker.trim() || loading}
                className="btn-primary w-full text-center"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Analyzing…
                  </span>
                ) : "Analyze Stock →"}
              </button>
            </form>
          </div>

          {/* Error */}
          {error && (
            <div className="card border-red-500/40 bg-red-500/5 text-red-400 text-sm">
              <strong>Error:</strong> {error}
            </div>
          )}

          {/* Results */}
          {result && cfg && (
            <div className="space-y-4">

              {/* Score hero */}
              <div className={`card ${cfg.bg} border ${cfg.border}`}>
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 text-center">
                    <div className={`score-badge ${cfg.color} ${cfg.border}`}>
                      {result.score}
                    </div>
                    <ScoreDots score={result.score} />
                    <div className={`text-xs font-bold mt-1 ${cfg.color}`}>{cfg.label}</div>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-xl font-black text-gray-100">{result.ticker}</h3>
                      <span className="text-gray-400 text-sm">{result.name}</span>
                    </div>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                        {HORIZON_OPTIONS.find(h => h.value === horizon)?.label}
                      </span>
                      <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                        {RISK_OPTIONS.find(r => r.value === risk)?.label}
                      </span>
                      {result.currentPrice && (
                        <span className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded font-mono">
                          ${result.currentPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mt-3 font-medium ${cfg.color}`}>{cfg.desc}</p>
                  </div>
                </div>
              </div>

              {/* AI Explanation */}
              {result.aiExplanation && (
                <div className="card">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center text-gray-950 text-xs font-bold">
                      AI
                    </div>
                    <h4 className="font-semibold text-gray-200 text-sm">AI Analysis</h4>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {result.aiExplanation}
                  </p>
                </div>
              )}

              {/* Key Metrics */}
              {result.metrics && (
                <div className="card">
                  <h4 className="font-semibold text-gray-200 text-sm mb-1">Key Metrics</h4>
                  <p className="text-xs text-gray-500 mb-4">Used to compute your score</p>
                  <div>
                    {result.metrics.map((m, i) => (
                      <MetricRow key={i} {...m} />
                    ))}
                  </div>
                </div>
              )}

              {/* Score breakdown */}
              {result.factors && result.factors.length > 0 && (
                <div className="card">
                  <h4 className="font-semibold text-gray-200 text-sm mb-4">Score Breakdown</h4>
                  <div className="space-y-3">
                    {result.factors.map((f, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-300">{f.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            f.sentiment === "positive" ? "bg-green-500/20 text-green-400" :
                            f.sentiment === "negative" ? "bg-red-500/20 text-red-400" :
                                                         "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {f.verdict}
                          </span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${
                              f.sentiment === "positive" ? "bg-green-500" :
                              f.sentiment === "negative" ? "bg-red-500" :
                                                           "bg-yellow-500"
                            }`}
                            style={{ width: `${(f.points / f.maxPoints) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-gray-600 text-center px-4">
                This is not financial advice. Scores are algorithmic and informational only.
                Always do your own research before investing.
              </p>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
