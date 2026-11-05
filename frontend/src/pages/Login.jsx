import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const fillDemo = () => setForm({ email: 'demo@example.com', password: 'demo1234' });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 20% 50%, rgba(0,212,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.06) 0%, transparent 60%)',
    }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', boxShadow: 'var(--glow)'
          }}>₿</div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.03em' }}>FXSwap</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Sign in to your account</p>
        </div>

        <div className="card" style={{ boxShadow: 'var(--shadow)' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)',
              fontSize: '0.875rem'
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.875rem' }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }}></span> : 'Sign In'}
            </button>
          </form>

          <button onClick={fillDemo} className="btn btn-secondary" style={{ width: '100%', marginTop: '0.75rem', fontSize: '0.85rem' }}>
            Use Demo Account
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            No account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
