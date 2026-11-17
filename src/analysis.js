// All figures on the page are computed here from the cleaned transactions,
// so the site always agrees with the data file it ships with.
import transactions from './data/transactions.json'

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const sum = (rows) => rows.reduce((s, t) => s + t.amount, 0)
const isExpense = (t) => t.type === 'Expense'
const isIncome = (t) => t.type === 'Income'

export const monthLabel = (m) =>
  new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })

export const allTransactions = transactions
export const months = [...new Set(transactions.map((t) => t.month))].sort()

const dates = transactions.map((t) => t.date).sort()
export const period = { first: dates[0], last: dates[dates.length - 1], count: transactions.length }

/** Rows for one month, or every row when month is '' */
export const filterRows = (month) => (month ? transactions.filter((t) => t.month === month) : transactions)

/** Headline figures for the selected month */
export function kpis(rows) {
  const income = sum(rows.filter(isIncome))
  const expense = sum(rows.filter(isExpense))
  const food = sum(rows.filter((t) => isExpense(t) && t.category === 'Food'))
  return {
    income,
    expense,
    net: income - expense,
    expenseTxns: rows.filter(isExpense).length,
    expenseToIncome: income ? expense / income : 0,
    food,
    foodShare: expense ? food / expense : 0,
  }
}

/** Q1 — total spent and number of transactions per expense category */
export function byCategory(rows) {
  const exp = rows.filter(isExpense)
  const total = sum(exp)
  const groups = new Map()
  for (const t of exp) {
    const g = groups.get(t.category) ?? { category: t.category, total: 0, txns: 0 }
    g.total += t.amount
    g.txns += 1
    groups.set(t.category, g)
  }
  return [...groups.values()]
    .map((g) => ({ ...g, share: total ? g.total / total : 0, avg: g.total / g.txns }))
    .sort((a, b) => b.total - a.total)
}

/** Q2 — income vs expenses per month (always the full period) */
export function monthly() {
  return months.map((m) => {
    const rows = filterRows(m)
    const income = sum(rows.filter(isIncome))
    const expense = sum(rows.filter(isExpense))
    const days = rows.map((t) => t.date).sort()
    return {
      month: m,
      label: monthLabel(m),
      income,
      expense,
      net: income - expense,
      deficit: expense > income,
      firstDay: days[0],
      lastDay: days[days.length - 1],
    }
  })
}

/** Q3 — Food-category spend per month, split by the Meal? flag */
export function foodMonthly() {
  return months.map((m) => {
    const exp = filterRows(m).filter(isExpense)
    const food = exp.filter((t) => t.category === 'Food')
    const meal = sum(food.filter((t) => t.meal))
    const total = sum(food)
    return {
      month: m,
      label: monthLabel(m),
      total,
      meal,
      nonMeal: total - meal,
      txns: food.length,
      shareOfMonth: sum(exp) ? total / sum(exp) : 0,
    }
  })
}

const incomeSource = (t) => (/dad/i.test(t.note) ? 'Dad' : t.category === 'Salary' ? 'Salary' : 'Friends & other')

export function incomeSources(rows) {
  const inc = rows.filter(isIncome)
  const total = sum(inc)
  return ['Dad', 'Salary', 'Friends & other'].map((source) => {
    const r = inc.filter((t) => incomeSource(t) === source)
    return { source, amount: sum(r), txns: r.length, share: total ? sum(r) / total : 0 }
  })
}

export function byWeekday(rows) {
  const exp = rows.filter(isExpense)
  const total = sum(exp)
  return WEEKDAYS.map((weekday) => {
    const r = exp.filter((t) => t.weekday === weekday)
    return { weekday, amount: sum(r), txns: r.length, share: total ? sum(r) / total : 0 }
  })
}

export const topExpenses = (rows, n = 8) =>
  rows.filter(isExpense).sort((a, b) => b.amount - a.amount).slice(0, n)

/** Whole-period figures used in the insight sentences */
export function insights() {
  const exp = transactions.filter(isExpense)
  const inc = transactions.filter(isIncome)
  const totalExp = sum(exp)
  const totalInc = sum(inc)
  const food = exp.filter((t) => t.category === 'Food')
  const rent = exp.filter((t) => t.note === 'Rent')
  const dad = inc.filter((t) => incomeSource(t) === 'Dad')
  const salary = inc.filter((t) => incomeSource(t) === 'Salary')
  const weekend = exp.filter((t) => t.weekday === 'Saturday' || t.weekday === 'Sunday')
  const sortedAmounts = exp.map((t) => t.amount).sort((a, b) => a - b)
  const mid = Math.floor(sortedAmounts.length / 2)
  const m = monthly()
  const deficits = m.filter((x) => x.deficit)
  const worst = [...m].sort((a, b) => a.net - b.net)[0]
  const peakFood = [...foodMonthly()].sort((a, b) => b.total - a.total)[0]
  return {
    totalExp,
    totalInc,
    net: totalInc - totalExp,
    deficits,
    worst,
    peakFood,
    foodTotal: sum(food),
    foodShare: sum(food) / totalExp,
    foodTxns: food.length,
    foodAvg: sum(food) / food.length,
    nonMealShare: sum(food.filter((t) => !t.meal)) / sum(food),
    rentTotal: sum(rent),
    rentCount: rent.length,
    rentShare: sum(rent) / totalExp,
    dadShare: sum(dad) / totalInc,
    salaryTotal: sum(salary),
    friendsIn: totalInc - sum(dad) - sum(salary),
    otherOut: sum(exp.filter((t) => t.category === 'Other')),
    weekendShare: sum(weekend) / totalExp,
    median: sortedAmounts.length % 2 ? sortedAmounts[mid] : (sortedAmounts[mid - 1] + sortedAmounts[mid]) / 2,
  }
}

export const inr = (v, digits = 0) =>
  (v < 0 ? '−₹' : '₹') +
  Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: digits, maximumFractionDigits: digits })
export const pct = (v) => `${(v * 100).toFixed(1)}%`
export const fmtDate = (d) =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
