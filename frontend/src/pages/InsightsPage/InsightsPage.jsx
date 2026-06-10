import { useEffect, useState } from 'react'
import PageShell from '../../components/PageShell/PageShell'
import GlassCard from '../../components/GlassCard/GlassCard'
import Tabs from '../../components/Tabs/Tabs'
import Icon from '../../components/Icon/Icon'
import { useExpense } from '../../context/ExpenseContext'
import { CATEGORY_MAP } from '../../data/categories'
import styles from './InsightsPage.module.css'

/* ═══════════════════════════════════════════
   DATE FILTER CONFIG
═══════════════════════════════════════════ */

const DATE_FILTERS = [
  { key: 'today',      label: 'Today'        },
  { key: 'week',       label: 'This Week'     },
  { key: 'last_week',  label: 'Last Week'     },
  { key: 'month',      label: 'This Month'    },
  { key: 'last_month', label: 'Last Month'    },
  { key: 'q3',         label: 'Last 3 Months' },
  { key: 'q6',         label: 'Last 6 Months' },
  { key: 'year',       label: 'This Year'     },
]

const now         = new Date()
const YEAR        = now.getFullYear()
const MONTH       = now.getMonth()
const TODAY       = now.getDate()
const DAY_OF_WEEK = now.getDay() === 0 ? 6 : now.getDay() - 1 // 0=Mon…6=Sun

const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

/** Parse "Jun 9" style date strings */
function parseExpenseDate(dateStr) {
  try {
    const d = new Date(`${dateStr} ${YEAR}`)
    if (!isNaN(d)) return d
  } catch { /* */ }
  return null
}

/** Get Monday of current week */
function getWeekStart(ref = now) {
  const dow = ref.getDay() === 0 ? 6 : ref.getDay() - 1
  const ws  = new Date(ref)
  ws.setDate(ref.getDate() - dow)
  ws.setHours(0, 0, 0, 0)
  return ws
}

/** Returns { start, end } Date objects for a given filter key */
function getRangeBounds(rangeKey) {
  const start = new Date(); start.setHours(0,0,0,0)
  const end   = new Date(); end.setHours(23,59,59,999)

  if (rangeKey === 'today') {
    return { start, end }
  }
  if (rangeKey === 'week') {
    const ws = getWeekStart()
    const we = new Date(ws); we.setDate(ws.getDate() + 6); we.setHours(23,59,59,999)
    return { start: ws, end: we }
  }
  if (rangeKey === 'last_week') {
    const thisWs   = getWeekStart()
    const lastWe   = new Date(thisWs); lastWe.setMilliseconds(-1)
    const lastWs   = getWeekStart(lastWe)
    lastWe.setHours(23,59,59,999)
    return { start: lastWs, end: lastWe }
  }
  if (rangeKey === 'month') {
    const ms = new Date(YEAR, MONTH, 1, 0, 0, 0, 0)
    const me = new Date(YEAR, MONTH, TODAY, 23, 59, 59, 999)
    return { start: ms, end: me }
  }
  if (rangeKey === 'last_month') {
    const lm    = MONTH === 0 ? 11 : MONTH - 1
    const lmYr  = MONTH === 0 ? YEAR - 1 : YEAR
    const days  = new Date(lmYr, lm + 1, 0).getDate()
    return {
      start: new Date(lmYr, lm, 1, 0, 0, 0, 0),
      end:   new Date(lmYr, lm, days, 23, 59, 59, 999),
    }
  }
  if (rangeKey === 'q3') {
    const s = new Date(now); s.setMonth(s.getMonth() - 2); s.setDate(1); s.setHours(0,0,0,0)
    return { start: s, end }
  }
  if (rangeKey === 'q6') {
    const s = new Date(now); s.setMonth(s.getMonth() - 5); s.setDate(1); s.setHours(0,0,0,0)
    return { start: s, end }
  }
  if (rangeKey === 'year') {
    return { start: new Date(YEAR, 0, 1, 0, 0, 0, 0), end }
  }
  return { start: new Date(0), end }
}

/** Filter expenses to a range key */
function filterByRange(expenses, rangeKey) {
  const { start, end } = getRangeBounds(rangeKey)
  return expenses.filter((e) => {
    const d = parseExpenseDate(e.date)
    return d && d >= start && d <= end
  })
}

/** Human-readable subtitle for a range */
function getRangeLabel(rangeKey) {
  const { start, end } = getRangeBounds(rangeKey)
  const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  const fmtFull = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  if (rangeKey === 'today')      return now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
  if (rangeKey === 'week')       return `${fmt(start)} – ${fmt(end)}`
  if (rangeKey === 'last_week')  return `${fmt(start)} – ${fmt(end)}`
  if (rangeKey === 'month')      return now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  if (rangeKey === 'last_month') return start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  if (rangeKey === 'q3')         return `${start.toLocaleDateString('en-IN', { month: 'short' })} – ${MONTH_SHORT[MONTH]} ${YEAR}`
  if (rangeKey === 'q6')         return `${start.toLocaleDateString('en-IN', { month: 'short' })} – ${MONTH_SHORT[MONTH]} ${YEAR}`
  if (rangeKey === 'year')       return `Jan – ${MONTH_SHORT[MONTH]} ${YEAR}`
  return ''
}

/* ═══════════════════════════════════════════
   CHART DATA BUILDERS
═══════════════════════════════════════════ */

function buildChartData(expenses, personName, rangeKey) {
  const mine = expenses.filter((e) => e.paidBy === personName)
  const { start, end } = getRangeBounds(rangeKey)

  if (rangeKey === 'today') {
    // Show current week with today highlighted — same as week view
    const buckets = Array(7).fill(0)
    const ws = getWeekStart()
    mine.forEach((e) => {
      const d = parseExpenseDate(e.date)
      if (!d) return
      const diff = Math.floor((d - ws) / 86400000)
      if (diff >= 0 && diff < 7) buckets[diff] += e.amount
    })
    return { buckets, labels: DAY_NAMES, highlightIdx: DAY_OF_WEEK, barWidth: 'normal' }
  }

  if (rangeKey === 'week' || rangeKey === 'last_week') {
    const buckets = Array(7).fill(0)
    mine.forEach((e) => {
      const d = parseExpenseDate(e.date)
      if (!d) return
      const diff = Math.floor((d - start) / 86400000)
      if (diff >= 0 && diff < 7) buckets[diff] += e.amount
    })
    const highlight = rangeKey === 'week' ? DAY_OF_WEEK : -1
    return { buckets, labels: DAY_NAMES, highlightIdx: highlight, barWidth: 'normal' }
  }

  if (rangeKey === 'month' || rangeKey === 'last_month') {
    // one bar per day of the month
    const daysInRange = Math.round((end - start) / 86400000) + 1
    const buckets = Array(daysInRange).fill(0)
    mine.forEach((e) => {
      const d = parseExpenseDate(e.date)
      if (!d || d < start || d > end) return
      const idx = Math.floor((d - start) / 86400000)
      if (idx >= 0 && idx < daysInRange) buckets[idx] += e.amount
    })
    const labels = buckets.map((_, i) => String(i + 1))
    const highlight = rangeKey === 'month' ? TODAY - 1 : -1
    return { buckets, labels, highlightIdx: highlight, barWidth: 'normal' }
  }

  // q3, q6, year — daily bars, month labels on boundaries
  const dayMap = {}
  mine.forEach((e) => {
    const d = parseExpenseDate(e.date)
    if (!d || d < start || d > end) return
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    dayMap[key] = (dayMap[key] || 0) + e.amount
  })

  const buckets = []
  const labels  = []
  let highlightIdx = -1
  const cursor = new Date(start)

  while (cursor <= end) {
    const key = `${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`
    buckets.push(dayMap[key] || 0)
    labels.push(cursor.getDate() === 1 ? MONTH_SHORT[cursor.getMonth()] : String(cursor.getDate()))
    if (cursor.getDate() === TODAY && cursor.getMonth() === MONTH && cursor.getFullYear() === YEAR) {
      highlightIdx = buckets.length - 1
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  return { buckets, labels, highlightIdx, barWidth: 'wide' }
}

/* ═══════════════════════════════════════════
   CHART COMPONENT
═══════════════════════════════════════════ */
const SpendChart = ({ buckets, labels, highlightIdx, partnerColor, fmt, barsVisible, barWidth }) => {
  const [tooltip, setTooltip] = useState(null)
  const maxVal   = Math.max(...buckets, 1)
  const isWide   = barWidth === 'wide'

  const showLabel = (i) => {
    if (!isWide) return true   // week/month: always show
    // wide (q3/q6/year): show month boundaries + today + first
    return i === 0 || i === highlightIdx || isNaN(Number(labels[i]))
  }

  return (
    <div className={styles.dailyChart}>
      <div className={[styles.chartScroll, isWide ? styles.chartScrollWide : ''].filter(Boolean).join(' ')}>
        <div className={styles.dailyBars} role="img" aria-label="Spending chart">
          {buckets.map((val, i) => {
            const isHighlight = i === highlightIdx
            const hasSpend    = val > 0
            const heightPct   = barsVisible
              ? Math.max(hasSpend ? 5 : 1, Math.round((val / maxVal) * 100))
              : 0

            return (
              <div
                key={i}
                className={styles.dailyBarWrap}
                onMouseEnter={() => hasSpend && setTooltip({ i, amount: val })}
                onMouseLeave={() => setTooltip(null)}
                onTouchStart={() =>
                  hasSpend && setTooltip((t) => (t?.i === i ? null : { i, amount: val }))
                }
              >
                {tooltip?.i === i && (
                  <div className={styles.barTooltip}>
                    <span className={styles.barTooltipAmt}>{fmt(val)}</span>
                    <span className={styles.barTooltipDay}>{labels[i]}</span>
                  </div>
                )}
                <div
                  className={[
                    styles.dailyBar,
                    isHighlight ? styles.dailyBarToday : '',
                    !hasSpend   ? styles.dailyBarEmpty : '',
                  ].filter(Boolean).join(' ')}
                  style={{
                    height:     `${heightPct}%`,
                    background: hasSpend ? partnerColor : undefined,
                    boxShadow:  hasSpend && isHighlight ? `0 0 10px ${partnerColor}70` : undefined,
                    transition: `height 0.45s cubic-bezier(0.4,0,0.2,1) ${i * (isWide ? 3 : 40)}ms`,
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* X-axis */}
        <div className={styles.dailyAxisRow} aria-hidden="true">
          {labels.map((lbl, i) => (
            <span
              key={i}
              className={[
                styles.dailyAxisLabel,
                i === highlightIdx ? styles.dailyAxisLabelToday : '',
              ].filter(Boolean).join(' ')}
            >
              {showLabel(i) ? lbl : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════
   PER-PARTNER PANEL
═══════════════════════════════════════════ */
const PartnerInsights = ({
  partnerName, partnerColor, allExpenses, otherName, barsVisible, dateFilter,
}) => {
  const fmt = (n) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(n)

  // Filtered expenses for the selected range
  const rangeExpenses = filterByRange(allExpenses, dateFilter)
  const myExpenses    = rangeExpenses.filter((e) => e.paidBy === partnerName)
  const otherExpenses = rangeExpenses.filter((e) => e.paidBy === otherName)

  const total      = myExpenses.reduce((s, e) => s + e.amount, 0)
  const otherTotal = otherExpenses.reduce((s, e) => s + e.amount, 0)
  const grandTotal = total + otherTotal
  const sharePercent = grandTotal ? Math.round((total / grandTotal) * 100) : 0

  const activeDays = (() => {
    const days = new Set(myExpenses.map((e) => e.date))
    return days.size
  })()

  // Category breakdown for this range
  const catTotals = {}
  myExpenses.forEach((e) => {
    const cat = e.category || 'other'
    catTotals[cat] = (catTotals[cat] || 0) + e.amount
  })
  const catRows = Object.entries(catTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([cat, amount]) => ({
      cat, amount,
      percent: total ? Math.round((amount / total) * 100) : 0,
      label: CATEGORY_MAP[cat]?.label || cat,
      icon:  CATEGORY_MAP[cat]?.icon  || 'category',
    }))

  // Chart data
  const { buckets, labels, highlightIdx, barWidth } = buildChartData(allExpenses, partnerName, dateFilter)
  const maxDay    = Math.max(...buckets, 0)
  const avgPerDay = activeDays ? total / activeDays : 0
  const rangeLabel = getRangeLabel(dateFilter)

  const chartTitle = {
    today:      'This Week',
    week:       'This Week',
    last_week:  'Last Week',
    month:      'This Month',
    last_month: 'Last Month',
    q3:         'Last 3 Months',
    q6:         'Last 6 Months',
    year:       'This Year',
  }[dateFilter] || 'Spending'

  if (myExpenses.length === 0) {
    return (
      <div className={styles.empty}>
        <Icon name="receipt_long" size={48} style={{ color: 'var(--color-outline-variant)' }} />
        <h3 className={styles.emptyTitle}>No expenses</h3>
        <p className={styles.emptyText}>
          {partnerName} has no expenses for this period.
        </p>
      </div>
    )
  }

  return (
    <div className={styles.partnerPanel}>

      {/* ── Hero total ── */}
      <GlassCard elevated>
        <div className={styles.heroCard}>
          <div className={styles.heroLeft}>
            <span className={styles.heroLabel}>Total Spent</span>
            <span className={styles.heroAmount} style={{ color: partnerColor }}>{fmt(total)}</span>
            <span className={styles.heroSub}>
              {myExpenses.length} txn{myExpenses.length !== 1 ? 's' : ''}
              {activeDays > 1 ? ` · ${activeDays} days` : ''}
            </span>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.shareCircle} style={{ '--partner-color': partnerColor }}>
              <span className={styles.sharePercent}>{sharePercent}%</span>
              <span className={styles.shareLabel}>of total</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* ── Chart ── */}
      <section className={styles.section} aria-label="Spending chart">
        <GlassCard>
          <div className={styles.sectionCard}>
            <div className={styles.dailyHeader}>
              <div>
                <span className={styles.sectionLabel}>{chartTitle}</span>
                <p className={styles.dailySubtitle}>{rangeLabel}</p>
              </div>
              <div className={styles.dailyStats}>
                <div className={styles.dailyStat}>
                  <span className={styles.dailyStatVal} style={{ color: partnerColor }}>
                    {fmt(maxDay)}
                  </span>
                  <span className={styles.dailyStatLabel}>Peak day</span>
                </div>
                <div className={styles.dailyStatDivider} />
                <div className={styles.dailyStat}>
                  <span className={styles.dailyStatVal}>{fmt(avgPerDay)}</span>
                  <span className={styles.dailyStatLabel}>Avg/day</span>
                </div>
              </div>
            </div>

            <SpendChart
              buckets={buckets}
              labels={labels}
              highlightIdx={highlightIdx}
              partnerColor={partnerColor}
              fmt={fmt}
              barsVisible={barsVisible}
              barWidth={barWidth}
            />
          </div>
        </GlassCard>
      </section>

      {/* ── Category breakdown ── */}
      {catRows.length > 0 && (
        <section className={styles.section} aria-label="Category breakdown">
          <div className={styles.sectionHeader}>
            <h4 className={styles.sectionTitle}>By Category</h4>
          </div>
          <GlassCard>
            <div className={styles.categoryDuelCard}>
              {catRows.map(({ cat, amount, percent, label, icon }) => (
                <div key={cat} className={styles.categoryDuelRow}>
                  <div className={styles.categoryDuelMeta}>
                    <span className={styles.categoryDuelName}>
                      <Icon name={icon} size={18} />
                      {label}
                    </span>
                    <span className={styles.categoryDuelSplit}>
                      {fmt(amount)} · {percent}%
                    </span>
                  </div>
                  <div className={styles.splitBar} role="img" aria-label={`${label}: ${percent}%`}>
                    <div
                      className={styles.splitBarFill}
                      style={{ width: `${percent}%`, background: partnerColor, opacity: 0.85 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>
      )}

    </div>
  )
}

/* ═══════════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════════ */
const InsightsPage = () => {
  const { state, stats } = useExpense()
  const [activeTab,   setActiveTab]   = useState('a')
  const [dateFilter,  setDateFilter]  = useState('week')   // default: this week
  const [barsVisible, setBarsVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setBarsVisible(true), 150)
    return () => clearTimeout(t)
  }, [])

  const triggerBars = () => {
    setBarsVisible(false)
    setTimeout(() => setBarsVisible(true), 80)
  }

  const handleTabChange = (key) => {
    setActiveTab(key)
    triggerBars()
  }

  const handleDateFilter = (key) => {
    setDateFilter(key)
    triggerBars()
  }

  const partnerTabs = [
    { key: 'a', label: stats.partnerA },
    { key: 'b', label: stats.partnerB },
  ]

  if (state.expenses.length === 0) {
    return (
      <PageShell showNav showHeader topBarProps={{ title: 'Insights', showAvatars: false }}>
        <div className={styles.empty}>
          <Icon name="insights" size={56} style={{ color: 'var(--color-outline-variant)' }} />
          <h2 className={styles.emptyTitle}>No data yet</h2>
          <p className={styles.emptyText}>
            Add some expenses and your spending insights will appear here.
          </p>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell showNav showHeader topBarProps={{ title: 'Insights', showAvatars: false }}>

      {/* ── Date filter chips (horizontally scrollable) ── */}
      <div className={styles.dateFilterBar} role="group" aria-label="Date range">
        {DATE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={[
              styles.dateFilterBtn,
              dateFilter === key ? styles.dateFilterBtnActive : '',
            ].filter(Boolean).join(' ')}
            onClick={() => handleDateFilter(key)}
            aria-pressed={dateFilter === key}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Partner tabs ── */}
      <Tabs
        tabs={partnerTabs}
        active={activeTab}
        onChange={handleTabChange}
        aria-label="Select partner"
      />

      {/* ── Partner panel ── */}
      {activeTab === 'a' ? (
        <PartnerInsights
          key={`a-${dateFilter}`}
          partnerName={stats.partnerA}
          partnerColor="var(--color-partner-a)"
          allExpenses={state.expenses}
          otherName={stats.partnerB}
          barsVisible={barsVisible}
          dateFilter={dateFilter}
        />
      ) : (
        <PartnerInsights
          key={`b-${dateFilter}`}
          partnerName={stats.partnerB}
          partnerColor="var(--color-on-surface)"
          allExpenses={state.expenses}
          otherName={stats.partnerA}
          barsVisible={barsVisible}
          dateFilter={dateFilter}
        />
      )}

    </PageShell>
  )
}

export default InsightsPage
