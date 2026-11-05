import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

const CURRENCY_FLAGS = { USD:'🇺🇸',EUR:'🇪🇺',GBP:'🇬🇧',JPY:'🇯🇵',CAD:'🇨🇦',AUD:'🇦🇺',CHF:'🇨🇭',CNY:'🇨🇳',INR:'🇮🇳',PKR:'🇵🇰',AED:'🇦🇪',SAR:'🇸🇦',MXN:'🇲🇽',BRL:'🇧🇷',KRW:'🇰🇷' };

export default function Exchange() {
  const qc = useQueryClient();
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [amount, setAmount] = useState('');
  const [preview, setPreview] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => api.get('/exchange/currencies').then(r => r.data),
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallets'],
    queryFn: () => api.get('/wallet').then(r => r.data),
  });

  const { data: rateData } = useQuery({
    queryKey: ['rate', from, to],
    queryFn: () => api.get(`/exchange/rate/${from}/${to}`).then(r => r.data),
    enabled: !!from && !!to && from !== to,
    refetchInterval: 30000,
  });

  useEffect(() => { setPreview(null); setSuccess(null); setError(''); }, [from, to, amount]);

  const previewMutation = useMutation({
    mutationFn: () => api.post('/exchange/convert', { from, to, amount: Number(amount) }).then(r => r.data),
    onSuccess: (data) => { setPreview(data); setError(''); },
    onError: (err) => setError(err.response?.data?.error || 'Failed to get quote'),
  });

  const executeMutation = useMutation({
    mutationFn: () => api.post('/exchange/execute', { from, to, amount: Number(amount) }).then(r => r.data),
    onSuccess: (data) => {
      setSuccess(data);
      setPreview(null);
      setAmount('');
      qc.invalidateQueries(['wallets']);
      qc.invalidateQueries(['transactions']);
    },
    onError: (err) => setError(err.response?.data?.error || 'Exchange failed'),
  });

  const swap = () => { setFrom(to); setTo(from); setPreview(null); };
  const fromWallet = wallets.find(w => w.currency === from);

  const CurrencySelect = ({ value, onChange, label }) => (
    <div style={{ flex: 1 }}>
      <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</label>
      <select className="input" value={value} onChange={e => onChange(e.target.value)}
        style={{ appearance: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
        {currencies.map(c => (
          <option key={c.code} value={c.code}>
            {CURRENCY_FLAGS[c.code] || '🌐'} {c.code}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.02em' }}>Currency Exchange</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>Convert between currencies instantly</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Exchange form */}
        <div>
          <div className="card">
            {/* Rate ticker */}
            {rateData && (
              <div style={{
                padding: '0.6rem 0.875rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem',
                background: 'rgba(0,212,255,0.06)', border: '1px solid rgba(0,212,255,0.15)',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Live Rate</span>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent)', fontSize: '0.95rem' }}>
                  1 {from} = {rateData.rate?.toFixed(4)} {to}
                </span>
              </div>
            )}

            {/* Currency selectors */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginBottom: '1.25rem' }}>
              <CurrencySelect value={from} onChange={setFrom} label="From" />
              <button onClick={swap} className="btn btn-secondary" style={{ padding: '0.75rem', minWidth: 44, marginBottom: 0, fontSize: '1.1rem' }}>⇄</button>
              <CurrencySelect value={to} onChange={setTo} label="To" />
            </div>

            {/* Amount */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Amount ({from})</label>
                {fromWallet && (
                  <button onClick={() => setAmount(fromWallet.balance.toString())}
                    style={{ fontSize: '0.75rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Max: {fromWallet.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </button>
                )}
              </div>
              <input className="input" type="number" min="0" step="any" placeholder="0.00"
                value={amount} onChange={e => setAmount(e.target.value)}
                style={{ fontSize: '1.25rem', fontFamily: 'Syne', fontWeight: 700 }} />
            </div>

            {error && (
              <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-secondary"
              style={{ width: '100%', marginBottom: '0.75rem' }}
              onClick={() => previewMutation.mutate()}
              disabled={!amount || Number(amount) <= 0 || previewMutation.isPending}
            >
              {previewMutation.isPending ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Getting quote...</> : 'Get Quote'}
            </button>

            <button
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.875rem' }}
              onClick={() => executeMutation.mutate()}
              disabled={!amount || Number(amount) <= 0 || executeMutation.isPending}
            >
              {executeMutation.isPending ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Processing...</> : `Exchange ${from} → ${to}`}
            </button>

            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '0.75rem' }}>
              0.5% fee applies • Rates update every 30s
            </p>
          </div>
        </div>

        {/* Preview / Result */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {success && (
            <div style={{
              padding: '1.5rem', borderRadius: 'var(--radius)',
              background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
                <span style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--accent3)' }}>Exchange Successful!</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Row label="You received" value={`+${success.converted?.toFixed(4)} ${to}`} color="var(--accent3)" />
                <Row label="Fee paid" value={`${success.fee?.toFixed(4)} ${from}`} color="var(--text-muted)" />
                <Row label="Transaction ID" value={success.transactionId?.slice(0, 8) + '...'} color="var(--text-muted)" />
              </div>
              <button onClick={() => setSuccess(null)} className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.85rem' }}>
                New Exchange
              </button>
            </div>
          )}

          {preview && !success && (
            <div className="card">
              <h3 style={{ fontFamily: 'Syne', fontWeight: 700, marginBottom: '1rem' }}>Quote Preview</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <Row label="You send" value={`${preview.amount?.toFixed(4)} ${from}`} />
                <Row label="Exchange rate" value={`${preview.rate?.toFixed(6)}`} />
                <Row label="Fee (0.5%)" value={`${preview.fee?.toFixed(4)} ${from}`} color="var(--warning)" />
                <div style={{ height: 1, background: 'var(--border)', margin: '0.25rem 0' }} />
                <Row label="You receive" value={`${preview.converted?.toFixed(4)} ${to}`} color="var(--accent)" big />
              </div>
            </div>
          )}

          {/* Wallet balances */}
          <div className="card">
            <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem', marginBottom: '1rem' }}>Your Balances</h3>
            {wallets.length === 0
              ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No wallets yet.</p>
              : wallets.map(w => (
                <div key={w.currency} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.6rem 0', borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {CURRENCY_FLAGS[w.currency] || '🌐'} {w.currency}
                  </span>
                  <span style={{
                    fontFamily: 'Syne', fontWeight: 700, fontSize: '0.9rem',
                    color: w.currency === from ? 'var(--accent)' : 'var(--text)'
                  }}>
                    {w.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color, big }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontFamily: 'Syne', fontWeight: big ? 800 : 600, fontSize: big ? '1.1rem' : '0.9rem', color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
}
