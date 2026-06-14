import { C, AV } from '../lib/tokens'

export function Avatar({ initials, color = 'teal', size = 36 }) {
  const cv = AV[color] || AV.teal
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: cv.bg, color: cv.c,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.32, fontWeight: 700, flexShrink: 0,
    }}>
      {initials}
    </div>
  )
}

export function Badge({ label, type = 'green' }) {
  const m = {
    green: { bg: '#E1F5EE', c: '#0F6E56' },
    gray:  { bg: '#F0EEE8', c: '#6B6860' },
    amber: { bg: '#FAEEDA', c: '#854F0B' },
    red:   { bg: '#FCEBEB', c: '#A32D2D' },
    blue:  { bg: '#E6F1FB', c: '#185FA5' },
    purple:{ bg: '#EEEDFE', c: '#3C3489' },
  }
  const s = m[type] || m.green
  return (
    <span style={{ fontSize: 10, padding: '2px 9px', borderRadius: 20, background: s.bg, color: s.c, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

export function Toast({ msg, visible }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: C.green, color: '#fff', fontSize: 13, padding: '10px 20px',
      borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: '0 4px 20px rgba(29,158,117,.35)',
      opacity: visible ? 1 : 0, transition: 'opacity .3s',
      pointerEvents: 'none', zIndex: 200, whiteSpace: 'nowrap',
    }}>
      ✓ {msg}
    </div>
  )
}

export function BackBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'none', border: 'none', color: C.green,
      fontSize: 14, fontWeight: 600, cursor: 'pointer',
      padding: '0 0 14px', fontFamily: 'inherit',
    }}>
      ← {label}
    </button>
  )
}

export function Card({ children, style = {} }) {
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, background: '#fff', ...style }}>
      {children}
    </div>
  )
}

export function SLabel({ children }) {
  return <p style={{ fontSize: 10, fontWeight: 700, color: C.ts, textTransform: 'uppercase', letterSpacing: .6, marginBottom: 8 }}>{children}</p>
}

export function FLabel({ children, required }) {
  return (
    <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 5 }}>
      {children}{required && <span style={{ color: C.red }}> *</span>}
    </label>
  )
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{
        width: 36, height: 36, border: `3px solid ${C.border}`,
        borderTop: `3px solid ${C.green}`, borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }}/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

export function Btn({ children, onClick, variant = 'primary', fullWidth, style = {}, disabled, type = 'button' }) {
  const base = {
    padding: '13px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit', border: 'none',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    transition: 'all .15s', width: fullWidth ? '100%' : undefined,
    ...style,
  }
  const variants = {
    primary: { background: C.green, color: '#fff', boxShadow: '0 2px 10px rgba(29,158,117,.25)' },
    secondary: { background: '#fff', color: C.tp, border: `1px solid ${C.border}` },
    ghost: { background: C.gl, color: C.gd },
    danger: { background: '#FCEBEB', color: C.red },
  }
  return (
    <button onClick={onClick} disabled={disabled} type={type} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  )
}
