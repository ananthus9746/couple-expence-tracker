/**
 * categories.js
 * Central source of truth for all expense categories.
 */

export const ALL_CATEGORIES = [
  { key: 'food',          icon: 'restaurant',         label: 'Food'        },
  { key: 'groceries',     icon: 'local_grocery_store', label: 'Groceries'   },
  { key: 'shopping',      icon: 'shopping_bag',        label: 'Shopping'    },
  { key: 'bills',         icon: 'receipt_long',        label: 'Bills'       },
  { key: 'emi',           icon: 'account_balance',     label: 'EMI'         },
  { key: 'petrol',        icon: 'local_gas_station',   label: 'Petrol'      },
  { key: 'car',           icon: 'directions_car',      label: 'Car'         },
  { key: 'transport',     icon: 'commute',             label: 'Travel'      },
  { key: 'home',          icon: 'home',                label: 'Home'        },
  { key: 'college',       icon: 'school',              label: 'College'     },
  { key: 'health',        icon: 'favorite',            label: 'Health'      },
  { key: 'entertainment', icon: 'celebration',         label: 'Fun'         },
  { key: 'dining',        icon: 'dinner_dining',       label: 'Dining'      },
  { key: 'gopika',        icon: 'face_3',              label: 'Gopika'      },
  { key: 'ananthu',       icon: 'face',                label: 'Ananthu'     },
  { key: 'other',         icon: 'more_horiz',          label: 'Other'       },
]

export const MAX_PINS = 6
export const DEFAULT_PINNED = ['food', 'groceries', 'bills', 'petrol', 'shopping', 'transport']

const PIN_STORAGE_KEY = 'duel-cat-pins'

/** Read pinned keys from localStorage */
export function getPinnedCategories() {
  try {
    const raw = localStorage.getItem(PIN_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch { /* ignore */ }
  return [...DEFAULT_PINNED]
}

/** Save pinned keys to localStorage */
export function setPinnedCategories(keys) {
  try {
    localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(keys))
  } catch { /* ignore */ }
}

/** Map for quick lookup by key */
export const CATEGORY_MAP = Object.fromEntries(
  ALL_CATEGORIES.map((c) => [c.key, c])
)
