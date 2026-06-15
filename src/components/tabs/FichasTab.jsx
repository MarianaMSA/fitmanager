import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { C, IS } from '../../lib/tokens'
import { Btn, Spinner, Avatar } from '../UI'

export default function FichasTab({ showToast }) {
  const { user } = useAuth()
  const [fichas, setFichas] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNova, setShowNova] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [nome, setNome] = useState('')
  const [clienteId, setClienteId] = useState('')
  const [exercicios, setExercicios] = useState([{ nome: '', series: '', reps: '', carga: '', obs: '' }])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [user])

  async function fetchAll() {
    if (!user) return
    setLoading(true)
    const [{ data: f }, { data: c }] = await Promise.all([
      supabase.from('fichas').select('*, profiles!fichas_cliente_id_fkey(nome)').eq('personal_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,nome').eq('personal_id', user.id).eq('role','cliente').order('nome')
    ])
    setFichas(f || [])
    setClientes(c || [])
    setLoading(false)
  }

  function addExercicio() { setExercicios(e => [...e, { nome: '', series: '', reps: '', carga: '', obs: '' }]) }
  function updateEx(i, k, v) { setExercicios(e => e.map((ex, idx) => idx === i ? { ...ex, [k]: v } : ex)) }
  function removeEx(i) { setExercicios(e => e.filter((_, idx) => idx !== i)) }

  async function salvarFicha() {
    if (!nome) { showToast('Informe o nome da ficha'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('fichas').insert({
        personal_id: user.id,
        cliente_id: clienteId || null,
        nome,
        exercicios: exercicios.filter(e => e.nome),
        ativa: true,
      })
      if (error) throw error
      showToast('Ficha criada!')
      setShowNova(false); setNome(''); setClienteId(''); setExercicios([{ nome: '', series: '', reps: '', carga: '', obs: '' }])
      fetchAll()
    } catch(e) { showToast('Erro ao salvar ficha') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  if (viewing) {
    const f = fichas.find(x => x.id === viewing)
    return (
      <div>
        <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', color: C.green, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginBottom: 16, padding: 0 }}>← Voltar</button>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.tp, marginBottom: 4 }}>{f.nome}</p>
        {f.profiles?.nome && <p style={{ fontSize: 13, color: C.ts, marginBottom: 16 }}>Cliente: {f.profiles.nome}</p>}
        {(f.exercicios || []).map((ex, i) => (
          <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, background: '#fff' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.tp, marginBottom: 6 }}>{i+1}. {ex.nome}</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {ex.series && <p style={{ fontSize: 12, color: C.ts }}>Séries: <strong>{ex.series}</strong></p>}
              {ex.reps && <p style={{ fontSize: 12, color: C.ts }}>Reps: <strong>{ex.reps}</strong></p>}
              {ex.carga && <p style={{ fontSize: 12, color: C.ts }}>Carga: <strong>{ex.carga}kg</strong></p>}
            </div>
            {ex.obs && <p style={{ fontSize: 12, color: C.tt, marginTop: 6 }}>{ex.obs}</p>}
          </div>
        ))}
      </div>
    )
  }

  if (showNova) return (
    <div>
      <button onClick={() => setShowNova(false)} style={{ background: 'none', border: 'none', color: C.green, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginBottom: 16, padding: 0 }}>← Voltar</button>
      <p style={{ fontSize: 16, fontWeight: 700, color: C.tp, marginBottom: 16 }}>Nova ficha de treino</p>
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Nome da ficha *</label>
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Treino A – Peito e Tríceps" style={IS} />
      </div>
      {clientes.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Atribuir a cliente</label>
          <select value={clienteId} onChange={e => setClienteId(e.target.value)} style={{ ...IS, appearance: 'none' }}>
            <option value="">Nenhum</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      )}
      <p style={{ fontSize: 13, fontWeight: 600, color: C.tp, marginBottom: 10 }}>Exercícios</p>
      {exercicios.map((ex, i) => (
        <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.ts }}>Exercício {i+1}</p>
            {exercicios.length > 1 && <button onClick={() => removeEx(i)} style={{ background: 'none', border: 'none', color: C.red, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Remover</button>}
          </div>
          <input value={ex.nome} onChange={e => updateEx(i, 'nome', e.target.value)} placeholder="Nome do exercício" style={{ ...IS, marginBottom: 8 }} />
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input value={ex.series} onChange={e => updateEx(i, 'series', e.target.value)} placeholder="Séries" style={{ ...IS, flex: 1 }} />
            <input value={ex.reps} onChange={e => updateEx(i, 'reps', e.target.value)} placeholder="Reps" style={{ ...IS, flex: 1 }} />
            <input value={ex.carga} onChange={e => updateEx(i, 'carga', e.target.value)} placeholder="Carga kg" style={{ ...IS, flex: 1 }} />
          </div>
          <input value={ex.obs} onChange={e => updateEx(i, 'obs', e.target.value)} placeholder="Observações" style={IS} />
        </div>
      ))}
      <button onClick={addExercicio} style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: `1.5px dashed ${C.border}`, background: '#fff', color: C.ts, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>
        + Adicionar exercício
      </button>
      <Btn onClick={salvarFicha} disabled={saving || !nome} fullWidth style={{ padding: '15px 0', fontSize: 16 }}>
        {saving ? 'Salvando...' : 'Salvar ficha'}
      </Btn>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <p style={{ fontSize: 13, color: C.ts }}>{fichas.length} ficha{fichas.length !== 1 ? 's' : ''}</p>
        <Btn onClick={() => setShowNova(true)} style={{ padding: '8px 14px', fontSize: 12 }}>+ Nova ficha</Btn>
      </div>
      {fichas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: `1.5px dashed ${C.border}`, borderRadius: 14 }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>📋</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: C.tp, marginBottom: 6 }}>Nenhuma ficha ainda</p>
          <p style={{ fontSize: 13, color: C.ts }}>Crie fichas de treino para seus clientes</p>
        </div>
      ) : fichas.map(f => (
        <div key={f.id} onClick={() => setViewing(f.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 8, background: '#fff', cursor: 'pointer' }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: C.gl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>📋</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.tp }}>{f.nome}</p>
            <p style={{ fontSize: 11, color: C.ts }}>{f.profiles?.nome || 'Geral'} · {(f.exercicios || []).length} exercício{(f.exercicios||[]).length !== 1 ? 's' : ''}</p>
          </div>
          <span style={{ fontSize: 18, color: C.tt }}>›</span>
        </div>
      ))}
    </div>
  )
}
