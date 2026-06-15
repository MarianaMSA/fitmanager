import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { C } from '../../lib/tokens'
import { Spinner } from '../UI'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function fmtData(dt) { const d = new Date(dt); return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}` }
function fmtHora(dt) { return new Date(dt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) }

export default function HistoricoTab({ showToast }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchHistorico() }, [user])

  async function fetchHistorico() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('compromissos')
      .select('*')
      .eq('cliente_id', user.id)
      .lt('data_hora', new Date().toISOString())
      .order('data_hora', { ascending: false })
      .limit(50)
    setItems(data || [])
    setLoading(false)
  }

  if (loading) return <Spinner />

  const realizados = items.filter(i => i.status !== 'cancelado').length
  const cancelados = items.filter(i => i.status === 'cancelado').length

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, background: C.gl, borderRadius: 12, padding: '14px', textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: C.green }}>{realizados}</p>
          <p style={{ fontSize: 11, color: C.ts }}>Realizados</p>
        </div>
        <div style={{ flex: 1, background: '#F5F4F0', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: C.tp }}>{items.length}</p>
          <p style={{ fontSize: 11, color: C.ts }}>Total</p>
        </div>
        <div style={{ flex: 1, background: '#FCEBEB', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: C.red }}>{cancelados}</p>
          <p style={{ fontSize: 11, color: C.ts }}>Cancelados</p>
        </div>
      </div>
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📊</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.tp, marginBottom: 6 }}>Sem histórico ainda</p>
          <p style={{ fontSize: 13, color: C.ts }}>Seus treinos passados aparecerão aqui</p>
        </div>
      ) : items.map(item => {
        const cancelado = item.status === 'cancelado'
        return (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 8, background: '#fff', opacity: cancelado ? 0.6 : 1 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: cancelado ? '#F5F4F0' : C.gl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              {cancelado ? '❌' : '✅'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.tp }}>{item.titulo || item.tipo || 'Treino'}</p>
              <p style={{ fontSize: 11, color: C.ts }}>{fmtData(item.data_hora)} às {fmtHora(item.data_hora)}</p>
              {cancelado && <p style={{ fontSize: 11, color: C.red, fontWeight: 600 }}>Cancelado</p>}
            </div>
          </div>
        )
      })}
    </div>
  )
      }
