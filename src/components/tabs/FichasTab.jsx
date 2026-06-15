import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { C, IS } from '../../lib/tokens'
import { Btn, Spinner } from '../UI'

export default function FichasTab({ showToast }) {
  const { user } = useAuth()
  const [fichas, setFichas] = useState([])
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNova, setShowNova] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [nome, setNome] = useState('')
  const [clientesSel, setClientesSel] = useState([]) // multiselect
  const [exercicios, setExercicios] = useState([{ nome: '', series: 3, reps: 10, carga: '', obs: '' }])
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchAll() }, [user])

  async function fetchAll() {
    if (!user) return
    setLoading(true)
    const [{ data: f }, { data: c }] = await Promise.all([
      supabase.from('fichas').select('*, profiles!fichas_cliente_id_fkey(nome)').eq('personal_id', user.id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,nome').eq('personal_id', user.id).eq('role', 'cliente').order('nome')
    ])
    setFichas(f || [])
    setClientes(c || [])
    setLoading(false)
  }

  function toggleCliente(id) {
    setClientesSel(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function addExercicio() {
    setExercicios(e => [...e, { nome: '', series: 3, reps: 10, carga: '', obs: '' }])
  }
  function updateEx(i, k, v) {
    setExercicios(e => e.map((ex, idx) => idx === i ? { ...ex, [k]: v } : ex))
  }
  function removeEx(i) {
    setExercicios(e => e.filter((_, idx) => idx !== i))
  }

  async function salvarFicha() {
    if (!nome) { showToast('Informe o nome da ficha'); return }
    setSaving(true)
    try {
      const exsFiltrados = exercicios.filter(e => e.nome)
      if (clientesSel.length === 0) {
        // ficha geral sem cliente
        const { error } = await supabase.from('fichas').insert({
          personal_id: user.id,
          cliente_id: null,
          nome,
          exercicios: exsFiltrados,
          ativa: true,
        })
        if (error) throw error
      } else {
        // criar uma cópia para cada cliente selecionado
        const inserts = clientesSel.map(cid => ({
          personal_id: user.id,
          cliente_id: cid,
          nome,
          exercicios: exsFiltrados,
          ativa: true,
        }))
        const { error } = await supabase.from('fichas').insert(inserts)
        if (error) throw error
      }
      showToast(clientesSel.length > 1
        ? `Ficha criada e atribuída a ${clientesSel.length} clientes!`
        : clientesSel.length === 1
          ? 'Ficha criada e atribuída!'
          : 'Ficha criada!'
      )
      setShowNova(false)
      setNome('')
      setClientesSel([])
      setExercicios([{ nome: '', series: 3, reps: 10, carga: '', obs: '' }])
      fetchAll()
    } catch (e) {
      showToast('Erro ao salvar ficha')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  // ── VISUALIZAÇÃO ──
  if (viewing) {
    const f = fichas.find(x => x.id === viewing)
    return (
      <div>
        <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', color: C.green, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginBottom: 16, padding: 0 }}>← Fichas</button>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.tp, marginBottom: 4 }}>{f.nome}</p>
        {f.profiles?.nome && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.gl, borderRadius: 8, padding: '4px 10px', marginBottom: 16 }}>
            <span style={{ fontSize: 12 }}>👤</span>
            <p style={{ fontSize: 12, color: C.gd, fontWeight: 600 }}>{f.profiles.nome}</p>
          </div>
        )}
        <p style={{ fontSize: 12, color: C.ts, marginBottom: 16 }}>{(f.exercicios || []).length} exercício{(f.exercicios || []).length !== 1 ? 's' : ''}</p>
        {(f.exercicios || []).map((ex, i) => (
          <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', marginBottom: 8, background: '#fff' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.tp, marginBottom: 8 }}>{i + 1}. {ex.nome}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ex.series && <span style={{ background: C.gl, color: C.gd, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{ex.series} séries</span>}
              {ex.reps && <span style={{ background: '#E6F1FB', color: C.blue, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{ex.reps} reps</span>}
              {ex.carga && <span style={{ background: '#FAEEDA', color: C.amber, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{ex.carga} kg</span>}
            </div>
            {ex.obs && <p style={{ fontSize: 12, color: C.ts, marginTop: 8, fontStyle: 'italic' }}>{ex.obs}</p>}
          </div>
        ))}
      </div>
    )
  }

  // ── NOVA FICHA ──
  if (showNova) return (
    <div>
      <button onClick={() => { setShowNova(false); setClientesSel([]) }} style={{ background: 'none', border: 'none', color: C.green, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginBottom: 16, padding: 0 }}>← Fichas</button>

      {/* Header */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.ts, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Nome da ficha</p>
        <input
          value={nome}
          onChange={e => setNome(e.target.value)}
          placeholder="Ex: Ficha A — Peito e Tríceps"
          style={{ ...IS, fontSize: 15, fontWeight: 600 }}
        />
      </div>

      {/* Exercícios */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.ts, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 }}>Exercícios ({exercicios.length})</p>
        {exercicios.map((ex, i) => (
          <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 10, background: '#FAFAFA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, alignItems: 'center' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.tp }}>Exercício {i + 1}</p>
              {exercicios.length > 1 && (
                <button onClick={() => removeEx(i)} style={{ background: 'none', border: 'none', color: C.red, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>Remover</button>
              )}
            </div>
            <div style={{ marginBottom: 6 }}>
              <label style={{ fontSize: 10, color: C.ts, display: 'block', marginBottom: 4 }}>Nome</label>
              <input value={ex.nome} onChange={e => updateEx(i, 'nome', e.target.value)} placeholder="Digite ou escolha..." style={{ ...IS, fontSize: 13 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: C.ts, display: 'block', marginBottom: 4 }}>Séries</label>
                <input value={ex.series} onChange={e => updateEx(i, 'series', e.target.value)} type="number" min="1" style={{ ...IS, fontSize: 13, textAlign: 'center' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: C.ts, display: 'block', marginBottom: 4 }}>Reps</label>
                <input value={ex.reps} onChange={e => updateEx(i, 'reps', e.target.value)} type="number" min="1" style={{ ...IS, fontSize: 13, textAlign: 'center' }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: C.ts, display: 'block', marginBottom: 4 }}>Carga</label>
                <input value={ex.carga} onChange={e => updateEx(i, 'carga', e.target.value)} placeholder="—" style={{ ...IS, fontSize: 13, textAlign: 'center' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 10, color: C.ts, display: 'block', marginBottom: 4 }}>Observações</label>
              <input value={ex.obs} onChange={e => updateEx(i, 'obs', e.target.value)} placeholder="Foco, restrições..." style={{ ...IS, fontSize: 12 }} />
            </div>
          </div>
        ))}
        <button onClick={addExercicio} style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: `1.5px dashed ${C.green}`, background: C.gl, color: C.gd, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Exercício
        </button>
      </div>

      {/* Atribuir a clientes — MULTISELECT */}
      {clientes.length > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.ts, textTransform: 'uppercase', letterSpacing: 0.5 }}>Atribuir a clientes</p>
            {clientesSel.length > 0 && (
              <span style={{ fontSize: 11, color: C.gd, fontWeight: 600, background: C.gl, padding: '2px 8px', borderRadius: 10 }}>
                {clientesSel.length} selecionado{clientesSel.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p style={{ fontSize: 11, color: C.ts, marginBottom: 12 }}>Selecione um ou mais clientes. Se nenhum, a ficha fica como modelo geral.</p>

          {/* Opção: Nenhum */}
          <div
            onClick={() => setClientesSel([])}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 10, marginBottom: 6, cursor: 'pointer',
              border: `1.5px solid ${clientesSel.length === 0 ? C.green : C.border}`,
              background: clientesSel.length === 0 ? C.gl : '#fff',
            }}
          >
            <div style={{
              width: 20, height: 20, borderRadius: '50%', border: `2px solid ${clientesSel.length === 0 ? C.green : C.border}`,
              background: clientesSel.length === 0 ? C.green : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              {clientesSel.length === 0 && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: clientesSel.length === 0 ? C.gd : C.tp }}>Nenhum</p>
              <p style={{ fontSize: 11, color: C.ts }}>Ficha modelo geral</p>
            </div>
          </div>

          {/* Clientes com checkbox */}
          {clientes.map(c => {
            const sel = clientesSel.includes(c.id)
            const initials = (c.nome || '??').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            return (
              <div
                key={c.id}
                onClick={() => toggleCliente(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                  borderRadius: 10, marginBottom: 6, cursor: 'pointer',
                  border: `1.5px solid ${sel ? C.green : C.border}`,
                  background: sel ? C.gl : '#fff',
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: 5, border: `2px solid ${sel ? C.green : C.border}`,
                  background: sel ? C.green : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  {sel && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </div>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: sel ? C.gd : '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {initials}
                </div>
                <p style={{ fontSize: 13, fontWeight: sel ? 700 : 400, color: sel ? C.gd : C.tp }}>{c.nome}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Botões */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => { setShowNova(false); setClientesSel([]) }}
          style={{ flex: 1, padding: '14px 0', borderRadius: 12, border: `1px solid ${C.border}`, background: '#fff', color: C.tp, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancelar
        </button>
        <Btn onClick={salvarFicha} disabled={saving || !nome} style={{ flex: 2, padding: '14px 0', fontSize: 14 }}>
          {saving ? 'Salvando...' : clientesSel.length > 0 ? `Salvar e atribuir (${clientesSel.length})` : 'Salvar ficha ✓'}
        </Btn>
      </div>
    </div>
  )

  // ── LISTA ──
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
            <p style={{ fontSize: 11, color: C.ts }}>{f.profiles?.nome || 'Geral'} · {(f.exercicios || []).length} exercício{(f.exercicios || []).length !== 1 ? 's' : ''}</p>
          </div>
          <span style={{ fontSize: 18, color: C.tt }}>›</span>
        </div>
      ))}
    </div>
  )
}
