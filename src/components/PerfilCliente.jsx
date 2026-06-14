import { C } from '../lib/tokens'
import { BackBtn, Card, SLabel } from './UI'

export default function PerfilCliente({ client, onBack, showToast }) {
  if (!client) return null
  const initials = (client.nome || 'CL').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <div>
      <BackBtn label="Clientes" onClick={onBack} />
      <Card style={{ padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.gl, color: C.gd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.tp }}>{client.nome}</p>
          <p style={{ fontSize: 12, color: C.ts, marginTop: 2 }}>{client.email}</p>
          {client.telefone && <p style={{ fontSize: 11, color: C.tt, marginTop: 2 }}>📱 {client.telefone}</p>}
        </div>
      </Card>

      {/* Abas inline */}
      <div style={{ display: 'flex', gap: 4, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {[{ id: 'ficha', lbl: '📋 Ficha' }, { id: 'period', lbl: '📆 Period.' }, { id: 'medidas', lbl: '📏 Medidas' }].map(t => (
          <div key={t.id} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, textAlign: 'center', fontSize: 12, color: C.ts }}>{t.lbl}</div>
        ))}
      </div>

      <Card style={{ padding: 16 }}>
        <SLabel>Informações do cliente</SLabel>
        <p style={{ fontSize: 12, color: C.ts }}>As fichas, periodização e medidas serão carregadas do banco de dados assim que configurado.</p>
      </Card>
    </div>
  )
}
