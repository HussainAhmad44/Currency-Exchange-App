import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/exchange', icon: '⇄', label: 'Exchange' },
  { to: '/wallet', icon: '◈', label: 'Wallet' },
  { to: '/transactions', icon: '≡', label: 'History' },
  { to: '/rates', icon: '◎', label: 'Live Rates' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        transform: menuOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s ease',
      }} className="sidebar">
        {/* Logo */}
        <div style={{ padding: '1.75rem 1.5rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', boxShadow: 'var(--glow)'
            }}>₿</div>
            <div>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>FXSwap</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>CURRENCY EXCHANGE</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} onClick={() => setMenuOpen(false)} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.7rem 0.875rem',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 500,
              color: isActive ? 'var(--accent)' : 'var(--text-muted)',
              background: isActive ? 'rgba(0,212,255,0.08)' : 'transparent',
              border: isActive ? '1px solid rgba(0,212,255,0.15)' : '1px solid transparent',
              transition: 'all 0.2s',
            })}>
              <span style={{ fontSize: '1.1rem', width: 20, textAlign: 'center' }}>{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Syne', fontWeight: 700, fontSize: '0.85rem',
            }}>{user?.name?.[0]?.toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem' }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99
        }} />
      )}

      {/* Main */}
      <div style={{ flex: 1, marginLeft: 240, minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="main-content">
        {/* Mobile topbar */}
        <div style={{
          display: 'none', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 50,
        }} className="mobile-topbar">
          <div style={{ fontFamily: 'Syne', fontWeight: 800 }}>FXSwap</div>
          <button onClick={() => setMenuOpen(!menuOpen)} style={{
            background: 'none', border: 'none', color: 'var(--text)', fontSize: '1.4rem', cursor: 'pointer'
          }}>☰</button>
        </div>

        <main style={{ flex: 1, padding: '2rem' }} className="page-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0) !important; }
          .main-content { margin-left: 0 !important; }
          .mobile-topbar { display: flex !important; }
          .page-content { padding: 1rem !important; }
        }
      `}</style>
    </div>
  );
}
