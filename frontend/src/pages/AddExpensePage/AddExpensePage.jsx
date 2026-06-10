import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../components/PageShell/PageShell'
import Icon from '../../components/Icon/Icon'
import { useExpense } from '../../context/ExpenseContext'
import { expenses as expensesApi } from '../../services/api'
import {
  ALL_CATEGORIES,
  CATEGORY_MAP,
  MAX_PINS,
  getPinnedCategories,
  setPinnedCategories,
} from '../../data/categories'
import styles from './AddExpensePage.module.css'

const AddExpensePage = () => {
  const navigate = useNavigate()
  const { state, dispatch } = useExpense()

  const myName = state.user?.name || state.couple?.partnerA || 'Me'

  const [amount,    setAmount]    = useState('')
  const [category,  setCategory]  = useState('food')
  const [note,      setNote]      = useState('')
  const [amountErr, setAmountErr] = useState('')
  const [pinned,    setPinned]    = useState(() => getPinnedCategories())
  const [editMode,  setEditMode]  = useState(false)
  const [showAll,   setShowAll]   = useState(false)
  const [saving,    setSaving]    = useState(false)

  const pinnedCats   = pinned.map((k) => CATEGORY_MAP[k]).filter(Boolean)
  const unpinnedCats = ALL_CATEGORIES.filter((c) => !pinned.includes(c.key))

  const handleTogglePin = (key) => {
    setPinned((prev) => {
      let next
      if (prev.includes(key))        next = prev.filter((k) => k !== key)
      else if (prev.length < MAX_PINS) next = [...prev, key]
      else return prev
      setPinnedCategories(next)
      return next
    })
  }

  const handleSubmit = async () => {
    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setAmountErr('Please enter a valid amount')
      return
    }
    setAmountErr('')
    setSaving(true)

    try {
      const catLabel = CATEGORY_MAP[category]?.label || category
      const { expense } = await expensesApi.add({
        title:    note.trim() || catLabel,
        amount:   parseFloat(parsed.toFixed(2)),
        category,
        paidBy:   myName,
        date:     new Date().toISOString(),
        note:     note.trim(),
      })

      // Sync to local state with normalised shape
      dispatch({
        type: 'ADD_EXPENSE',
        payload: {
          id:       expense._id,
          title:    expense.title,
          amount:   expense.amount,
          category: expense.category,
          paidBy:   expense.paidBy,
          date:     new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          note:     expense.note,
          addedBy:  expense.addedBy?._id || expense.addedBy,
        },
      })
      navigate('/dashboard')
    } catch (err) {
      setAmountErr(err.message || 'Failed to save expense')
    } finally {
      setSaving(false)
    }
  }

  const CategoryCard = ({ item }) => {
    const isPinned   = pinned.includes(item.key)
    const isSelected = category === item.key
    const atMax      = pinned.length >= MAX_PINS && !isPinned

    return (
      <div
        className={[
          styles.categoryCard,
          isSelected ? styles.selected : '',
          isPinned   ? styles.pinned   : '',
        ].filter(Boolean).join(' ')}
      >
        {/* Pin button — visible always in edit mode, on hover otherwise */}
        <button
          type="button"
          className={[
            styles.pinBtn,
            isPinned  ? styles.pinBtnActive  : '',
            atMax     ? styles.pinBtnDisabled : '',
            editMode  ? styles.pinBtnVisible  : '',
          ].filter(Boolean).join(' ')}
          onClick={(e) => { e.stopPropagation(); handleTogglePin(item.key) }}
          aria-label={isPinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
          aria-pressed={isPinned}
          disabled={atMax}
          title={atMax ? `Max ${MAX_PINS} pins reached` : undefined}
        >
          <Icon name={isPinned ? 'push_pin' : 'push_pin'} size={13} filled={isPinned} />
        </button>

        {/* Main selectable area */}
        <button
          type="button"
          className={styles.categoryCardInner}
          onClick={() => setCategory(item.key)}
          aria-pressed={isSelected}
          aria-label={item.label}
        >
          <Icon
            name={item.icon}
            size={20}
            filled={isSelected}
            className={styles.categoryIcon}
          />
          <span className={styles.categoryCardLabel}>{item.label}</span>
        </button>
      </div>
    )
  }

  return (
    <PageShell
      showNav
      showHeader
      topBarProps={{
        title:          'Add Expense',
        showAvatars:    false,
        showBack:       true,
        showUserAvatar: true,
      }}
    >
      <div className={styles.page}>

        {/* ── Amount ── */}
        <section className={styles.amountSection} aria-label="Amount">
          <label className={styles.amountSectionLabel} htmlFor="amount-input">
            Amount Spent
          </label>
          <div className={styles.amountRow}>
            <span className={styles.currencySymbol} aria-hidden="true">₹</span>
            <input
              id="amount-input"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={styles.amountInput}
              placeholder="0.00"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setAmountErr('') }}
              aria-label="Amount spent"
              aria-invalid={Boolean(amountErr)}
              autoFocus
            />
          </div>
          {amountErr && (
            <span className={styles.amountError} role="alert">{amountErr}</span>
          )}
        </section>

        {/* ── Category ── */}
        <section aria-label="Select category">

          {/* Header row */}
          <div className={styles.sectionHeaderRow}>
            <div className={styles.sectionHeaderLeft}>
              <span className={styles.sectionLabel}>Category</span>
              <span className={styles.selectedCatChip}>
                <Icon name={CATEGORY_MAP[category]?.icon || 'category'} size={11} filled />
                {CATEGORY_MAP[category]?.label || category}
              </span>
            </div>
            <button
              type="button"
              className={[styles.editPinsBtn, editMode ? styles.editPinsBtnActive : ''].filter(Boolean).join(' ')}
              onClick={() => setEditMode((v) => !v)}
              aria-pressed={editMode}
            >
              <Icon name={editMode ? 'check' : 'push_pin'} size={11} filled={editMode} />
              {editMode ? 'Done' : `Pins ${pinned.length}/${MAX_PINS}`}
            </button>
          </div>

          {/* Edit mode hint */}
          {editMode && (
            <p className={styles.editHint}>
              Tap the pin on any category to add or remove it from your quick picks.
            </p>
          )}

          {/* ── Pinned section ── */}
          {pinnedCats.length > 0 && (
            <>
              <p className={styles.gridSectionLabel}>Quick picks</p>
              <div className={styles.categoryGrid} role="group" aria-label="Pinned categories">
                {pinnedCats.map((item) => (
                  <CategoryCard key={item.key} item={item} />
                ))}
              </div>
            </>
          )}

          {/* ── All other categories ── */}
          {unpinnedCats.length > 0 && (
            <>
              <button
                type="button"
                className={styles.showAllBtn}
                onClick={() => setShowAll((v) => !v)}
                aria-expanded={showAll}
              >
                <Icon name={showAll ? 'expand_less' : 'expand_more'} size={16} />
                {showAll ? 'Hide all categories' : `Show all categories (${unpinnedCats.length} more)`}
              </button>

              {showAll && (
                <>
                  <p className={[styles.gridSectionLabel, styles.gridSectionLabelMore].join(' ')}>
                    All categories
                  </p>
                  <div
                    className={[styles.categoryGrid, styles.moreGrid].join(' ')}
                    role="group"
                    aria-label="All categories"
                  >
                    {unpinnedCats.map((item) => (
                      <CategoryCard key={item.key} item={item} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </section>

        {/* ── Note ── */}
        <section aria-label="Add note">
          <span className={styles.sectionLabel}>
            Note <span className={styles.optional}>(optional)</span>
          </span>
          <div className={styles.noteCard}>
            <textarea
              className={styles.noteTextarea}
              placeholder="What was this for?"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              aria-label="Expense note"
            />
          </div>
        </section>

        {/* ── CTA ── */}
        <button
          type="button"
          className={styles.ctaBtn}
          onClick={handleSubmit}
          disabled={saving}
          aria-label="Add expense"
        >
          <span className={styles.ctaIcon}>
            <Icon name="add_circle" size={22} filled />
          </span>
          {saving ? 'Saving…' : 'Add Expense'}
        </button>

      </div>
    </PageShell>
  )
}

export default AddExpensePage
