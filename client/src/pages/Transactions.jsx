import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Tag, 
  RotateCcw,
  X,
  ChevronLeft,
  ChevronRight,
  Layers
} from 'lucide-react';
import api from '../api/axios';

const EMPTY_FORM = {
  type: 'expense',
  amount: '',
  category_id: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
};

export default function Transactions() {
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  
  // Filter state initialized from URL search params if present
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    category_id: searchParams.get('category_id') || '',
    date_from: searchParams.get('date_from') || '',
    date_to: searchParams.get('date_to') || '',
    min_amount: '',
    max_amount: '',
  });

  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  // Load categories for selector
  useEffect(() => {
    api.get('/categories')
      .then((res) => setCategories(res.data.categories || []))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  // Fetch transactions with pagination and query filters
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([, v]) => v !== '')
      );
      const res = await api.get('/transactions', {
        params: { page, limit: 10, ...activeFilters },
      });
      setTransactions(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setPage(1); // Reset to page 1 on filter update
  };

  const handleClearFilters = () => {
    setFilters({
      type: '',
      category_id: '',
      date_from: '',
      date_to: '',
      min_amount: '',
      max_amount: '',
    });
    setPage(1);
  };

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (t) => {
    setForm({
      type: t.type,
      amount: t.amount,
      category_id: t.category_id || '',
      description: t.description || '',
      date: t.date ? t.date.split('T')[0] : '',
    });
    setEditId(t.id);
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (editId) {
        await api.put(`/transactions/${editId}`, form);
      } else {
        await api.post('/transactions', form);
      }
      setShowModal(false);
      fetchTransactions();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete transaction');
    }
  };

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={styles.container} className="animate-fade">
      {/* Page Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Transactions</h1>
          <p style={styles.subtitle}>
            Manage and track your income and expenses ({pagination.total} records)
          </p>
        </div>

        <button onClick={openAdd} style={styles.addBtn}>
          <Plus size={18} />
          <span>New Transaction</span>
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div style={styles.filterCard}>
        <div style={styles.filterTopRow}>
          {/* Type Toggle Pills */}
          <div style={styles.typePills}>
            {['', 'expense', 'income'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setFilters((prev) => ({ ...prev, type: t }));
                  setPage(1);
                }}
                style={{
                  ...styles.pillBtn,
                  ...(filters.type === t ? styles.pillBtnActive : {}),
                }}
              >
                {t === '' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Clear Filters Button */}
          {(filters.type || filters.category_id || filters.date_from || filters.date_to) && (
            <button onClick={handleClearFilters} style={styles.clearFiltersBtn}>
              <RotateCcw size={14} />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div style={styles.filterInputsGrid}>
          {/* Category Dropdown */}
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>Category</label>
            <div style={styles.selectWrapper}>
              <Tag size={15} color="#94a3b8" style={styles.selectIcon} />
              <select
                name="category_id"
                value={filters.category_id}
                onChange={handleFilterChange}
                style={styles.selectInput}
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date From */}
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>From Date</label>
            <div style={styles.selectWrapper}>
              <Calendar size={15} color="#94a3b8" style={styles.selectIcon} />
              <input
                type="date"
                name="date_from"
                value={filters.date_from}
                onChange={handleFilterChange}
                style={styles.dateInput}
              />
            </div>
          </div>

          {/* Date To */}
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>To Date</label>
            <div style={styles.selectWrapper}>
              <Calendar size={15} color="#94a3b8" style={styles.selectIcon} />
              <input
                type="date"
                name="date_to"
                value={filters.date_to}
                onChange={handleFilterChange}
                style={styles.dateInput}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.stateMessage}>Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div style={styles.emptyState}>
            <Layers size={42} color="#cbd5e1" />
            <p style={styles.emptyText}>No transactions match the selected filters.</p>
            <button onClick={openAdd} style={styles.emptyActionBtn}>
              <Plus size={16} />
              <span>Add Your First Transaction</span>
            </button>
          </div>
        ) : (
          <div style={styles.transactionsList}>
            {transactions.map((t) => {
              const isIncome = t.type === 'income';
              const formattedDate = new Date(t.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <div key={t.id} style={styles.transactionRow} className="animate-fade">
                  {/* Leading Icon */}
                  <div
                    style={{
                      ...styles.typeIndicator,
                      backgroundColor: isIncome ? '#ecfdf5' : '#fef2f2',
                      color: isIncome ? '#059669' : '#dc2626',
                    }}
                  >
                    {isIncome ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                  </div>

                  {/* Transaction Details */}
                  <div style={styles.transactionInfo}>
                    <div style={styles.transactionPrimary}>
                      <span style={styles.categoryBadge}>
                        {t.category?.name || 'Uncategorized'}
                      </span>
                      {t.description && (
                        <span style={styles.descText}>{t.description}</span>
                      )}
                    </div>
                    <div style={styles.transactionSecondary}>
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span style={styles.typeText}>{t.type}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div
                    style={{
                      ...styles.amountText,
                      color: isIncome ? '#059669' : '#dc2626',
                    }}
                  >
                    {isIncome ? '+' : '-'}{fmt(t.amount)}
                  </div>

                  {/* Action Buttons */}
                  <div style={styles.actionsGroup}>
                    <button
                      onClick={() => openEdit(t)}
                      style={styles.actionBtn}
                      title="Edit transaction"
                    >
                      <Edit3 size={15} color="#475569" />
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      style={{ ...styles.actionBtn, ...styles.deleteActionBtn }}
                      title="Delete transaction"
                    >
                      <Trash2 size={15} color="#dc2626" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Toolbar */}
        {pagination.totalPages > 1 && (
          <div style={styles.paginationRow}>
            <span style={styles.pageInfoText}>
              Showing page <strong>{pagination.page}</strong> of{' '}
              <strong>{pagination.totalPages}</strong> ({pagination.total} items)
            </span>
            <div style={styles.pageControls}>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                style={{
                  ...styles.pageBtn,
                  ...(page <= 1 ? styles.pageBtnDisabled : {}),
                }}
              >
                <ChevronLeft size={16} />
                <span>Previous</span>
              </button>
              <button
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  ...styles.pageBtn,
                  ...(!pagination.hasNextPage ? styles.pageBtnDisabled : {}),
                }}
              >
                <span>Next</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Transaction Modal */}
      {showModal && (
        <div style={styles.modalBackdrop} className="glass">
          <div style={styles.modalCard} className="animate-fade">
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editId ? 'Edit Transaction' : 'Record New Transaction'}
              </h3>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            {error && <div style={styles.modalError}>{error}</div>}

            <form onSubmit={handleSubmit} style={styles.modalForm}>
              {/* Type Switcher */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Type</label>
                <div style={styles.typeSwitcher}>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'expense', category_id: '' })}
                    style={{
                      ...styles.switchBtn,
                      ...(form.type === 'expense' ? styles.expenseActive : {}),
                    }}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'income', category_id: '' })}
                    style={{
                      ...styles.switchBtn,
                      ...(form.type === 'income' ? styles.incomeActive : {}),
                    }}
                  >
                    Income
                  </button>
                </div>
              </div>

              {/* Amount */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="amount"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  style={styles.modalInput}
                  required
                />
              </div>

              {/* Category */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Category</label>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  style={styles.modalInput}
                >
                  <option value="">Select Category...</option>
                  {categories
                    .filter((c) => c.type === form.type)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Date */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  style={styles.modalInput}
                  required
                />
              </div>

              {/* Description */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Description (Optional)</label>
                <input
                  type="text"
                  name="description"
                  placeholder="e.g. Grocery shopping, Freelance payment"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  style={styles.modalInput}
                />
              </div>

              {/* Buttons */}
              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={styles.saveBtn}
                >
                  {submitting ? 'Saving...' : editId ? 'Save Changes' : 'Record Transaction'}
                </button>
              </div>
            </form>
          </div>
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
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(79, 70, 229, 0.25)',
  },
  filterCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  filterTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  typePills: {
    display: 'flex',
    gap: '6px',
    backgroundColor: '#f1f5f9',
    padding: '4px',
    borderRadius: '10px',
  },
  pillBtn: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '7px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748b',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  pillBtnActive: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontWeight: '600',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  clearFiltersBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: '500',
  },
  filterInputsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  filterField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569',
  },
  selectWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  selectIcon: {
    position: 'absolute',
    left: '12px',
    pointerEvents: 'none',
  },
  selectInput: {
    width: '100%',
    padding: '9px 12px 9px 36px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  dateInput: {
    width: '100%',
    padding: '8px 12px 8px 36px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
    overflow: 'hidden',
  },
  transactionsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  transactionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.15s ease',
  },
  typeIndicator: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  transactionInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  transactionPrimary: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  categoryBadge: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
  },
  descText: {
    fontSize: '13px',
    color: '#64748b',
  },
  transactionSecondary: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#94a3b8',
  },
  typeText: {
    textTransform: 'capitalize',
  },
  amountText: {
    fontSize: '16px',
    fontWeight: '700',
    minWidth: '110px',
    textAlign: 'right',
  },
  actionsGroup: {
    display: 'flex',
    gap: '6px',
    marginLeft: '12px',
  },
  actionBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  deleteActionBtn: {
    borderColor: '#fecaca',
    backgroundColor: '#fff5f5',
  },
  paginationRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '12px',
  },
  pageInfoText: {
    fontSize: '13px',
    color: '#64748b',
  },
  pageControls: {
    display: 'flex',
    gap: '8px',
  },
  pageBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    padding: '6px 12px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#334155',
    cursor: 'pointer',
    fontWeight: '500',
  },
  pageBtnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  emptyState: {
    padding: '60px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '14px',
  },
  emptyActionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '6px',
  },
  stateMessage: {
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '20px',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '460px',
    padding: '28px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#0f172a',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  modalError: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  typeSwitcher: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    backgroundColor: '#f1f5f9',
    padding: '4px',
    borderRadius: '10px',
    gap: '4px',
  },
  switchBtn: {
    padding: '8px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    backgroundColor: 'transparent',
    color: '#64748b',
    cursor: 'pointer',
  },
  expenseActive: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)',
  },
  incomeActive: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
  },
  modalInput: {
    padding: '11px 14px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    color: '#0f172a',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    gap: '10px',
    marginTop: '10px',
  },
  cancelBtn: {
    flex: 1,
    padding: '11px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  saveBtn: {
    flex: 2,
    padding: '11px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
  },
};
