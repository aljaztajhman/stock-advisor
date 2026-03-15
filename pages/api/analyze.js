import yahooFinance from "yahoo-finance2";

// ─── Scoring helpers ─────────────────────────────────────────────────────────

function scoreValuation(pe, horizon) {
  if (pe == null || pe <= 0) return { points: 0, maxPoints: 20, verdict: "N/A", sentiment: "neutral" };
  let points, verdict, sentiment;

  if (pe < 10)       { points = 20; verdict = "Very cheap";    sentiment = "positive"; }
  else if (pe < 15)  { points = 17; verdict = "Attractive";    sentiment = "positive"; }
  else if (pe < 25)  { points = 13; verdict = "Fair";          sentiment = "neutral";  }
  else if (pe < 40)  { points = 8;  verdict = "Pricey";        sentiment = "negative"; }
  else               { points = 3;  verdict = "Very expensive"; sentiment = "negative"; }

  // Long-term investors can tolerate slightly higher P/E for growth
  if (horizon === "long" && pe < 30) points = Math.min(20, points + 2);

  return { points, maxPoints: 20, verdict, sentiment };
}

function scoreGrowth(earningsGrowth, revenueGrowth) {
  const growth = earningsGrowth ?? revenueGrowth;
  if (growth == null) return { points: 0, maxPoints: 20, verdict: "N/A", sentiment: "neutral" };

  let points, verdict, sentiment;
  if (growth > 0.5)       { points = 20; verdict = "Explosive"; sentiment = "positive"; }
  else if (growth > 0.2)  { points = 17; verdict = "Strong";    sentiment = "positive"; }
  else if (growth > 0.08) { points = 12; verdict = "Decent";    sentiment = "neutral";  }
  else if (growth > 0)    { points = 7;  verdict = "Slow";      sentiment = "negative"; }
  else                    { points = 2;  verdict = "Declining";  sentiment = "negative"; }

  return { points, maxPoints: 20, verdict, sentiment };
}

function scoreMomentum(currentPrice, low52, high52, horizon) {
  if (!currentPrice || !low52 || !high52 || high52 === low52) {
    return { points: 0, maxPoints: 20, verdict: "N/A", sentiment: "neutral" };
  }
  const pos = (currentPrice - low52) / (high52 - low52); // 0..1

  let points, verdict, sentiment;
  if (horizon === "short") {
    // Short-term: higher position = strong momentum
    if (pos > 0.85)     { points = 20; verdict = "Near high";    sentiment = "positive"; }
    else if (pos > 0.6) { points = 15; verdict = "Strong trend"; sentiment = "positive"; }
    else if (pos > 0.4) { points = 10; verdict = "Mid-range";    sentiment = "neutral";  }
    else if (pos > 0.2) { points = 6;  verdict = "Weak trend";   sentiment = "negative"; }
    else                { points = 3;  verdict = "Near low";      sentiment = "negative"; }
  } else {
    // Long/medium term: lower position = potential buy at discount
    if (pos < 0.2)      { points = 20; verdict = "Deep discount"; sentiment = "positive"; }
    else if (pos < 0.4) { points = 16; verdict = "Undervalued";   sentiment = "positive"; }
    else if (pos < 0.65){ points = 11; verdict = "Mid-range";     sentiment = "neutral";  }
    else if (pos < 0.85){ points = 7;  verdict = "Near highs";    sentiment = "negative"; }
    else                { points = 3;  verdict = "At highs";       sentiment = "negative"; }
  }
  return { points, maxPoints: 20, verdict, sentiment };
}

function scoreRisk(beta, risk) {
  if (beta == null) return { points: 0, maxPoints: 20, verdict: "N/A", sentiment: "neutral" };
  let points, verdict, sentiment;

  if (risk === "low") {
    if (beta < 0.5)      { points = 20; verdict = "Very stable"; sentiment = "positive"; }
    else if (beta < 0.8) { points = 16; verdict = "Stable";      sentiment = "positive"; }
    else if (beta < 1.2) { points = 10; verdict = "Average";     sentiment = "neutral";  }
    else if (beta < 1.6) { points = 5;  verdict = "Volatile";    sentiment = "negative"; }
    else                 { points = 2;  verdict = "High risk";    sentiment = "negative"; }
  } else if (risk === "medium") {
    if (beta < 0.7)      { points = 13; verdict = "Conservative"; sentiment = "neutral";  }
    else if (beta < 1.3) { points = 20; verdict = "Balanced";     sentiment = "positive"; }
    else if (beta < 1.8) { points = 14; verdict = "Growth risk";  sentiment = "neutral";  }
    else                 { points = 6;  verdict = "High risk";     sentiment = "negative"; }
  } else {
    if (beta < 0.8)      { points = 10; verdict = "Low beta";    sentiment = "neutral";  }
    else if (beta < 1.3) { points = 14; verdict = "Moderate";    sentiment = "neutral";  }
    else if (beta < 2.0) { points = 20; verdict = "High beta";   sentiment = "positive"; }
    else                 { points = 16; verdict = "Very volatile"; sentiment = "positive"; }
  }
  return { points, maxPoints: 20, verdict, sentiment };
}

function scoreProfitability(margin, horizon) {
  if (margin == null) return { points: 0, maxPoints: 20, verdict: "N/A", sentiment: "neutral" };
  let points, verdict, sentiment;

  if (margin > 0.35)      { points = 20; verdict = "Exceptional"; sentiment = "positive"; }
  else if (margin > 0.2)  { points = 16; verdict = "Strong";      sentiment = "positive"; }
  else if (margin > 0.08) { points = 12; verdict = "Good";        sentiment = "neutral";  }
  else if (margin > 0.02) { points = 7;  verdict = "Thin";        sentiment = "negative"; }
  else if (margin >= 0)   { points = 3;  verdict = "Break-even";  sentiment = "negative"; }
  else                    { points = 0;  verdict = "Unprofitable"; sentiment = "negative"; }

  // Long-term investors care more about profitability
  if (horizon === "long" && margin > 0.2) points = Math.min(20, points + 2);

  return { points, maxPoints: 20, verdict, sentiment };
}

function computeScore(factors) {
  const total = factors.reduce((s, f) => s + f.points, 0);
  const max   = factors.reduce((s, f) => s + f.maxPoints, 0);
  if (max === 0) return 3;
  // Map 0..max → 1..5
  return Math.max(1, Math.min(5, Math.round((total / max) * 4 + 1)));
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmt(val, type) {
  if (val == null) return null;
  if (type === "pct")   return `${(val * 100).toFixed(1)}%`;
  if (type === "x")     return `${val.toFixed(2)}x`;
  if (type === "num")   return val.toFixed(2);
  if (type === "bn")    return `$${(val / 1e9).toFixed(2)}B`;
  if (type === "price") return `$${val.toFixed(2)}`;
  return String(val);
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { ticker, horizon = "long", risk = "medium" } = req.body;
  if (!ticker) return res.status(400).json({ error: "Ticker is required" });

  // 1. Fetch Yahoo Finance data ------------------------------------------------
  let quote, summary;
  try {
    [quote, summary] = await Promise.all([
      yahooFinance.quote(ticker),
      yahooFinance.quoteSummary(ticker, {
        modules: ["financialData", "defaultKeyStatistics", "summaryDetail"],
      }),
    ]);
  } catch (err) {
    return res.status(404).json({
      error: `Could not find data for "${ticker}". Check the ticker symbol and try again.`,
    });
  }

  const fd  = summary?.financialData        || {};
  const ks  = summary?.defaultKeyStatistics || {};
  const sd  = summary?.summaryDetail        || {};

  const currentPrice  = quote.regularMarketPrice ?? fd.currentPrice?.raw;
  const pe            = sd.trailingPE?.raw ?? quote.trailingPE;
  const earningsGrowth = fd.earningsGrowth?.raw;
  const revenueGrowth  = fd.revenueGrowth?.raw;
  const margin        = fd.profitMargins?.raw;
  const beta          = quote.beta ?? sd.beta?.raw;
  const low52         = quote.fiftyTwoWeekLow  ?? sd.fiftyTwoWeekLow?.raw;
  const high52        = quote.fiftyTwoWeekHigh ?? sd.fiftyTwoWeekHigh?.raw;
  const dividendYield = sd.dividendYield?.raw ?? quote.dividendYield;
  const marketCap     = quote.marketCap;

  // 2. Compute factor scores ---------------------------------------------------
  const rawFactors = [
    { name: "Valuation (P/E)",     ...scoreValuation(pe, horizon) },
    { name: "Growth",              ...scoreGrowth(earningsGrowth, revenueGrowth) },
    { name: "Price Momentum",      ...scoreMomentum(currentPrice, low52, high52, horizon) },
    { name: "Risk / Volatility",   ...scoreRisk(beta, risk) },
    { name: "Profitability",       ...scoreProfitability(margin, horizon) },
  ].filter((f) => f.maxPoints > 0);

  // Bonus: dividend yield for long-term income seekers
  if (horizon === "long" && risk === "low" && dividendYield && dividendYield > 0.02) {
    rawFactors.push({
      name: "Dividend Yield",
      points: Math.min(10, Math.round(dividendYield * 200)),
      maxPoints: 10,
      verdict: `${(dividendYield * 100).toFixed(1)}% yield`,
      sentiment: "positive",
    });
  }

  const score = computeScore(rawFactors);

  // 3. Build a summary for the AI -----------------------------------------------
  const dataContext = [
    `Ticker: ${ticker}`,
    `Company: ${quote.longName ?? quote.shortName ?? ticker}`,
    `Current price: ${fmt(currentPrice, "price")}`,
    `52-week range: ${fmt(low52, "price")} – ${fmt(high52, "price")}`,
    `Market cap: ${fmt(marketCap, "bn")}`,
    `Trailing P/E: ${pe != null ? pe.toFixed(2) : "N/A"}`,
    `Earnings growth (YoY): ${earningsGrowth != null ? fmt(earningsGrowth, "pct") : "N/A"}`,
    `Revenue growth (YoY): ${revenueGrowth != null ? fmt(revenueGrowth, "pct") : "N/A"}`,
    `Profit margin: ${margin != null ? fmt(margin, "pct") : "N/A"}`,
    `Beta: ${beta != null ? beta.toFixed(2) : "N/A"}`,
    `Dividend yield: ${dividendYield != null ? fmt(dividendYield, "pct") : "N/A"}`,
    `Investment horizon: ${horizon}`,
    `Risk tolerance: ${risk}`,
    `Rule-based score: ${score}/5`,
  ].join("\n");

  // 4. Call Claude for explanation ----------------------------------------------
  let aiExplanation = null;
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 350,
          messages: [
            {
              role: "user",
              content: `You are a concise financial analyst. Based on the following stock data, write a 3–5 sentence plain-English explanation of why this stock received a score of ${score}/5 for the given investor profile. Be direct and mention specific numbers. Do not use markdown or bullet points.\n\n${dataContext}`,
            },
          ],
        }),
      });
      if (response.ok) {
        const json = await response.json();
        aiExplanation = json.content?.[0]?.text?.trim() ?? null;
      }
    } catch (_) {
      // AI explanation is optional — don't fail the whole request
    }
  }

  // 5. Build metrics rows for display ------------------------------------------
  const metrics = [
    { label: "Current Price",      value: fmt(currentPrice, "price") },
    { label: "52-Week Low",        value: fmt(low52, "price") },
    { label: "52-Week High",       value: fmt(high52, "price") },
    { label: "Market Cap",         value: fmt(marketCap, "bn") },
    { label: "Trailing P/E",       value: pe != null ? pe.toFixed(2) : null,
      note: pe != null ? (pe < 15 ? "cheap" : pe > 35 ? "expensive" : "fair") : null,
      good: pe != null ? (pe < 15 ? true : pe > 35 ? false : null) : null },
    { label: "Earnings Growth",    value: fmt(earningsGrowth, "pct"),
      note: earningsGrowth != null ? (earningsGrowth > 0.1 ? "strong" : earningsGrowth < 0 ? "declining" : "slow") : null,
      good: earningsGrowth != null ? earningsGrowth > 0.1 : null },
    { label: "Revenue Growth",     value: fmt(revenueGrowth, "pct"),
      note: revenueGrowth != null ? (revenueGrowth > 0.1 ? "strong" : revenueGrowth < 0 ? "declining" : "slow") : null,
      good: revenueGrowth != null ? revenueGrowth > 0.1 : null },
    { label: "Profit Margin",      value: fmt(margin, "pct"),
      note: margin != null ? (margin > 0.2 ? "healthy" : margin < 0 ? "negative" : "thin") : null,
      good: margin != null ? margin > 0.1 : null },
    { label: "Beta",               value: beta != null ? beta.toFixed(2) : null },
    { label: "Dividend Yield",     value: fmt(dividendYield, "pct") },
  ].filter((m) => m.value != null);

  // 6. Return ------------------------------------------------------------------
  return res.status(200).json({
    ticker,
    name:  quote.longName ?? quote.shortName ?? ticker,
    score,
    currentPrice,
    factors: rawFactors,
    metrics,
    aiExplanation,
  });
}
