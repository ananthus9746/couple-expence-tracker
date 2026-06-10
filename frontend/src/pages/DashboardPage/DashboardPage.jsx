import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../components/PageShell/PageShell'
import GlassCard from '../../components/GlassCard/GlassCard'
import DuelBar from '../../components/DuelBar/DuelBar'
import Tabs from '../../components/Tabs/Tabs'
import ExpenseItem from '../../components/ExpenseItem/ExpenseItem'
import Icon from '../../components/Icon/Icon'
import { useExpense } from '../../context/ExpenseContext'
import { useAuth } from '../../context/AuthContext'
import { expenses as expensesApi } from '../../services/api'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import styles from './DashboardPage.module.css'

const VIEW_TABS = [
  { key: 'mine',    label: 'Mine'    },
  { key: 'partner', label: 'Partner' },
]

const DashboardPage = () => {
  const navigate = useNavigate()
  const { state, stats, dispatch } = useExpense()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('mine')
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

  const formatCurrency = (n) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

  const myName      = state.user?.name || stats.partnerA
  const partnerName = myName === stats.partnerA ? stats.partnerB : stats.partnerA

  // Load expenses from API on mount
  useEffect(() => {
    expensesApi.list({ limit: 100, sort: '-date' })
      .then(({ expenses }) => {
        // Normalise dates and hydrate local state
        const normalised = expenses.map((e) => ({
          id:       e._id,
          title:    e.title,
          amount:   e.amount,
          category: e.category,
          paidBy:   e.paidBy,
          date:     new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          note:     e.note,
          addedBy:  e.addedBy?._id || e.addedBy,
        }))
        dispatch({ type: 'HYDRATE', payload: { expenses: normalised } })
      })
      .catch(() => {/* silently ignore — use cached state */})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Filter expenses by tab
  const visibleExpenses = state.expenses
    .filter((e) => e.paidBy === (activeTab === 'mine' ? myName : partnerName))
    .slice(0, 5)

  // Standing message
  const diff = Math.abs(stats.aTotal - stats.bTotal)
  const leader = stats.aTotal >= stats.bTotal ? stats.partnerA : stats.partnerB
  const standingMsg =
    stats.total === 0
      ? 'No expenses yet — start tracking!'
      : myName === leader
      ? `You spent ${formatCurrency(diff)} more 😬`
      : `${leader} is ahead by ${formatCurrency(diff)} 😄`

  return (
    <PageShell
      showNav
      showHeader
      topBarProps={{ hasNotif: state.expenses.length > 0 }}
    >
      {/* ── Standing card ── */}
      <GlassCard elevated>
        <div className={styles.standingCard}>
          <div className={styles.standingMeta}>
            <span className={styles.standingLabel}>This Month&apos;s Standing</span>
            <h2 className={styles.standingTitle}>{standingMsg}</h2>
          </div>

          <DuelBar
            partnerA={stats.partnerA}
            partnerB={stats.partnerB}
            amountA={formatCurrency(stats.aTotal)}
            amountB={formatCurrency(stats.bTotal)}
            percentA={stats.aPercent || 50}
          />

          <p className={styles.standingCaption}>
            {stats.total === 0
              ? 'Be the first to add an expense!'
              : stats.partnerA === leader
              ? `${stats.partnerA} is leading the spending race!`
              : `${stats.partnerB} is leading the spending race!`}
          </p>
        </div>
      </GlassCard>

      {/* ── Mine / Partner tabs ── */}
      <Tabs
        tabs={VIEW_TABS}
        active={activeTab}
        onChange={setActiveTab}
        className={styles.tabs}
      />

      {/* ── Recent activity ── */}
      <section className={styles.section} aria-label="Recent activity">
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Recent Activity</h3>
          {state.expenses.length > 0 && (
            <button className={styles.seeAll} onClick={() => navigate('/history')}>
              View All
            </button>
          )}
        </div>

        {visibleExpenses.length === 0 ? (
          <div className={styles.emptyState}>
            <Icon
              name="receipt_long"
              size={48}
              style={{ color: 'var(--color-outline-variant)' }}
            />
            <p className={styles.emptyText}>
              {activeTab === 'mine'
                ? "You haven't added any expenses yet."
                : `No expenses from ${partnerName} yet.`}
            </p>
          </div>
        ) : (
          <div className={styles.expenseList}>
            {visibleExpenses.map((expense) => (
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
      </section>

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

export default DashboardPage
