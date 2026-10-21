import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, User, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
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

        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>Take control of your personal finances in minutes</p>

        {error && (
          <div style={styles.errorBanner} className="animate-slide">
            <AlertCircle size={18} color="#dc2626" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <div style={styles.inputWrapper}>
              <User size={18} color="#94a3b8" style={styles.inputIcon} />
              <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Jane Doe"
                style={styles.input}
                required
              />
            </div>
          </div>

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
                placeholder="At least 8 characters"
                style={styles.input}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Creating account...</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Already have an account?</span>{' '}
          <Link to="/login" style={styles.link}>
            Sign in
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
    background: 'radial-gradient(ellipse at top, #ecfdf5 0%, #f8fafc 100%)',
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
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
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
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '6px',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
  },
  footer: {
    marginTop: '28px',
    textAlign: 'center',
    fontSize: '14px',
    color: '#64748b',
  },
  link: {
    color: '#10b981',
    fontWeight: '600',
    textDecoration: 'none',
  },
};
