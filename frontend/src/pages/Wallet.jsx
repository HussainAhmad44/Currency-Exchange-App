import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

const CURRENCY_FLAGS = { USD:'🇺🇸',EUR:'🇪🇺',GBP:'🇬🇧',JPY:'🇯🇵',CAD:'🇨🇦',AUD:'🇦🇺',CHF:'🇨🇭',CNY:'🇨🇳',INR:'🇮🇳',PKR:'🇵🇰',AED:'🇦🇪',SAR:'🇸🇦',MXN:'🇲🇽',BRL:'🇧🇷',KRW:'🇰🇷' };
const CURRENCY_NAMES = { USD:'US Dollar',EUR:'Euro',GBP:'British Pound',JPY:'Japanese Yen',CAD:'Canadian Dollar',AUD:'Australian Dollar',CHF:'Swiss Franc',CNY:'Chinese Yuan',INR:'Indian Rupee',PKR:'Pakistani Rupee',AED:'UAE Dirham',SAR:'Saudi Riyal',MXN:'Mexican Peso',BRL:'Brazilian Real',KRW:'South Korean Won' };

export default function Wallet() {
  const qc = useQueryClient();
  const [depositCur, setDepositCur] = useState('');
  const [depositAmt, setDepositAmt] = useState('');
  const [addCur, setAddCur] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('wallets');

  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => api.get('/wallet').then(r => r.data),
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => api.get('/exchange/currencies').then(r => r.data),
  });

  const { data: watchlist = [] } = useQuery({
    queryKey: ['watchlist'],
    queryFn: () => api.get('/wallet/watchlist').then(r => r.data),
  });

  const depositMutation = useMutation({
    mutationFn: () => api.post('/wallet/deposit', { currency: depositCur, amount: Number(depositAmt) }).then(r => r.data),
    onSuccess: () => {
      setMsg({ type: 'success', text: `Deposited ${depositAmt} ${depositCur} successfully!` });
      setDepositAmt(''); setDepositCur('');
      qc.invalidateQueries(['wallets']);
    },
    onError: (err) => setMsg({ type: 'error', text: err.response?.data?.error || 'Deposit failed' }),
  });

  const addWalletMutation = useMutation({
    mutationFn: () => api.post('/wallet', { currency: addCur }).then(r => r.data),
    onSuccess: () => {
      setMsg({ type: 'success', text: `${addCur} wallet created!` });
      setAddCur('');
      qc.invalidateQueries(['wallets']);
    },
    onError: (err) => setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to create wallet' }),
  });

  const removeWatchMutation = useMutation({
    mutationFn: (id) => api.delete(`/wallet/watchlist/${id}`),
    onSuccess: () => qc.invalidateQueries(['watchlist']),
  });

  const existingCodes = wallets.map(w => w.currency);
  const availableCurrencies = currencies.filter(c => !existingCodes.includes(c.code));

  const Tab = ({ id, label }) => (
    <button onClick={() => setActiveTab(id)} className={`btn ${activeTab === id ? 'btn-primary' : 'btn-ghost'}`}
      style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
      {label}
    </button>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.02em' }}>Wallet</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Manage your currency wallets</p>
      </div>

      {msg.text && (
        <div style={{
          padding: '0.875rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem',
          background: msg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: msg.type === 'success' ? 'var(--accent3)' : 'var(--danger)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          {msg.text}
          <button onClick={() => setMsg({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: '1.1rem' }}>×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <Tab id="wallets" label="My Wallets" />
        <Tab id="deposit" label="Deposit" />
        <Tab id="add" label="Add Currency" />
        <Tab id="watchlist" label="Watchlist" />
      </div>

      {/* Wallets tab */}
      {activeTab === 'wallets' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
          {isLoading
            ? [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120 }} />)
            : wallets.map(w => (
              <div key={w.currency} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.75rem' }}>{CURRENCY_FLAGS[w.currency] || '🌐'}</span>
                  <div>
                    <div style={{ fontFamily: 'Syne', fontWeight: 700 }}>{w.currency}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{CURRENCY_NAMES[w.currency] || 'Currency'}</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.4rem', color: 'var(--accent)' }}>
                  {w.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
            ))
          }
        </div>
      )}

      {/* Deposit tab */}
      {activeTab === 'deposit' && (
        <div className="card" style={{ maxWidth: 440 }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '1.25rem' }}>Deposit Funds</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Currency</label>
              <select className="input" value={depositCur} onChange={e => setDepositCur(e.target.value)}>
                <option value="">Select currency</option>
                {wallets.map(w => <option key={w.currency} value={w.currency}>{CURRENCY_FLAGS[w.currency]} {w.currency}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Amount</label>
              <input className="input" type="number" min="0" step="any" placeholder="0.00"
                value={depositAmt} onChange={e => setDepositAmt(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[100, 500, 1000, 5000].map(n => (
                <button key={n} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                  onClick={() => setDepositAmt(n.toString())}>+{n}</button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={() => depositMutation.mutate()}
              disabled={!depositCur || !depositAmt || depositMutation.isPending} style={{ padding: '0.875rem' }}>
              {depositMutation.isPending ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Processing...</> : 'Deposit'}
            </button>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.75rem' }}>* This is a simulation — no real money involved.</p>
        </div>
      )}

      {/* Add wallet tab */}
      {activeTab === 'add' && (
        <div className="card" style={{ maxWidth: 440 }}>
          <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '1.25rem' }}>Add Currency Wallet</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Currency</label>
              <select className="input" value={addCur} onChange={e => setAddCur(e.target.value)}>
                <option value="">Choose currency</option>
                {availableCurrencies.map(c => <option key={c.code} value={c.code}>{CURRENCY_FLAGS[c.code] || '🌐'} {c.code} — {CURRENCY_NAMES[c.code] || c.code}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={() => addWalletMutation.mutate()}
              disabled={!addCur || addWalletMutation.isPending} style={{ padding: '0.875rem' }}>
              {addWalletMutation.isPending ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Creating...</> : 'Create Wallet'}
            </button>
          </div>
        </div>
      )}

      {/* Watchlist tab */}
      {activeTab === 'watchlist' && (
        <div>
          {watchlist.length === 0
            ? (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>◎</div>
                <p style={{ color: 'var(--text-muted)' }}>No pairs in watchlist yet.</p>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Add pairs from the Live Rates page.</p>
              </div>
            )
            : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                {watchlist.map(w => (
                  <div key={w.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'Syne', fontWeight: 700 }}>{w.base_currency}/{w.target_currency}</div>
                      <div style={{ color: 'var(--accent)', fontFamily: 'Syne', fontWeight: 800, fontSize: '1.1rem', marginTop: '0.25rem' }}>
                        {w.rate?.toFixed(4)}
                      </div>
                    </div>
                    <button className="btn btn-danger" style={{ padding: '0.4rem 0.7rem', fontSize: '0.8rem' }}
                      onClick={() => removeWatchMutation.mutate(w.id)}>Remove</button>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}
