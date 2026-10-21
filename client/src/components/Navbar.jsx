import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PiggyBank, 
  LogOut, 
  Wallet,
  User as UserIcon
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Budgets', path: '/budgets', icon: PiggyBank },
  ];

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* Brand Logo */}
        <Link to="/dashboard" style={styles.brand}>
          <div style={styles.logoIcon}>
            <Wallet size={20} color="#ffffff" />
          </div>
          <span style={styles.brandText}>FinTrack</span>
        </Link>

        {/* Navigation Tabs */}
        <nav style={styles.navLinks}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.link,
                  ...(isActive ? styles.activeLink : {}),
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Profile & Logout */}
        <div style={styles.userSection}>
          <div style={styles.avatar}>
            <UserIcon size={16} color="#4f46e5" />
          </div>
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.name || 'User'}</span>
            <span style={styles.userEmail}>{user?.email}</span>
          </div>
          <button 
            onClick={handleLogout} 
            style={styles.logoutBtn}
            title="Sign out"
          >
            <LogOut size={16} />
            <span style={styles.logoutText}>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 40,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 24px',
    height: '68px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
  },
  logoIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
  },
  brandText: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.5px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: '#f8fafc',
    padding: '4px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '9px',
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.15s ease',
  },
  activeLink: {
    backgroundColor: '#ffffff',
    color: '#4f46e5',
    fontWeight: '600',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #c7d2fe',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: '1.2',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b',
  },
  userEmail: {
    fontSize: '11px',
    color: '#94a3b8',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '7px 12px',
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  logoutText: {
    display: 'inline',
  },
};
