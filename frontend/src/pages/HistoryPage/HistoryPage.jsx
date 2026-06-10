import { useState } from 'react'
import PageShell from '../../components/PageShell/PageShell'
import GlassCard from '../../components/GlassCard/GlassCard'
import ExpenseItem from '../../components/ExpenseItem/ExpenseItem'
import Tabs from '../../components/Tabs/Tabs'
import Icon from '../../components/Icon/Icon'
import { useExpense } from '../../context/ExpenseContext'
import { useAuth } from '../../context/AuthContext'
import { ALL_CATEGORIES } from '../../data/categories'
import { expenses as expensesApi } from '../../services/api'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import styles from './HistoryPage.module.css'

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All' },
  ...ALL_CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
]

const HistoryPage = () => {
  const { state, stats, dispatch } = useExpense()
  const { user } = useAuth()
  const [partnerTab, setPartnerTab]     = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [expenseToDelete, setExpenseToDelete] = useState(null)

  const handleDeleteClick = (expense) => {
    setExpenseToDelete(expense)
  }

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return
    try {
      await expensesApi.delete(expenseToDelete.id)
      dispatch({ type: 'DELETE_EXPENSE', payload: expenseToDelete.id })
    } catch (err) {
      console.error('Failed to delete expense:', err)
      alert(err.message || 'Failed to delete expense')
    } finally {
      setExpenseToDelete(null)
    }
  }

  const partnerTabs = [
    { key: 'all', label: 'Both' },
    { key: 'a',   label: stats.partnerA },
    { key: 'b',   label: stats.partnerB },
  ]

  // First filter by partner tab
  const byPartner =
    partnerTab === 'all'
      ? state.expenses
      : partnerTab === 'a'
        ? state.expenses.filter((e) => e.paidBy === stats.partnerA)
        : state.expenses.filter((e) => e.paidBy === stats.partnerB)

  // Then filter by category chip
  const filtered =
    activeFilter === 'all'
      ? byPartner
      : byPartner.filter(
          (e) => e.category.toLowerCase() === activeFilter.toLowerCase()
        )

  const filteredTotal  = filtered.reduce((sum, e) => sum + e.amount, 0)
  const partnerATotal  = byPartner.filter((e) => e.paidBy === stats.partnerA).reduce((s, e) => s + e.amount, 0)
  const partnerBTotal  = byPartner.filter((e) => e.paidBy === stats.partnerB).reduce((s, e) => s + e.amount, 0)

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  // Reset category filter when switching partner tab
  const handlePartnerTabChange = (key) => {
    setPartnerTab(key)
    setActiveFilter('all')
  }

  return (
    <PageShell showNav showHeader topBarProps={{ title: 'History', showAvatars: false }}>

      {/* ── Partner tabs ── */}
      <Tabs
        tabs={partnerTabs}
        active={partnerTab}
        onChange={handlePartnerTabChange}
        aria-label="Filter by partner"
      />

      {/* ── Category filter chips ── */}
      <div className={styles.filterRow} role="group" aria-label="Filter by category">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.key}
            className={[styles.filterChip, activeFilter === f.key ? styles.active : ''].join(' ')}
            onClick={() => setActiveFilter(f.key)}
            aria-pressed={activeFilter === f.key}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Summary cards ── */}
      <div className={styles.summaryRow}>
        {partnerTab === 'all' ? (
          <>
            <GlassCard>
              <div className={styles.summaryItem}>
                <span
                  className={styles.summaryValue}
                  style={{ color: 'var(--color-partner-a)' }}
                >
                  {formatCurrency(partnerATotal)}
                </span>
                <span className={styles.summaryLabel}>{stats.partnerA}</span>
              </div>
            </GlassCard>
            <GlassCard>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>{filtered.length}</span>
                <span className={styles.summaryLabel}>Txns</span>
              </div>
            </GlassCard>
            <GlassCard>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>{formatCurrency(partnerBTotal)}</span>
                <span className={styles.summaryLabel}>{stats.partnerB}</span>
              </div>
            </GlassCard>
          </>
        ) : (
          <>
            <GlassCard>
              <div className={styles.summaryItem}>
                <span
                  className={styles.summaryValue}
                  style={{ color: partnerTab === 'a' ? 'var(--color-partner-a)' : 'var(--color-on-surface)' }}
                >
                  {formatCurrency(filteredTotal)}
                </span>
                <span className={styles.summaryLabel}>Total</span>
              </div>
            </GlassCard>
            <GlassCard>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>{filtered.length}</span>
                <span className={styles.summaryLabel}>Txns</span>
              </div>
            </GlassCard>
            <GlassCard>
              <div className={styles.summaryItem}>
                <span className={styles.summaryValue}>
                  {filtered.length > 0 ? formatCurrency(filteredTotal / filtered.length) : '—'}
                </span>
                <span className={styles.summaryLabel}>Avg</span>
              </div>
            </GlassCard>
          </>
        )}
      </div>

      {/* ── Expense list ── */}
      {filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Icon name="search_off" size={48} style={{ color: 'var(--color-outline-variant)' }} />
          <p className={styles.emptyText}>
            {activeFilter === 'all'
              ? partnerTab === 'all'
                ? 'No expenses yet. Start tracking!'
                : `${partnerTab === 'a' ? stats.partnerA : stats.partnerB} hasn't added any expenses yet.`
              : `No ${CATEGORY_FILTERS.find(f => f.key === activeFilter)?.label.toLowerCase() || activeFilter} expenses found.`}
          </p>
        </div>
      ) : (
        <div className={styles.list} aria-label="Expense list">
          {filtered.map((expense) => (
            <ExpenseItem
              key={expense.id}
              title={expense.title}
              amount={expense.amount}
              category={expense.category}
              date={expense.date}
              paidBy={expense.paidBy}
              onDelete={expense.addedBy === (user?._id || user?.id) ? () => handleDeleteClick(expense) : undefined}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(expenseToDelete)}
        title="Delete Expense?"
        message={`Are you sure you want to delete "${expenseToDelete?.title}" for ${formatCurrency(expenseToDelete?.amount || 0)}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setExpenseToDelete(null)}
        variant="danger"
      />
    </PageShell>
  )
}

export default HistoryPage
