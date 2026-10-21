import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight, 
  PlusCircle, 
  ArrowRight,
  PieChart as PieIcon,
  BarChart3
} from 'lucide-react';
import api from '../api/axios';

const PIE_COLORS = [
  '#6366f1', '#10b981', '#f59e0b', '#ef4444', 
  '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6', 
  '#f97316', '#84cc16'
];

function StatCard({ title, amount, icon: Icon, trend, color, bgLight, borderLight }) {
  return (
    <div style={{ ...styles.statCard, border: `1px solid ${borderLight}` }} className="animate-fade">
      <div style={styles.statHeader}>
        <span style={styles.statTitle}>{title}</span>
        <div style={{ ...styles.iconWrapper, backgroundColor: bgLight }}>
          <Icon size={20} color={color} />
        </div>
      </div>
      <div style={styles.statAmount}>{amount}</div>
      <div style={{ ...styles.trendBadge, color }}>
        {trend}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate((prev) => {
      if (prev.month === 1) return { year: prev.year - 1, month: 12 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => {
      if (prev.month === 12) return { year: prev.year + 1, month: 1 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/budgets/dashboard?year=${currentDate.year}&month=${currentDate.month}`),
      api.get(`/budgets?year=${currentDate.year}&month=${currentDate.month}`),
    ])
      .then(([dashRes, budgetRes]) => {
        setData(dashRes.data);
        setBudgets(budgetRes.data.budgets || []);
      })
      .catch((err) => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  }, [currentDate.year, currentDate.month]);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const overspentBudgets = budgets.filter((b) => b.isOverspent);

  return (
    <div style={styles.dashboardContainer} className="animate-fade">
      {/* Top Header & Month Selector */}
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.pageTitle}>Financial Overview</h1>
          <p style={styles.pageSubtitle}>Monitor your spending, budgets, and cash flow trends</p>
        </div>

        <div style={styles.controlsRow}>
          <div style={styles.monthSelector}>
            <button onClick={handlePrevMonth} style={styles.iconBtn} title="Previous Month">
              <ChevronLeft size={18} />
            </button>
            <span style={styles.monthLabel}>
              {monthNames[currentDate.month - 1]} {currentDate.year}
            </span>
            <button onClick={handleNextMonth} style={styles.iconBtn} title="Next Month">
              <ChevronRight size={18} />
            </button>
          </div>

          <Link to="/transactions" style={styles.quickAddBtn}>
            <PlusCircle size={17} />
            <span>Add Transaction</span>
          </Link>
        </div>
      </div>

      {/* Overspend Alert Notifications */}
      {overspentBudgets.length > 0 && (
        <div style={styles.alertBanner} className="animate-slide">
          <div style={styles.alertIconWrapper}>
            <AlertTriangle size={20} color="#b45309" />
          </div>
          <div style={styles.alertContent}>
            <div style={styles.alertTitle}>Budget Limit Exceeded!</div>
            <div style={styles.alertList}>
              {overspentBudgets.map((b) => (
                <span key={b.id} style={styles.alertBadge}>
                  <strong>{b.category?.name}:</strong> {fmt(b.spent)} of {fmt(b.amount)} (+{fmt(Math.abs(b.remaining))})
                </span>
              ))}
            </div>
          </div>
          <Link to="/budgets" style={styles.alertLink}>
            <span>Manage Budgets</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* 3 Summary KPI Cards */}
      <div style={styles.statsGrid}>
        <StatCard
          title="Total Income"
          amount={fmt(data?.totals?.income)}
          icon={TrendingUp}
          trend="Monthly Inflow"
          color="#10b981"
          bgLight="#ecfdf5"
          borderLight="#a7f3d0"
        />
        <StatCard
          title="Total Expenses"
          amount={fmt(data?.totals?.expense)}
          icon={TrendingDown}
          trend="Monthly Outflow"
          color="#ef4444"
          bgLight="#fef2f2"
          borderLight="#fecaca"
        />
        <StatCard
          title="Net Balance"
          amount={fmt(data?.totals?.balance)}
          icon={Wallet}
          trend={data?.totals?.balance >= 0 ? 'Surplus Reserve' : 'Deficit Warning'}
          color={data?.totals?.balance >= 0 ? '#4f46e5' : '#ef4444'}
          bgLight={data?.totals?.balance >= 0 ? '#eef2ff' : '#fef2f2'}
          borderLight={data?.totals?.balance >= 0 ? '#c7d2fe' : '#fecaca'}
        />
      </div>

      {/* Visual Analytics Row */}
      <div style={styles.chartsGrid}>
        {/* Category Breakdown (Donut/Pie Chart) */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div style={styles.chartTitleGroup}>
              <PieIcon size={18} color="#6366f1" />
              <h2 style={styles.chartHeading}>Expense by Category</h2>
            </div>
            <span style={styles.chartSubtitle}>Distribution of spending</span>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>Loading chart data...</div>
          ) : data?.pieData?.length > 0 ? (
            <div style={styles.chartBody}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={data.pieData}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                  >
                    {data.pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [fmt(value), 'Spent']}
                    contentStyle={styles.tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Category Badges */}
              <div style={styles.pieLegends}>
                {data.pieData.slice(0, 6).map((item, idx) => (
                  <div key={item.category_id || idx} style={styles.legendItem}>
                    <span 
                      style={{ 
                        ...styles.legendDot, 
                        backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] 
                      }} 
                    />
                    <span style={styles.legendName}>{item.category}</span>
                    <span style={styles.legendValue}>{fmt(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={styles.emptyChart}>
              <p>No expenses recorded for this month.</p>
              <Link to="/transactions" style={styles.emptyAction}>Log an expense</Link>
            </div>
          )}
        </div>

        {/* 6-Month Income vs Expense Trend Chart */}
        <div style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <div style={styles.chartTitleGroup}>
              <BarChart3 size={18} color="#6366f1" />
              <h2 style={styles.chartHeading}>Cash Flow Trend</h2>
            </div>
            <span style={styles.chartSubtitle}>Last 6 months comparison</span>
          </div>

          {loading ? (
            <div style={styles.loadingContainer}>Loading trend data...</div>
          ) : data?.trendData?.length > 0 ? (
            <div style={styles.chartBody}>
              <ResponsiveContainer width="100%" height={290}>
                <BarChart data={data.trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip 
                    formatter={(value) => [fmt(value)]}
                    contentStyle={styles.tooltipStyle}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '16px', fontSize: '13px' }}
                  />
                  <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={styles.emptyChart}>
              <p>Not enough transaction history to show trends.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  dashboardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.5px',
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginTop: '2px',
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
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
    transition: 'background 0.15s',
  },
  monthLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b',
    padding: '0 10px',
    minWidth: '130px',
    textAlign: 'center',
  },
  quickAddBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '9px 16px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    borderRadius: '10px',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: '600',
    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
  },
  alertBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: '14px',
    padding: '16px 20px',
    boxShadow: '0 2px 5px rgba(245, 158, 11, 0.08)',
  },
  alertIconWrapper: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#fef3c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#92400e',
    marginBottom: '4px',
  },
  alertList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  alertBadge: {
    fontSize: '12px',
    backgroundColor: '#ffffff',
    color: '#b45309',
    border: '1px solid #fde68a',
    borderRadius: '6px',
    padding: '3px 8px',
  },
  alertLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#b45309',
    fontSize: '13px',
    fontWeight: '700',
    textDecoration: 'none',
    flexShrink: 0,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  statTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  iconWrapper: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statAmount: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.5px',
    marginBottom: '4px',
  },
  trendBadge: {
    fontSize: '12px',
    fontWeight: '600',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))',
    gap: '24px',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)',
  },
  chartHeader: {
    marginBottom: '16px',
  },
  chartTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px',
  },
  chartHeading: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a',
  },
  chartSubtitle: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  chartBody: {
    display: 'flex',
    flexDirection: 'column',
  },
  pieLegends: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px 16px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  legendName: {
    color: '#475569',
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  legendValue: {
    fontWeight: '600',
    color: '#0f172a',
  },
  loadingContainer: {
    height: '240px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    fontSize: '14px',
  },
  emptyChart: {
    height: '240px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#94a3b8',
    gap: '8px',
    fontSize: '14px',
  },
  emptyAction: {
    color: '#4f46e5',
    fontWeight: '600',
    textDecoration: 'none',
    fontSize: '13px',
  },
  tooltipStyle: {
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    fontSize: '12px',
  },
};
