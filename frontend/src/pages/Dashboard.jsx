import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];

const fmt = (n, cur = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

export default function Dashboard() {
  const { user } = useAuth();

  const { data: wallets = [], isLoading: loadingWallets } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => api.get('/wallet').then(r => r.data),
  });

  const { data: txData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => api.get('/wallet/transactions?limit=5').then(r => r.data),
  });

  const { data: ratesData } = useQuery({
    queryKey: ['rates', 'USD'],
    queryFn: () => api.get('/exchange/rates?base=USD').then(r => r.data),
  });

  const totalUSD = wallets.reduce((sum, w) => {
    if (w.currency === 'USD') return sum + w.balance;
    const rate = ratesData?.rates?.find(r => r.currency === w.currency);
    if (!rate) return sum;
    return sum + w.balance / rate.rate;
  }, 0);

  const recentTx = txData?.transactions || [];

  const chartData = wallets.filter(w => w.balance > 0).map((w, i) => {
    let usdVal = w.balance;
    if (w.currency !== 'USD') {
      const rate = ratesData?.rates?.find(r => r.currency === w.currency);
      if (rate) usdVal = w.balance / rate.rate;
    }
    return { name: w.currency, value: usdVal, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.02em' }}>
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Here's your portfolio overview</p>
      </div>

      {/* Total balance card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(0,212,255,0.1), rgba(124,58,237,0.1))',
        border: '1px solid rgba(0,212,255,0.2)',
        borderRadius: 'var(--radius)', padding: '2rem', marginBottom: '1.5rem',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)' }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>TOTAL PORTFOLIO VALUE</div>
        {loadingWallets
          ? <div className="skeleton" style={{ height: 44, width: 200 }} />
          : <div style={{ fontFamily: 'Syne', fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>
              {fmt(totalUSD)}
            </div>
        }
        <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '0.5rem' }}>≈ USD equivalent across all wallets</div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Wallets */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem' }}>My Wallets</h3>
            <Link to="/wallet" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>Manage →</Link>
          </div>
          {loadingWallets
            ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }} />)
            : wallets.length === 0
              ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No wallets yet.</p>
              : wallets.map(w => (
                <div key={w.currency} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem',
                  background: 'var(--surface2)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Syne', fontWeight: 700, fontSize: '0.7rem'
                    }}>{w.currency.slice(0,2)}</div>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{w.currency}</span>
                  </div>
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent)' }}>
                    {w.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))
          }
        </div>

        {/* Chart */}
        <div className="card">
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem', marginBottom: '1rem' }}>Portfolio Breakdown</h3>
          {chartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                    {chartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [`$${v.toFixed(2)}`, 'USD Value']} contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                {chartData.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: d.color }} />
                    <span style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No balance data
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '1rem' }}>Recent Transactions</h3>
          <Link to="/transactions" style={{ fontSize: '0.8rem', color: 'var(--accent)', textDecoration: 'none' }}>View all →</Link>
        </div>
        {recentTx.length === 0
          ? <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No transactions yet. <Link to="/exchange" style={{ color: 'var(--accent)' }}>Make your first exchange →</Link></p>
          : recentTx.map(tx => (
            <div key={tx.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.875rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.5rem',
              background: 'var(--surface2)', flexWrap: 'wrap', gap: '0.5rem'
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {tx.from_currency} → {tx.to_currency}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(tx.created_at).toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--danger)' }}>-{tx.from_amount.toFixed(2)} {tx.from_currency}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--accent3)' }}>+{tx.to_amount.toFixed(2)} {tx.to_currency}</div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Quick actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
        {[
          { to: '/exchange', label: 'Exchange', icon: '⇄', desc: 'Convert currencies' },
          { to: '/wallet', label: 'Deposit', icon: '↓', desc: 'Add funds' },
          { to: '/rates', label: 'Live Rates', icon: '◎', desc: 'Check rates' },
        ].map(a => (
          <Link key={a.to} to={a.to} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s', padding: '1.25rem' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{a.icon}</div>
              <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem' }}>{a.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{a.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
