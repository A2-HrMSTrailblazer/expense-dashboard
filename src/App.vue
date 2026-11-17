<script setup>
import { computed, ref } from 'vue'
import BarChart from './components/BarChart.vue'
import KpiCard from './components/KpiCard.vue'
import cleaningLog from './data/cleaningLog.json'
import {
  months, monthLabel, period, filterRows, kpis, byCategory, monthly, foodMonthly,
  incomeSources, byWeekday, topExpenses, insights, inr, pct, fmtDate,
} from './analysis'

const C = {
  accent: '#2563eb',
  accentSoft: 'rgba(37, 99, 235, 0.35)',
  grey: '#cbd5e1',
  bad: '#dc2626',
  text: '#0f172a',
  grid: '#eef2f7',
}

/* ---------- state ---------- */
const month = ref('') // '' = all months
const rows = computed(() => filterRows(month.value))
const selLabel = computed(() => (month.value ? monthLabel(month.value) : 'All months'))
const k = computed(() => kpis(rows.value))
const cats = computed(() => byCategory(rows.value))
const sources = computed(() => incomeSources(rows.value))
const weekdays = computed(() => byWeekday(rows.value))
const top = computed(() => topExpenses(rows.value))
const m = monthly()
const food = foodMonthly()
const ins = insights()
const toggleMonth = (value) => (month.value = month.value === value ? '' : value)

/* ---------- chart helpers ---------- */
const money = (v) => inr(v)
const axisMoney = (v) => (v >= 1000 ? `₹${v / 1000}k` : `₹${v}`)
const baseOptions = (extra = {}) => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: {
    legend: { display: false },
    tooltip: { padding: 10, boxPadding: 4 },
    ...extra.plugins,
  },
  ...extra.root,
})
const short = (label) => label.replace(/ 20(\d\d)$/, " '$1")
const dimmed = (color, i, list) => (month.value && list[i].month !== month.value ? `${color}55` : color)

/* Q1: horizontal bars by category */
const catChart = computed(() => ({
  data: {
    labels: cats.value.map((c) => c.category),
    datasets: [{ data: cats.value.map((c) => c.total), backgroundColor: C.accent, borderRadius: 3, barThickness: 16 }],
  },
  options: baseOptions({
    root: {
      indexAxis: 'y',
      layout: { padding: { right: 64 } },
      scales: {
        x: { display: false, beginAtZero: true },
        y: { grid: { display: false }, ticks: { color: C.text } },
      },
    },
    plugins: {
      valueLabels: { format: (v) => money(v), color: C.text },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const c = cats.value[ctx.dataIndex]
            return [`Spent: ${money(c.total)}`, `Transactions: ${c.txns}`, `Share: ${pct(c.share)}`]
          },
        },
      },
    },
  }),
  height: Math.max(180, cats.value.length * 30 + 20),
}))

/* Q2: income vs expenses by month (click a month to filter) */
const monthChart = computed(() => ({
  data: {
    labels: m.map((x) => short(x.label)),
    datasets: [
      { label: 'Income', data: m.map((x) => x.income), backgroundColor: m.map((_, i) => dimmed('#94a3b8', i, m)), borderRadius: 3 },
      {
        label: 'Expenses',
        data: m.map((x) => x.expense),
        backgroundColor: m.map((x, i) => dimmed(x.deficit ? C.bad : C.accent, i, m)),
        borderRadius: 3,
      },
    ],
  },
  options: baseOptions({
    root: {
      layout: { padding: { top: 18 } },
      scales: {
        x: { grid: { display: false }, ticks: { color: C.text } },
        y: { beginAtZero: true, grid: { color: C.grid }, border: { display: false }, ticks: { callback: axisMoney, maxTicksLimit: 5 } },
      },
      onClick: (_e, els) => els.length && toggleMonth(m[els[0].index].month),
      onHover: (e, els) => (e.native.target.style.cursor = els.length ? 'pointer' : 'default'),
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${money(ctx.raw)}`,
          footer: (items) => {
            const x = m[items[0].dataIndex]
            return `Net: ${inr(x.net)}${x.deficit ? '  (deficit)' : ''}\nClick to filter`
          },
        },
      },
    },
  }),
}))

/* Q3: stacked meals / non-meal per month */
const foodChart = computed(() => ({
  data: {
    labels: food.map((x) => short(x.label)),
    datasets: [
      { label: 'Meals', data: food.map((x) => x.meal), backgroundColor: C.accent, stack: 'food' },
      { label: 'Non-meal', data: food.map((x) => x.nonMeal), backgroundColor: C.accentSoft, stack: 'food', borderRadius: { topLeft: 3, topRight: 3 } },
    ],
  },
  options: baseOptions({
    root: {
      layout: { padding: { top: 18 } },
      scales: {
        x: { stacked: true, grid: { display: false }, ticks: { color: C.text } },
        y: { stacked: true, beginAtZero: true, grid: { color: C.grid }, border: { display: false }, ticks: { callback: axisMoney, maxTicksLimit: 5 } },
      },
    },
    plugins: {
      valueLabels: { stackTotal: true, format: (v) => money(v), color: C.text },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${money(ctx.raw)}`,
          footer: (items) => `Food total: ${money(food[items[0].dataIndex].total)}`,
        },
      },
    },
  }),
}))

/* Insights: income sources + weekday */
const sourceChart = computed(() => ({
  data: {
    labels: sources.value.map((s) => s.source),
    datasets: [{ data: sources.value.map((s) => s.amount), backgroundColor: ['#16a34a', '#94a3b8', '#94a3b8'], borderRadius: 3, barThickness: 18 }],
  },
  options: baseOptions({
    root: {
      indexAxis: 'y',
      layout: { padding: { right: 110 } },
      scales: { x: { display: false, beginAtZero: true }, y: { grid: { display: false }, ticks: { color: C.text } } },
    },
    plugins: {
      valueLabels: { format: (v, i) => `${money(v)} · ${pct(sources.value[i].share)}`, color: C.text },
      tooltip: { callbacks: { label: (ctx) => `${money(ctx.raw)} from ${sources.value[ctx.dataIndex].txns} transfers` } },
    },
  }),
}))

const weekdayChart = computed(() => ({
  data: {
    labels: weekdays.value.map((w) => w.weekday.slice(0, 3)),
    datasets: [{
      data: weekdays.value.map((w) => w.amount),
      backgroundColor: weekdays.value.map((w) => (w.weekday === 'Saturday' || w.weekday === 'Sunday' ? C.accent : C.grey)),
      borderRadius: 3,
    }],
  },
  options: baseOptions({
    root: {
      layout: { padding: { top: 18 } },
      scales: {
        x: { grid: { display: false }, ticks: { color: C.text } },
        y: { display: false, beginAtZero: true },
      },
    },
    plugins: {
      valueLabels: { format: (v, i) => pct(weekdays.value[i].share), color: C.text },
      tooltip: { callbacks: { label: (ctx) => `${money(ctx.raw)} · ${weekdays.value[ctx.dataIndex].txns} transactions` } },
    },
  }),
}))

const partialNote = (x) => {
  const d = (s) => Number(s.slice(8, 10))
  if (x.month === months[0]) return `from ${d(x.firstDay)} ${x.label.slice(0, 3)}`
  if (x.month === months[months.length - 1]) return `${d(x.firstDay)}–${d(x.lastDay)} ${x.label.slice(0, 3)} only`
  return ''
}
</script>

<template>
  <div class="page">
    <!-- ======= Header ======= -->
    <header class="hero">
      <p class="eyebrow">Data analysis assignment · Personal expense dataset</p>
      <h1>Where did the money go?</h1>
      <p class="lede">
        Across {{ period.count }} cleaned transactions from {{ fmtDate(period.first) }} to {{ fmtDate(period.last) }},
        spending of <strong>{{ inr(ins.totalExp) }}</strong> was
        {{ ins.totalExp > ins.totalInc ? 'more' : 'less' }} than income of <strong>{{ inr(ins.totalInc) }}</strong>,
        a net of <strong :class="ins.net < 0 ? 'bad' : 'good'">{{ inr(ins.net) }}</strong>.
        Expenses beat income in
        <strong class="bad">{{ ins.deficits.map((d) => d.label).join(' and ') }}</strong>.
      </p>
    </header>

    <!-- ======= Filter ======= -->
    <nav class="filter" aria-label="Filter by month">
      <span class="filter-label">Month</span>
      <button :class="{ on: month === '' }" @click="month = ''">All months</button>
      <button v-for="mm in months" :key="mm" :class="{ on: month === mm }" @click="toggleMonth(mm)">
        {{ monthLabel(mm) }}
      </button>
      <span class="filter-hint">Filters the cards, Q1 and the insight charts.</span>
    </nav>

    <!-- ======= KPIs ======= -->
    <section class="kpis" aria-label="Headline figures">
      <KpiCard label="Income" :value="inr(k.income)" :note="selLabel" />
      <KpiCard label="Expenses" :value="inr(k.expense)" :note="`${k.expenseTxns} transactions`" />
      <KpiCard label="Net (income − expenses)" :value="inr(k.net)" :tone="k.net < 0 ? 'bad' : 'good'" note="Negative = spent more than earned" />
      <KpiCard label="Expenses as % of income" :value="pct(k.expenseToIncome)" :tone="k.expenseToIncome > 1 ? 'bad' : 'good'" note="Above 100% = deficit" />
      <KpiCard label="Food spend" :value="inr(k.food)" tone="accent" :note="`${pct(k.foodShare)} of expenses`" />
    </section>

    <!-- ======= Q1 ======= -->
    <section class="block" id="q1">
      <div class="block-head">
        <span class="tag">Q1</span>
        <h2>Spending and transactions by category</h2>
        <p>
          <strong>{{ cats[0]?.category ?? '—' }}</strong> is the largest category in {{ selLabel.toLowerCase() === 'all months' ? 'the period' : selLabel }},
          at {{ cats[0] ? pct(cats[0].share) : '—' }} of spending.
        </p>
      </div>
      <div class="grid2">
        <div class="panel">
          <h3>Spend by category · {{ selLabel }}</h3>
          <BarChart v-if="cats.length" v-bind="catChart" label="Horizontal bar chart of spending by expense category" />
          <p v-else class="muted">No expenses in this month.</p>
        </div>
        <div class="panel">
          <h3>Category table</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Category</th><th class="n">Spent</th><th class="n">Txns</th><th class="n">Share</th><th class="n">Avg / txn</th></tr></thead>
              <tbody>
                <tr v-for="c in cats" :key="c.category">
                  <td>{{ c.category }}</td><td class="n">{{ inr(c.total, 2) }}</td><td class="n">{{ c.txns }}</td>
                  <td class="n">{{ pct(c.share) }}</td><td class="n">{{ inr(c.avg, 2) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr><td>Total</td><td class="n">{{ inr(k.expense, 2) }}</td><td class="n">{{ k.expenseTxns }}</td><td class="n">100%</td><td class="n">{{ k.expenseTxns ? inr(k.expense / k.expenseTxns, 2) : '—' }}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- ======= Q2 ======= -->
    <section class="block" id="q2">
      <div class="block-head">
        <span class="tag">Q2</span>
        <h2>Monthly income vs expenses</h2>
        <p>
          Expenses exceeded income in <strong class="bad">{{ ins.deficits.map((d) => d.label).join(' and ') }}</strong>.
          The worst month was {{ ins.worst.label }} at {{ inr(ins.worst.net) }}. Both deficit months include a rent payment.
        </p>
      </div>
      <div class="grid2">
        <div class="panel">
          <h3>Income vs expenses by month</h3>
          <div class="legend">
            <span><i style="background:#94a3b8"></i>Income</span>
            <span><i :style="{ background: C.accent }"></i>Expenses</span>
            <span><i :style="{ background: C.bad }"></i>Expenses &gt; income</span>
          </div>
          <BarChart v-bind="monthChart" label="Grouped bar chart of monthly income and expenses" />
          <p class="hint">Click a month to filter the page.</p>
        </div>
        <div class="panel">
          <h3>Monthly table</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Month</th><th class="n">Income</th><th class="n">Expenses</th><th class="n">Net</th><th>Status</th></tr></thead>
              <tbody>
                <tr v-for="x in m" :key="x.month" :class="{ sel: month === x.month }" class="clickable" @click="toggleMonth(x.month)">
                  <td>{{ x.label }}<span v-if="partialNote(x)" class="sub">{{ partialNote(x) }}</span></td>
                  <td class="n">{{ inr(x.income, 2) }}</td><td class="n">{{ inr(x.expense, 2) }}</td>
                  <td class="n" :class="x.net < 0 ? 'bad' : 'good'">{{ inr(x.net, 2) }}</td>
                  <td><span class="pill" :class="x.deficit ? 'pill-bad' : 'pill-ok'">{{ x.deficit ? 'Deficit' : 'Within income' }}</span></td>
                </tr>
              </tbody>
              <tfoot>
                <tr><td>Total</td><td class="n">{{ inr(ins.totalInc, 2) }}</td><td class="n">{{ inr(ins.totalExp, 2) }}</td><td class="n" :class="ins.net < 0 ? 'bad' : 'good'">{{ inr(ins.net, 2) }}</td><td>{{ ins.deficits.length }} deficit months</td></tr>
              </tfoot>
            </table>
          </div>
          <p class="hint">Nov 2021 and Mar 2022 are partial months.</p>
        </div>
      </div>
    </section>

    <!-- ======= Q3 ======= -->
    <section class="block" id="q3">
      <div class="block-head">
        <span class="tag">Q3</span>
        <h2>Food-related expense by month</h2>
        <p>
          Food (the Food category, split by the Meal? column) totals <strong>{{ inr(ins.foodTotal) }}</strong>,
          peaking in {{ ins.peakFood.label }} at <strong>{{ inr(ins.peakFood.total) }}</strong>.
        </p>
      </div>
      <div class="grid2">
        <div class="panel">
          <h3>Food spend by month</h3>
          <div class="legend">
            <span><i :style="{ background: C.accent }"></i>Meals</span>
            <span><i :style="{ background: C.accentSoft }"></i>Non-meal (snacks, drinks, groceries)</span>
          </div>
          <BarChart v-bind="foodChart" label="Stacked bar chart of monthly food spend, meals and non-meal" />
        </div>
        <div class="panel">
          <h3>Food table</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Month</th><th class="n">Food total</th><th class="n">Meals</th><th class="n">Non-meal</th><th class="n">Txns</th><th class="n">% of month</th></tr></thead>
              <tbody>
                <tr v-for="x in food" :key="x.month">
                  <td>{{ x.label }}</td><td class="n">{{ inr(x.total, 2) }}</td><td class="n">{{ inr(x.meal, 2) }}</td>
                  <td class="n">{{ inr(x.nonMeal, 2) }}</td><td class="n">{{ x.txns }}</td><td class="n">{{ pct(x.shareOfMonth) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr><td>Total</td><td class="n">{{ inr(ins.foodTotal, 2) }}</td><td class="n">{{ inr(food.reduce((s, x) => s + x.meal, 0), 2) }}</td><td class="n">{{ inr(food.reduce((s, x) => s + x.nonMeal, 0), 2) }}</td><td class="n">{{ ins.foodTxns }}</td><td class="n">{{ pct(ins.foodShare) }}</td></tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </section>

    <!-- ======= Insights ======= -->
    <section class="block" id="insights">
      <div class="block-head">
        <span class="tag">+</span>
        <h2>Additional insights</h2>
      </div>
      <div class="insights">
        <article class="insight">
          <h4>Small food purchases add up</h4>
          <p>Food is {{ pct(ins.foodShare) }} of all spending over {{ ins.foodTxns }} purchases averaging just {{ inr(ins.foodAvg) }}. Snacks, milk and drinks are {{ pct(ins.nonMealShare) }} of food spend.</p>
        </article>
        <article class="insight">
          <h4>Rent is the biggest fixed cost</h4>
          <p>{{ ins.rentCount }} rent payments total {{ inr(ins.rentTotal) }} ({{ pct(ins.rentShare) }} of spending) and fall in exactly the two deficit months.</p>
        </article>
        <article class="insight">
          <h4>Income depends on family</h4>
          <p>Transfers from Dad are {{ pct(ins.dadShare) }} of income. Salary appears once ({{ inr(ins.salaryTotal) }}).</p>
        </article>
        <article class="insight">
          <h4>Weekends cost the most</h4>
          <p>Saturday and Sunday carry {{ pct(ins.weekendShare) }} of spending, partly because both rent payments fell on a weekend.</p>
        </article>
        <article class="insight">
          <h4>Money moves between friends</h4>
          <p>{{ inr(ins.otherOut) }} went out as transfers to friends ("Other"), while {{ inr(ins.friendsIn) }} came in from friends and other non-family sources.</p>
        </article>
        <article class="insight">
          <h4>Typical expense is small</h4>
          <p>The median expense is {{ inr(ins.median) }}: many small daily purchases plus a few large ones drive the total.</p>
        </article>
      </div>

      <div class="grid2">
        <div class="panel">
          <h3>Income by source · {{ selLabel }}</h3>
          <BarChart v-bind="sourceChart" :height="140" label="Bar chart of income by source" />
        </div>
        <div class="panel">
          <h3>Spending by weekday · {{ selLabel }}</h3>
          <BarChart v-bind="weekdayChart" :height="200" label="Bar chart of share of spending by weekday" />
        </div>
      </div>

      <div class="panel">
        <h3>Largest expenses · {{ selLabel }}</h3>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Category</th><th>Note</th><th class="n">Amount</th></tr></thead>
            <tbody>
              <tr v-for="t in top" :key="t.id">
                <td>{{ fmtDate(t.date) }}</td><td>{{ t.category }}</td><td>{{ t.note }}</td><td class="n">{{ inr(t.amount, 2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <!-- ======= Cleaning ======= -->
    <section class="block" id="cleaning">
      <div class="block-head">
        <span class="tag">i</span>
        <h2>How the data was cleaned</h2>
        <p>280 raw rows became {{ period.count }} clean rows. No amounts were changed; every step is logged below.</p>
      </div>
      <ul class="steps">
        <li><strong>Duplicates:</strong> 3 exact copies appended out of date order at the end of the file were removed.</li>
        <li><strong>Dates:</strong> one date stored as an Excel serial number was converted.</li>
        <li><strong>Categories:</strong> spacing and capitalisation were standardised ("food", "Food ", "&nbsp;&nbsp;Food " → Food); a blank category on a "Dinner" meal was set to Food.</li>
        <li><strong>Currency:</strong> 3 rows labelled USD were treated as INR, since their amounts (an auto-rickshaw ride, a chocolate bar) only make sense in rupees.</li>
        <li><strong>Missing notes</strong> were filled with "(No note)"; ambiguous records were kept as recorded and flagged.</li>
      </ul>
      <details class="panel">
        <summary>Full cleaning log ({{ cleaningLog.length }} entries)</summary>
        <div class="table-wrap">
          <table class="log">
            <thead><tr><th>#</th><th>Step</th><th>Original row(s)</th><th>Before</th><th>After</th><th>Reason</th></tr></thead>
            <tbody>
              <tr v-for="l in cleaningLog" :key="l.n">
                <td>{{ l.n }}</td><td>{{ l.step }}</td><td>{{ l.rows_in_original }}</td><td>{{ l.before }}</td><td>{{ l.after }}</td><td>{{ l.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>
    </section>
  </div>
</template>
