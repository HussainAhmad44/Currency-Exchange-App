import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';

const CURRENCY_FLAGS = { USD:'🇺🇸',EUR:'🇪🇺',GBP:'🇬🇧',JPY:'🇯🇵',CAD:'🇨🇦',AUD:'🇦🇺',CHF:'🇨🇭',CNY:'🇨🇳',INR:'🇮🇳',PKR:'🇵🇰',AED:'🇦🇪',SAR:'🇸🇦',MXN:'🇲🇽',BRL:'🇧🇷',KRW:'🇰🇷' };
const CURRENCY_NAMES = { USD:'US Dollar',EUR:'Euro',GBP:'British Pound',JPY:'Japanese Yen',CAD:'Canadian Dollar',AUD:'Australian Dollar',CHF:'Swiss Franc',CNY:'Chinese Yuan',INR:'Indian Rupee',PKR:'Pakistani Rupee',AED:'UAE Dirham',SAR:'Saudi Riyal',MXN:'Mexican Peso',BRL:'Brazilian Real',KRW:'South Korean Won' };

export default function Rates() {
  const qc = useQueryClient();
  const [base, setBase] = useState('USD');
  const [search, setSearch] = useState('');
  const [addMsg, setAddMsg] = useState('');

  const { data: ratesData, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['rates', base],
    queryFn: () => api.get(`/exchange/rates?base=${base}`).then(r => r.data),
    refetchInterval: 30000,
  });

  const { data: currencies = [] } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => api.get('/exchange/currencies').then(r => r.data),
  });

  const watchMutation = useMutation({
    mutationFn: ({ base: b, target: t }) => api.post('/wallet/watchlist', { base: b, target: t }),
    onSuccess: () => { setAddMsg('Added to watchlist!'); qc.invalidateQueries(['watchlist']); setTimeout(() => setAddMsg(''), 2000); },
    onError: () => { setAddMsg('Already in watchlist'); setTimeout(() => setAddMsg(''), 2000); },
  });

  const rates = ratesData?.rates || [];
  const filtered = rates.filter(r =>
    r.currency.toLowerCase().includes(search.toLowerCase()) ||
    (CURRENCY_NAMES[r.currency] || '').toLowerCase().includes(search.toLowerCase())
  );

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—';

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.02em' }}>Live Rates</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Last updated: <span style={{ color: 'var(--accent)' }}>{lastUpdated}</span>
            <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>(auto-refresh every 30s)</span>
          </p>
        </div>
        {addMsg && (
          <div className="badge badge-green" style={{ padding: '0.4rem 0.875rem', fontSize: '0.85rem' }}>{addMsg}</div>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '0 0 auto' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Base Currency</label>
          <select className="input" value={base} onChange={e => setBase(e.target.value)}
            style={{ width: 140, cursor: 'pointer', fontWeight: 600 }}>
            {currencies.map(c => <option key={c.code} value={c.code}>{CURRENCY_FLAGS[c.code] || '🌐'} {c.code}</option>)}
          </select>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Search</label>
          <input className="input" placeholder="Filter currencies..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Rates grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {isLoading
          ? [1,2,3,4,5,6,7,8].map(i => <div key={i} className="skeleton" style={{ height: 110 }} />)
          : filtered.map(r => (
            <div key={r.currency} className="card"
              style={{ position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '3rem', opacity: 0.06 }}>
                {CURRENCY_FLAGS[r.currency] || '🌐'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.25rem' }}>{CURRENCY_FLAGS[r.currency] || '🌐'}</span>
                  <div>
                    <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: '0.95rem' }}>{r.currency}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{CURRENCY_NAMES[r.currency] || ''}</div>
                  </div>
                </div>
                <button
                  title="Add to watchlist"
                  onClick={() => watchMutation.mutate({ base, target: r.currency })}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)', fontSize: '0.9rem', padding: '0.2rem', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-dim)'}
                >★</button>
              </div>

              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent)' }}>
                {r.rate >= 1000
                  ? r.rate.toFixed(1)
                  : r.rate >= 10
                    ? r.rate.toFixed(3)
                    : r.rate.toFixed(5)
                }
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                1 {base} = {r.rate.toFixed(4)} {r.currency}
              </div>
            </div>
          ))
        }
      </div>

      {!isLoading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          No currencies match your search.
        </div>
      )}
    </div>
  );
}
