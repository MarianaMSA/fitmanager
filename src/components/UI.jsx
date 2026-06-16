import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { C } from '../lib/tokens'
import { Toast } from '../components/UI'

// Lazy imports of tab content
import AgendaTab from '../components/tabs/AgendaTab'
import ClientesTab from '../components/tabs/ClientesTab'
import FichasTab from '../components/tabs/FichasTab'
import NovoCompromissoTab from '../components/tabs/NovoCompromissoTab'
import MeusAgendamentosTab from '../components/tabs/MeusAgendamentosTab'
import AgendarAulaTab from '../components/tabs/AgendarAulaTab'
import MinhasFichasTab from '../components/tabs/MinhasFichasTab'
import HistoricoTab from '../components/tabs/HistoricoTab'

const P_TABS = [
  { id: 'agenda',    lbl: 'Agenda',    icon: '📅' },
  { id: 'clientes',  lbl: 'Clientes',  icon: '👥' },
  { id: 'fichas',    lbl: 'Fichas',    icon: '📋' },
  { id: 'novo',      lbl: 'Novo',      icon: '＋' },
]
const C_TABS = [
  { id: 'meus',      lbl: 'Treinos',   icon: '🏋️' },
  { id: 'agendar',   lbl: 'Agendar',   icon: '📆' },
  { id: 'fichas',    lbl: 'Fichas',    icon: '📋' },
  { id: 'historico', lbl: 'Histórico', icon: '📊' },
]
const TAB_LBL = {
  agenda: 'Agenda', clientes: 'Clientes', fichas: 'Fichas de Treino', novo: 'Novo Compromisso',
  meus: 'Meus Treinos', agendar: 'Agendar Aula', historico: 'Histórico',
}

export default function AppShell() {
  const nav = useNavigate()
  const { profile, signOut } = useAuth()
  const role = profile?.role || 'personal'
  const [pTab, setPTab] = useState('agenda')
  const [cTab, setCTab] = useState('meus')
  const [toast, setToast] = useState({ visible: false, msg: '', type: 'success' })

  const showToast = (msg, type = 'success') => {
    setToast({ visible: true, msg, type })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 3000)
  }

  const tabs = role === 'personal' ? P_TABS : C_TABS
  const activeTab = role === 'personal' ? pTab : cTab
  const setTab = role === 'personal' ? setPTab : setCTab

  const initials = profile?.nome
    ? profile.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : (role === 'personal' ? 'PT' : 'CL')

  const handleLogout = async () => {
    await signOut()
    nav('/', { replace: true })
  }

  return (
    <div className="app-shell" style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: C.bg }}>
      {/* Header */}
      <div style={{ background: C.green, padding: '14px 18px 12px', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>VirtusManager</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,.7)', marginTop: 1 }}>{TAB_LBL[activeTab] || 'VirtusManager'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right', marginRight: 4 }}>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.9)', fontWeight: 500 }}>{profile?.nome?.split(' ')[0] || ''}</p>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,.6)' }}>{role === 'personal' ? 'Personal' : 'Cliente'}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sair"
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,.15)', border: '1.5px solid rgba(255,255,255,.3)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {initials}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '16px 16px 88px', minHeight: 'calc(100vh - 60px)' }}>
        {/* Personal tabs */}
        {role === 'personal' && pTab === 'agenda'   && <AgendaTab showToast={showToast} />}
        {role === 'personal' && pTab === 'clientes'  && <ClientesTab showToast={showToast} />}
        {role === 'personal' && pTab === 'fichas'    && <FichasTab showToast={showToast} />}
        {role === 'personal' && pTab === 'novo'      && <NovoCompromissoTab showToast={showToast} goToAgenda={() => setPTab('agenda')} />}
        {/* Cliente tabs */}
        {role === 'cliente'  && cTab === 'meus'      && <MeusAgendamentosTab showToast={showToast} />}
        {role === 'cliente'  && cTab === 'agendar'   && <AgendarAulaTab showToast={showToast} />}
        {role === 'cliente'  && cTab === 'fichas'    && <MinhasFichasTab showToast={showToast} />}
        {role === 'cliente'  && cTab === 'historico' && <HistoricoTab showToast={showToast} />}
      </div>

      {/* Bottom Nav */}
      <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, background: 'rgba(255,255,255,.97)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${C.border}`, display: 'flex', zIndex: 20 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '10px 4px 12px', border: 'none', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', color: activeTab === t.id ? C.green : C.tt, fontFamily: 'inherit', borderTop: activeTab === t.id ? `2px solid ${C.green}` : '2px solid transparent', transition: 'color .15s' }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: activeTab === t.id ? 600 : 400 }}>{t.lbl}</span>
          </button>
        ))}
      </div>

      <Toast msg={toast.msg} visible={toast.visible} type={toast.type} />
    </div>
  )
}
