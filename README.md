# Personal Expense Analysis Dashboard

An interactive one-page dashboard for an internship data-analysis assignment. It answers three questions about a personal expense dataset (21 Nov 2021 – 2 Mar 2022, 277 cleaned transactions, INR):

1. Total amount spent and number of transactions per expense category
2. Monthly income vs expenses, and which months had expenses above income
3. Total food-related expense per month

It also shows extra insights (income sources, weekday spending, largest expenses) and the full data-cleaning log. A month filter updates the headline cards, the category breakdown and the insight charts; clicking a month in the Q2 chart or table filters too.

**Built with:** Vue 3 · Vite · Chart.js (via vue-chartjs). No backend: the cleaned data ships as JSON and every figure is computed in the browser (`src/analysis.js`), so the numbers match the Excel workbook.

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## Deploy to GitHub Pages

1. Create a new GitHub repository (for example `expense-dashboard`) and push this folder to its `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Expense analysis dashboard"
   git branch -M main
   git remote add origin https://github.com/<your-username>/expense-dashboard.git
   git push -u origin main
   ```
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The workflow in `.github/workflows/deploy.yml` builds and publishes the site on every push. When it finishes (Actions tab), the site is live at `https://<your-username>.github.io/expense-dashboard/`.

`vite.config.js` uses a relative base path (`base: './'`), so the site works under any repository name without changes.

## Project structure

```
src/
  data/transactions.json   cleaned dataset (277 rows)
  data/cleaningLog.json    every cleaning step with original row numbers
  analysis.js              all calculations (Q1–Q3, insights)
  chartPlugins.js          value labels drawn on bars
  components/              KpiCard, BarChart
  App.vue                  page layout
```

## Data cleaning summary

280 raw rows → 277 clean rows; no amounts changed.

- Removed 3 exact duplicate rows appended out of date order at the end of the file
- Converted one date stored as an Excel serial number
- Standardised category spelling (e.g. "food", "Food ", "  Food " → Food); set one blank category to Food (note "Dinner", Meal? = Meal)
- Treated 3 USD-labelled rows as INR (amounts only make sense in rupees)
- Filled 4 blank notes with "(No note)"; flagged ambiguous records without changing them

Prepared by Piyachat Kamklat (Eve).
