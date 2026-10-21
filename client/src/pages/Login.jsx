import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card} className="animate-fade">
        <div style={styles.brandRow}>
          <div style={styles.logoBadge}>
            <Wallet size={24} color="#ffffff" />
          </div>
          <span style={styles.brandName}>FinTrack</span>
        </div>

        <h1 style={styles.title}>Welcome back</h1>
        <p style={styles.subtitle}>Enter your credentials to access your financial dashboard</p>

        {error && (
          <div style={styles.errorBanner} className="animate-slide">
            <AlertCircle size={18} color="#dc2626" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} color="#94a3b8" style={styles.inputIcon} />
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="name@example.com"
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                style={styles.input}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Don't have an account?</span>{' '}
          <Link to="/register" style={styles.link}>
            Create one free
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(ellipse at top, #eef2ff 0%, #f8fafc 100%)',
    padding: '24px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '440px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)',
    border: '1px solid #e2e8f0',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '28px',
  },
  logoBadge: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
  },
  brandName: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.5px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    marginBottom: '28px',
  },
  errorBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    padding: '12px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    marginBottom: '20px',
    border: '1px solid #fecaca',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 14px 12px 42px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  submitBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '6px',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
    transition: 'transform 0.15s ease',
  },
  footer: {
    marginTop: '28px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#64748b',
  },
  link: {
    color: '#4f46e5',
    fontWeight: '600',
    textDecoration: 'none',
  },
};
