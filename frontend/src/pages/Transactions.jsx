import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';

const CURRENCY_FLAGS = { USD:'🇺🇸',EUR:'🇪🇺',GBP:'🇬🇧',JPY:'🇯🇵',CAD:'🇨🇦',AUD:'🇦🇺',CHF:'🇨🇭',CNY:'🇨🇳',INR:'🇮🇳',PKR:'🇵🇰',AED:'🇦🇪',SAR:'🇸🇦',MXN:'🇲🇽',BRL:'🇧🇷',KRW:'🇰🇷' };

export default function Transactions() {
  const [page, setPage] = useState(1);
  const LIMIT = 15;

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', page],
    queryFn: () => api.get(`/wallet/transactions?page=${page}&limit=${LIMIT}`).then(r => r.data),
  });

  const transactions = data?.transactions || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.02em' }}>Transaction History</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>All your exchange activity</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>TOTAL EXCHANGES</div>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.5rem', color: 'var(--accent)' }}>{total}</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>THIS PAGE</div>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1.5rem' }}>{transactions.length}</div>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr',
          padding: '0.875rem 1.25rem', borderBottom: '1px solid var(--border)',
          fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em'
        }} className="tx-header">
          <span>PAIR</span><span>SENT</span><span>RECEIVED</span><span>FEE</span><span>DATE</span>
        </div>

        {isLoading
          ? [1,2,3,4,5].map(i => (
            <div key={i} style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <div className="skeleton" style={{ height: 20, width: '80%' }} />
            </div>
          ))
          : transactions.length === 0
            ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>≡</div>
                <p style={{ color: 'var(--text-muted)' }}>No transactions yet.</p>
              </div>
            )
            : transactions.map((tx, i) => (
              <div key={tx.id} style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1.5fr',
                padding: '1rem 1.25rem',
                borderBottom: i < transactions.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
                transition: 'background 0.15s',
              }}
                className="tx-row"
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0
                  }}>⇄</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {CURRENCY_FLAGS[tx.from_currency] || ''} {tx.from_currency} → {CURRENCY_FLAGS[tx.to_currency] || ''} {tx.to_currency}
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {tx.id.slice(0, 12)}...
                    </div>
                  </div>
                </div>
                <div style={{ color: 'var(--danger)', fontFamily: 'Syne', fontWeight: 600, fontSize: '0.875rem' }}>
                  -{tx.from_amount.toFixed(2)}
                </div>
                <div style={{ color: 'var(--accent3)', fontFamily: 'Syne', fontWeight: 600, fontSize: '0.875rem' }}>
                  +{tx.to_amount.toFixed(2)}
                </div>
                <div style={{ color: 'var(--warning)', fontSize: '0.8rem' }}>
                  {tx.fee.toFixed(4)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {new Date(tx.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))
        }
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', padding: '0 0.5rem' }}>Page {page} of {totalPages}</span>
          <button className="btn btn-secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .tx-header { display: none !important; }
          .tx-row { grid-template-columns: 1fr 1fr !important; gap: 0.5rem; }
        }
      `}</style>
    </div>
  );
}
