import { useEffect, useState, useCallback } from 'react';
import { 
  PiggyBank, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import api from '../api/axios';

export default function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ category_id: '', amount: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/budgets?year=${date.year}&month=${date.month}`);
      setBudgets(res.data.budgets || []);
    } catch (err) {
      console.error('Failed to load budgets', err);
    } finally {
      setLoading(false);
    }
  }, [date.year, date.month]);

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        // Budgets only apply to expense categories
        setCategories((res.data.categories || []).filter((c) => c.type === 'expense'));
      })
      .catch((err) => console.error('Failed to load categories', err));

    fetchBudgets();
  }, [fetchBudgets]);

  const handlePrevMonth = () => {
    setDate((prev) => {
      if (prev.month === 1) return { year: prev.year - 1, month: 12 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setDate((prev) => {
      if (prev.month === 12) return { year: prev.year + 1, month: 1 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category_id || !form.amount) {
      setError('Please choose a category and enter a budget amount');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.post('/budgets', {
        category_id: form.category_id,
        amount: form.amount,
        year: date.year,
        month: date.month,
      });
      setForm({ category_id: '', amount: '' });
      fetchBudgets();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to set budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget target?')) return;
    try {
      await api.delete(`/budgets/${id}`);
      fetchBudgets();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove budget');
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={styles.container} className="animate-fade">
      {/* Header & Controls */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Category Budgets</h1>
          <p style={styles.subtitle}>
            Set monthly spending limits and prevent unexpected overspending
          </p>
        </div>

        {/* Month Selector */}
        <div style={styles.monthSelector}>
          <button onClick={handlePrevMonth} style={styles.iconBtn}>
            <ChevronLeft size={18} />
          </button>
          <span style={styles.monthText}>
            {monthNames[date.month - 1]} {date.year}
          </span>
          <button onClick={handleNextMonth} style={styles.iconBtn}>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Set / Update Budget Form Card */}
      <div style={styles.createCard}>
        <div style={styles.cardHeader}>
          <div style={styles.cardIconBox}>
            <PiggyBank size={20} color="#4f46e5" />
          </div>
          <div>
            <h2 style={styles.cardTitle}>Set a Budget Limit</h2>
            <p style={styles.cardDesc}>
              Define a maximum spending threshold for {monthNames[date.month - 1]}
            </p>
          </div>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.formRow}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Expense Category</label>
            <select
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
              style={styles.formInput}
              required
            >
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>Monthly Limit (₹)</label>
            <input
              type="number"
              min="1"
              step="0.01"
              placeholder="e.g. 5000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={styles.formInput}
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={styles.submitBtn}
          >
            <Plus size={16} />
            <span>{submitting ? 'Saving...' : 'Set Budget'}</span>
          </button>
        </form>
      </div>

      {/* Budgets Grid */}
      {loading ? (
        <div style={styles.loadingMsg}>Loading budgets...</div>
      ) : budgets.length === 0 ? (
        <div style={styles.emptyCard}>
          <PiggyBank size={48} color="#cbd5e1" />
          <p style={styles.emptyTitle}>No budget limits set for this month</p>
          <p style={styles.emptySubtitle}>
            Select a category above to establish your first monthly spending goal.
          </p>
        </div>
      ) : (
        <div style={styles.budgetsGrid}>
          {budgets.map((b) => {
            const percentage = Math.min(Math.round((b.spent / b.amount) * 100), 100);
            const isOverspent = b.isOverspent;
            const isWarning = !isOverspent && percentage >= 80;

            let barColor = '#10b981'; // Green
            let statusColor = '#059669';
            let statusBg = '#ecfdf5';

            if (isOverspent) {
              barColor = '#ef4444'; // Red
              statusColor = '#dc2626';
              statusBg = '#fef2f2';
            } else if (isWarning) {
              barColor = '#f59e0b'; // Amber
              statusColor = '#d97706';
              statusBg = '#fffbeb';
            }

            return (
              <div
                key={b.id}
                style={{
                  ...styles.budgetCard,
                  borderTop: `4px solid ${barColor}`,
                }}
                className="animate-fade"
              >
                {/* Card Title & Actions */}
                <div style={styles.budgetCardHeader}>
                  <div>
                    <h3 style={styles.categoryTitle}>{b.category?.name}</h3>
                    <div style={{ ...styles.statusPill, backgroundColor: statusBg, color: statusColor }}>
                      {isOverspent ? (
                        <>
                          <ShieldAlert size={13} />
                          <span>Overspent by {fmt(Math.abs(b.remaining))}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={13} />
                          <span>{fmt(b.remaining)} left to spend</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(b.id)}
                    style={styles.deleteBtn}
                    title="Delete budget"
                  >
                    <Trash2 size={15} color="#94a3b8" />
                  </button>
                </div>

                {/* Spending Progress Bar */}
                <div style={styles.progressContainer}>
                  <div style={styles.progressHeader}>
                    <span style={styles.spentLabel}>
                      <strong>{fmt(b.spent)}</strong> of {fmt(b.amount)}
                    </span>
                    <span style={{ ...styles.pctLabel, color: statusColor }}>
                      {Math.round((b.spent / b.amount) * 100)}%
                    </span>
                  </div>

                  <div style={styles.progressTrack}>
                    <div
                      style={{
                        ...styles.progressFill,
                        width: `${percentage}%`,
                        backgroundColor: barColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '2px',
  },
  monthSelector: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '4px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#475569',
  },
  monthText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b',
    padding: '0 12px',
    minWidth: '130px',
    textAlign: 'center',
  },
  createCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '18px',
  },
  cardIconBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
  },
  cardDesc: {
    fontSize: '13px',
    color: '#64748b',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  formRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '16px',
    flexWrap: 'wrap',
  },
  inputGroup: {
    flex: 1,
    minWidth: '220px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  inputLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
  },
  formInput: {
    padding: '10px 14px',
    borderRadius: '9px',
    border: '1.5px solid #cbd5e1',
    fontSize: '14px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '11px 20px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '9px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
  },
  budgetsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  budgetCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '22px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
  },
  budgetCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '18px',
  },
  categoryTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '6px',
  },
  statusPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 9px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spentLabel: {
    fontSize: '13px',
    color: '#64748b',
  },
  pctLabel: {
    fontSize: '13px',
    fontWeight: '700',
  },
  progressTrack: {
    height: '9px',
    borderRadius: '999px',
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  loadingMsg: {
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #e2e8f0',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1e293b',
    marginTop: '6px',
  },
  emptySubtitle: {
    fontSize: '13px',
    color: '#64748b',
    textAlign: 'center',
  },
};
