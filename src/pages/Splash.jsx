import { useNavigate } from 'react-router-dom'
import { C } from '../lib/tokens'

export default function Splash() {
  const nav = useNavigate()
  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(160deg, ${C.gd} 0%, ${C.green} 55%, #2DD4B0 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'space-between', padding: '60px 28px 48px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 88, height: 88, borderRadius: 26,
          background: 'rgba(255,255,255,.15)', backdropFilter: 'blur(10px)',
          border: '2px solid rgba(255,255,255,.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 44, margin: '0 auto 22px',
        }}>💪</div>
        <p style={{ fontSize: 34, fontWeight: 800, color: '#fff', letterSpacing: -1, marginBottom: 8 }}>VirtusManager</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', lineHeight: 1.6, maxWidth: 280 }}>
          Plataforma completa para Personal Trainers e seus clientes
        </p>
      </div>

      {/* Features */}
      <div style={{ width: '100%', margin: '40px 0' }}>
        {[
          { icon: '📅', text: 'Agenda integrada com Google e Outlook Calendar' },
          { icon: '📋', text: 'Fichas de treino, periodização Macro/Meso/Micro' },
          { icon: '📏', text: 'Medidas corporais, 7 dobras e evolução fotográfica' },
        ].map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13,
              background: 'rgba(255,255,255,.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>{f.icon}</div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,.88)', lineHeight: 1.5 }}>{f.text}</p>
          </div>
        ))}
      </div>

      {/* Botões */}
      <div style={{ width: '100%' }}>
        <button
          onClick={() => nav('/login')}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 14, border: 'none',
            background: '#fff', color: C.gd, fontSize: 16, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', marginBottom: 12,
            boxShadow: '0 4px 24px rgba(0,0,0,.15)',
          }}>
          Entrar
        </button>
        <button
          onClick={() => nav('/register')}
          style={{
            width: '100%', padding: '16px 0', borderRadius: 14,
            border: '2px solid rgba(255,255,255,.5)',
            background: 'transparent', color: '#fff',
            fontSize: 16, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
          Criar conta — Sou Personal Trainer
        </button>
        <p style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 20 }}>
          Clientes acessam via link enviado pelo personal
        </p>
      </div>
    </div>
  )
}
