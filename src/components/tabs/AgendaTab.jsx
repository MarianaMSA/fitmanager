import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { C, IS } from '../../lib/tokens'
import { Spinner, Btn } from '../UI'

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmtHora(dt) { return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }
function fmtData(dt) { const d = new Date(dt); return `${DIAS[d.getDay()]}, ${d.getDate()} ${MESES[d.getMonth()]}` }
function isHoje(dt) { const d = new Date(dt), h = new Date(); return d.toDateString() === h.toDateString() }

export default function AgendaTab({ showToast }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchAgenda() }, [user])

  async function fetchAgenda() {
    if (!user) return
    setLoading(true)
    const hoje = new Date(); hoje.setHours(0,0,0,0)
    const { data } = await supabase
      .from('compromissos')
      .select('*, profiles!compromissos_cliente_id_fkey(nome)')
      .eq('personal_id', user.id)
      .gte('data_hora', hoje.toISOString())
      .order('data_hora')
    setItems(data || [])
    setLoading(false)
  }

  async function cancelar(id) {
    await supabase.from('compromissos').update({ status: 'cancelado' }).eq('id', id)
    showToast('Compromisso cancelado')
    fetchAgenda()
  }

  const hoje = items.filter(i => isHoje(i.data_hora))
  const proximos = items.filter(i => !isHoje(i.data_hora))

  if (loading) return <Spinner />

  return (
    <div>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📅</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.tp, marginBottom: 6 }}>Agenda vazia</p>
          <p style={{ fontSize: 13, color: C.ts }}>Use a aba "+ Novo" para adicionar compromissos</p>
        </div>
      ) : (
        <>
          {hoje.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.green, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Hoje</p>
              {hoje.map(i => <CardCompromisso key={i.id} item={i} onCancelar={cancelar} />)}
            </div>
          )}
          {proximos.length > 0 && (
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.ts, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Próximos</p>
              {proximos.map(i => <CardCompromisso key={i.id} item={i} onCancelar={cancelar} />)}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CardCompromisso({ item, onCancelar }) {
  const [expand, setExpand] = useState(false)
  const clienteNome = item.profiles?.nome || item.titulo || 'Compromisso'
  const hora = fmtHora(item.data_hora)
  const data = fmtData(item.data_hora)
  const hoje = isHoje(item.data_hora)

  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 8, background: '#fff', overflow: 'hidden' }}>
      <div onClick={() => setExpand(!expand)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', cursor: 'pointer' }}>
        <div style={{ minWidth: 52, textAlign: 'center', background: hoje ? C.gl : '#F5F4F0', borderRadius: 10, padding: '6px 8px' }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: hoje ? C.green : C.tp }}>{hora}</p>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.tp }}>{clienteNome}</p>
          <p style={{ fontSize: 11, color: C.ts }}>{data} · {item.tipo || 'Treino'}</p>
        </div>
        <span style={{ fontSize: 12, color: C.tt }}>{expand ? '▲' : '▼'}</span>
      </div>
      {expand && (
        <div style={{ padding: '0 14px 14px', borderTop: `1px solid ${C.border}` }}>
          {item.observacoes && <p style={{ fontSize: 12, color: C.ts, marginTop: 10, marginBottom: 12 }}>{item.observacoes}</p>}
          <button onClick={() => onCancelar(item.id)} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.red}`, background: '#fff', color: C.red, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginTop: item.observacoes ? 0 : 10 }}>
            Cancelar compromisso
          </button>
        </div>
      )}
    </div>
  )
                                           }
