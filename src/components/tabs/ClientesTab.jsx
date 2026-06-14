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
  const [inviteLink, setInviteLink] = useState(null)
  const [copied, setCopied] = useState(false)

  const AV_COLORS = ['teal', 'blue', 'amber', 'coral', 'purple']
  useEffect(() => { fetchClientes() }, [user])

  async function fetchClientes() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('profiles').select('*').eq('personal_id', user.id).eq('role', 'cliente').order('nome')
    setClientes(data || [])
    setLoading(false)
  }

  async function sendInvite() {
    if (!inviteEmail) return
    setSending(true)
    try {
      const token = crypto.randomUUID()
      const { error } = await supabase.from('invites').insert({ personal_id: user.id, email: inviteEmail, nome_sugerido: inviteNome, token, status: 'pending' })
      if (error) throw error
      const inviteUrl = window.location.origin + '/convite?token=' + token
      setInviteLink({ url: inviteUrl, email: inviteEmail, nome: inviteNome })
    } catch (e) {
      showToast('Erro ao gerar convite')
    } finally { setSending(false) }
  }

  function copyLink() { navigator.clipboard.writeText(inviteLink.url); setCopied(true); setTimeout(() => setCopied(false), 2500) }
  function shareWhatsApp() {
    const n = profile?.nome || 'Seu personal'
    window.open('https://wa.me/?text=' + encodeURIComponent('Ola ' + (inviteLink.nome||'') + '!\n\n' + n + ' te convidou para o VirtusManager.\n\n' + inviteLink.url), '_blank')
  }
  function shareEmail() {
    const n = profile?.nome || 'Seu personal'
    window.open('mailto:' + inviteLink.email + '?subject=' + encodeURIComponent(n + ' te convidou para o VirtusManager') + '&body=' + encodeURIComponent('Ola!\n\n' + n + ' te convidou para o VirtusManager.\n\n' + inviteLink.url))
  }
  function closeInvite() { setShowInvite(false); setInviteLink(null); setInviteEmail(''); setInviteNome(''); setCopied(false) }

  const filtered = clientes.filter(c => c.nome?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()))
  if (viewing) { const client = clientes.find(c => c.id === viewing); return <PerfilCliente client={client} onBack={() => { setViewing(null); fetchClientes() }} showToast={showToast} /> }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontSize: 13, color: C.ts }}>{clientes.length} cliente{clientes.length !== 1 ? 's' : ''}</p>
        <Btn onClick={() => setShowInvite(true)} style={{ padding: '8px 14px', fontSize: 12 }}>+ Convidar cliente</Btn>
      </div>
      {showInvite && (
        <div onClick={closeInvite} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340 }}>
            {!inviteLink ? (
              <>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.tp, marginBottom: 6 }}>Convidar cliente</p>
                <p style={{ fontSize: 12, color: C.ts, marginBottom: 18, lineHeight: 1.6 }}>Gere um link para enviar pelo WhatsApp ou e-mail.</p>
                <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 5 }}>Nome</label><input value={inviteNome} onChange={e => setInviteNome(e.target.value)} placeholder="Ana Souza" style={IS} /></div>
                <div style={{ marginBottom: 20 }}><label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 5 }}>E-mail *</label><input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="cliente@email.com" type="email" style={IS} /></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn variant="secondary" onClick={closeInvite} style={{ flex: 1 }}>Cancelar</Btn>
                  <Btn onClick={sendInvite} disabled={!inviteEmail || sending} style={{ flex: 2 }}>{sending ? 'Gerando...' : 'Gerar link de convite'}</Btn>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 16 }}><p style={{ fontSize: 36, marginBottom: 8 }}>checkmark</p><p style={{ fontSize: 16, fontWeight: 700, color: C.tp, marginBottom: 4 }}>Convite pronto!</p><p style={{ fontSize: 12, color: C.ts }}>Envie para {inviteLink.nome || inviteLink.email}</p></div>
                <div style={{ background: '#F5F4F0', borderRadius: 10, padding: '10px 12px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <p style={{ fontSize: 11, color: C.ts, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inviteLink.url}</p>
                  <button onClick={copyLink} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid #ddd', background: copied ? '#d4edda' : '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>{copied ? 'Copiado!' : 'Copiar'}</button>
                </div>
                <p style={{ fontSize: 11, color: C.tt, marginBottom: 10, textAlign: 'center' }}>Enviar via:</p>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button onClick={shareWhatsApp} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: '#25D366', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>WhatsApp</button>
                  <button onClick={shareEmail} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #ddd', background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>E-mail</button>
                </div>
                <Btn variant="secondary" onClick={closeInvite} fullWidth>Fechar</Btn>
              </>
            )}
          </div>
        </div>
      )}
      <div style={{ position: 'relative', marginBottom: 14 }}><span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>busca</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..." style={{ ...IS, paddingLeft: 38 }} /></div>
      {loading ? <Spinner /> : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', border: '1.5px dashed #E8E6E0', borderRadius: 14 }}><p style={{ fontSize: 28, marginBottom: 10 }}>grupo</p><p style={{ fontSize: 14, fontWeight: 600, color: C.tp, marginBottom: 6 }}>Nenhum cliente ainda</p><p style={{ fontSize: 12, color: C.ts }}>Clique em Convidar cliente para comecar</p></div>
      ) : filtered.map((c, i) => (
        <div key={c.id} onClick={() => setViewing(c.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid #E8E6E0', borderRadius: 14, marginBottom: 8, background: '#fff', cursor: 'pointer' }}>
          <Avatar initials={(c.nome||'CL').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()} color={AV_COLORS[i%AV_COLORS.length]} size={42} />
          <div style={{ flex: 1, minWidth: 0 }}><p style={{ fontSize: 13, fontWeight: 600, color: C.tp }}>{c.nome || 'Cliente'}</p><p style={{ fontSize: 11, color: C.ts, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</p></div>
          <Badge label="Ativo" type="green" />
        </div>
      ))}
    </div>
  )
                                                            }
