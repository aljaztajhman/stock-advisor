# 📈 Stock Advisor AI

A free, personalized stock scoring web app. Enter any ticker, set your investment horizon and risk tolerance, and get a **1–5 score** backed by real financial data and an AI explanation.

---

## Tech Stack

| Layer     | Tech                          |
|-----------|-------------------------------|
| Frontend  | Next.js 14 + React + Tailwind |
| Backend   | Next.js API routes (serverless)|
| Stock data| Yahoo Finance (`yahoo-finance2`) |
| AI        | Anthropic Claude (Haiku model) |
| Hosting   | Vercel (free tier)            |

---

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up your environment
cp .env.example .env.local
# → Edit .env.local and add your ANTHROPIC_API_KEY

# 3. Run locally
npm run dev
# → Open http://localhost:3000
```

> **Note:** The app works without an API key — you'll just get the score and metrics without the AI text explanation.

---

## Deploy to Vercel (Free)

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. In **Environment Variables**, add `ANTHROPIC_API_KEY`
4. Click **Deploy** — done!

---

## Scoring Algorithm

The 1–5 score is computed from 5 weighted factors, each tuned to your inputs:

| Factor             | What it measures                          |
|--------------------|-------------------------------------------|
| Valuation (P/E)    | Is the stock cheap or expensive?          |
| Growth             | Earnings / revenue growth year-over-year  |
| Price Momentum     | Where is the price in its 52-week range?  |
| Risk / Volatility  | Beta vs. your risk tolerance              |
| Profitability      | Net profit margin                         |

A Claude AI explanation is generated on top to give plain-English context.

---

## Get a Free Anthropic API Key

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up for a free account
3. Create an API key under **API Keys**
4. New accounts receive free credits — each analysis costs ~$0.001

---

## Disclaimer

This tool is for **informational purposes only** and does not constitute financial advice.
Always do your own research before making investment decisions.
