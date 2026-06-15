import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { C } from '../../lib/tokens'
import { Spinner } from '../UI'

export default function MinhasFichasTab({ showToast }) {
  const { user } = useAuth()
  const [fichas, setFichas] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)

  useEffect(() => { fetchFichas() }, [user])

  async function fetchFichas() {
    if (!user) return
    setLoading(true)
    const { data } = await supabase
      .from('fichas')
      .select('*')
      .eq('cliente_id', user.id)
      .eq('ativa', true)
      .order('created_at', { ascending: false })
    setFichas(data || [])
    setLoading(false)
  }

  if (loading) return <Spinner />

  if (viewing) {
    const f = fichas.find(x => x.id === viewing)
    return (
      <div>
        <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', color: C.green, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginBottom: 16, padding: 0 }}>← Voltar</button>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.tp, marginBottom: 16 }}>{f.nome}</p>
        {(f.exercicios || []).length === 0 ? (
          <p style={{ color: C.ts, fontSize: 13 }}>Nenhum exercício nesta ficha.</p>
        ) : (f.exercicios || []).map((ex, i) => (
          <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px', marginBottom: 10, background: '#fff' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.tp, marginBottom: 8 }}>{i+1}. {ex.nome}</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: ex.obs ? 8 : 0 }}>
              {ex.series && (
                <div style={{ background: C.gl, borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: C.ts }}>Séries</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.gd }}>{ex.series}</p>
                </div>
              )}
              {ex.reps && (
                <div style={{ background: '#E6F1FB', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: C.ts }}>Repetições</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.blue }}>{ex.reps}</p>
                </div>
              )}
              {ex.carga && (
                <div style={{ background: '#FAEEDA', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: C.ts }}>Carga</p>
                  <p style={{ fontSize: 16, fontWeight: 700, color: C.amber }}>{ex.carga}kg</p>
                </div>
              )}
            </div>
            {ex.obs && <p style={{ fontSize: 12, color: C.ts, marginTop: 8, fontStyle: 'italic' }}>{ex.obs}</p>}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {fichas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.tp, marginBottom: 6 }}>Nenhuma ficha ainda</p>
          <p style={{ fontSize: 13, color: C.ts }}>Seu personal ainda não criou fichas para você</p>
        </div>
      ) : fichas.map(f => (
        <div key={f.id} onClick={() => setViewing(f.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 8, background: '#fff', cursor: 'pointer' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.gl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📋</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.tp }}>{f.nome}</p>
            <p style={{ fontSize: 12, color: C.ts }}>{(f.exercicios || []).length} exercício{(f.exercicios||[]).length !== 1 ? 's' : ''}</p>
          </div>
          <span style={{ fontSize: 20, color: C.tt }}>›</span>
        </div>
      ))}
    </div>
  )
                         }
