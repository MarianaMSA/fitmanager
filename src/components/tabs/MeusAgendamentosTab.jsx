import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { C } from '../../lib/tokens'
import { Spinner } from '../UI'

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtHora(dt) { return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
function fmtData(dt) { const d = new Date(dt); return `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}` }
function isHoje(dt) { const d = new Date(dt), h = new Date(); return d.toDateString() === h.toDateString() }

export default function MeusAgendamentosTab({ showToast }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchItems() }, [user])

  async function fetchItems() {
    if (!user) return
    setLoading(true)
    const hoje = new Date(); hoje.setHours(0,0,0,0)
    const { data } = await supabase
      .from('compromissos')
      .select('*, profiles!compromissos_personal_id_fkey(nome)')
      .eq('cliente_id', user.id)
      .gte('data_hora', hoje.toISOString())
      .eq('status', 'agendado')
      .order('data_hora')
    setItems(data || [])
    setLoading(false)
  }

  if (loading) return <Spinner />

  const hoje = items.filter(i => isHoje(i.data_hora))
  const proximos = items.filter(i => !isHoje(i.data_hora))

  return (
    <div>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🏋️</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.tp, marginBottom: 6 }}>Nenhum treino agendado</p>
          <p style={{ fontSize: 13, color: C.ts }}>Seu personal ainda não agendou treinos</p>
        </div>
      ) : (
        <>
          {hoje.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Hoje</p>
              {hoje.map(i => <CardTreino key={i.id} item={i} />)}
            </div>
          )}
          {proximos.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.ts, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Próximos treinos</p>
              {proximos.map(i => <CardTreino key={i.id} item={i} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CardTreino({ item }) {
  const hoje = isHoje(item.data_hora)
  return (
    <div style={{ border: `1px solid ${hoje ? C.green : C.border}`, borderRadius: 14, padding: '14px', marginBottom: 8, background: hoje ? C.gl : '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ minWidth: 52, textAlign: 'center', background: hoje ? '#fff' : '#F5F4F0', borderRadius: 10, padding: '6px 8px' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: hoje ? C.green : C.tp }}>{fmtHora(item.data_hora)}</p>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.tp }}>{item.titulo || item.tipo || 'Treino'}</p>
          <p style={{ fontSize: 11, color: C.ts }}>{fmtData(item.data_hora)}</p>
          {item.profiles?.nome && <p style={{ fontSize: 11, color: C.ts }}>Personal: {item.profiles.nome}</p>}
        </div>
      </div>
      {item.observacoes && <p style={{ fontSize: 12, color: C.ts, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>{item.observacoes}</p>}
    </div>
  )
    }
