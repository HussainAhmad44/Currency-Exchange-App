import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setError(''); setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const f = (key) => ({ value: form[key], onChange: e => setForm({ ...form, [key]: e.target.value }) });

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', background: 'var(--bg)',
      backgroundImage: 'radial-gradient(ellipse at 80% 50%, rgba(0,212,255,0.06) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(124,58,237,0.06) 0%, transparent 60%)',
    }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', boxShadow: 'var(--glow)'
          }}>₿</div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.03em' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>Start with $1,000 USD welcome bonus</p>
        </div>

        <div className="card" style={{ boxShadow: 'var(--shadow)' }}>
          {error && (
            <div style={{
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem',
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', fontSize: '0.875rem'
            }}>{error}</div>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe' },
              { key: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
              { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 6 characters' },
              { key: 'confirm', label: 'Confirm Password', type: 'password', placeholder: 'Repeat password' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</label>
                <input className="input" type={type} placeholder={placeholder} required {...f(key)} />
              </div>
            ))}
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.875rem' }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18 }}></span> : 'Create Account'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
