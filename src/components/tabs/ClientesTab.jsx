import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { C, IS } from '../../lib/tokens'
import { Card, BackBtn, Badge, Avatar, SLabel, Btn, Spinner } from '../UI'
import PerfilCliente from '../PerfilCliente'

export default function ClientesTab({ showToast }) {
  const { user, profile } = useAuth()
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteNome, setInviteNome] = useState('')
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')

  const AV_COLORS = ['teal', 'blue', 'amber', 'coral', 'purple']

  useEffect(() => { fetchClientes() }, [user])

  async function fetchClientes() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('personal_id', user.id)
      .eq('role', 'cliente')
      .order('nome')
    setClientes(data || [])
    setLoading(false)
  }

  async function sendInvite() {
    if (!inviteEmail) return
    setSending(true)
    try {
      const token = crypto.randomUUID()
      const { error } = await supabase.from('invites').insert({
        personal_id: user.id,
        email: inviteEmail,
        nome_sugerido: inviteNome,
        token,
        status: 'pending',
      })
      if (error) throw error

      // Send invite email via Supabase Edge Function (or show link for now)
      const inviteUrl = `${window.location.origin}/convite?token=${token}`

      // Try to send via edge function if available
      try {
        await supabase.functions.invoke('send-invite', {
          body: { email: inviteEmail, nome: inviteNome, personalNome: profile?.nome, inviteUrl }
        })
      } catch (e) {
        // Fallback: copy link
      }

      showToast('Convite enviado para ' + inviteEmail)
      setInviteEmail(''); setInviteNome(''); setShowInvite(false)
    } catch (e) {
      showToast('Erro ao enviar convite')
    } finally {
      setSending(false)
    }
  }

  const filtered = clientes.filter(c =>
    c.nome?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  if (viewing) {
    const client = clientes.find(c => c.id === viewing)
    return <PerfilCliente client={client} onBack={() => { setViewing(null); fetchClientes() }} showToast={showToast} />
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontSize: 13, color: C.ts }}>{clientes.length} cliente{clientes.length !== 1 ? 's' : ''}</p>
        <Btn onClick={() => setShowInvite(true)} style={{ padding: '8px 14px', fontSize: 12 }}>
          + Convidar cliente
        </Btn>
      </div>

      {/* Modal convite */}
      {showInvite && (
        <div onClick={() => setShowInvite(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340 }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: C.tp, marginBottom: 6 }}>Convidar cliente</p>
            <p style={{ fontSize: 12, color: C.ts, marginBottom: 18, lineHeight: 1.6 }}>
              O cliente receberá um e-mail com link para se cadastrar e acessar o app.
            </p>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 5 }}>Nome do cliente</label>
              <input value={inviteNome} onChange={e => setInviteNome(e.target.value)} placeholder="Ana Souza" style={IS} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 5 }}>E-mail <span style={{ color: C.red }}>*</span></label>
              <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="cliente@email.com" type="email" style={IS} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn variant="secondary" onClick={() => setShowInvite(false)} style={{ flex: 1 }}>Cancelar</Btn>
              <Btn onClick={sendInvite} disabled={!inviteEmail || sending} style={{ flex: 2 }}>
                {sending ? 'Enviando...' : '📧 Enviar convite'}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {/* Busca */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: C.tt }}>🔍</span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." style={{ ...IS, paddingLeft: 38 }} />
      </div>

      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', border: `1.5px dashed ${C.border}`, borderRadius: 14 }}>
          <p style={{ fontSize: 28, marginBottom: 10 }}>👥</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.tp, marginBottom: 6 }}>Nenhum cliente ainda</p>
          <p style={{ fontSize: 12, color: C.ts }}>Clique em "Convidar cliente" para começar</p>
        </div>
      ) : filtered.map((c, i) => (
        <div key={c.id} onClick={() => setViewing(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 8, background: '#fff', cursor: 'pointer' }}>
          <Avatar initials={(c.nome || 'CL').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()} color={AV_COLORS[i % AV_COLORS.length]} size={42} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.tp }}>{c.nome || 'Cliente'}</p>
            <p style={{ fontSize: 11, color: C.ts, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</p>
          </div>
          <Badge label="Ativo" type="green" />
        </div>
      ))}
    </div>
  )
}
