import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { C, IS } from '../lib/tokens'
import { BackBtn, Btn, Spinner } from './UI'

// ─── helpers ───────────────────────────────────────────────────────────────
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
function fmtData(d) { const dt = new Date(d); return `${dt.getDate()} ${MESES[dt.getMonth()]} ${dt.getFullYear()}` }

// ─── Main ───────────────────────────────────────────────────────────────────
export default function PerfilCliente({ client, onBack, showToast }) {
  const [aba, setAba] = useState('fichas')
  if (!client) return null
  const initials = (client.nome || 'CL').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  const ABAS = [
    { id: 'fichas',    lbl: '📋 Fichas' },
    { id: 'period',    lbl: '📆 Period.' },
    { id: 'medidas',   lbl: '📏 Medidas' },
  ]

  return (
    <div>
      <BackBtn label="Clientes" onClick={onBack} />

      {/* Header cliente */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 16px', background: '#fff', borderRadius: 16, border: `1px solid ${C.border}`, marginBottom: 14 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: C.gl, color: C.gd, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>{initials}</div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: C.tp }}>{client.nome}</p>
          <p style={{ fontSize: 12, color: C.ts, marginTop: 2 }}>{client.email}</p>
        </div>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
        {ABAS.map(t => (
          <button key={t.id} onClick={() => setAba(t.id)} style={{ flex: 1, padding: '8px 4px', borderRadius: 9, textAlign: 'center', fontSize: 12, fontWeight: aba === t.id ? 700 : 400, color: aba === t.id ? C.green : C.ts, background: aba === t.id ? C.gl : 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
            {t.lbl}
          </button>
        ))}
      </div>

      {aba === 'fichas'  && <FichasCliente client={client} showToast={showToast} />}
      {aba === 'period'  && <Periodizacao  client={client} showToast={showToast} />}
      {aba === 'medidas' && <Medidas       client={client} showToast={showToast} />}
    </div>
  )
}

// ─── Fichas do cliente ───────────────────────────────────────────────────────
function FichasCliente({ client, showToast }) {
  const { user } = useAuth()
  const [fichas, setFichas] = useState([])
  const [todas, setTodas] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState(null)
  const [showAtribuir, setShowAtribuir] = useState(false)
  const [fichaId, setFichaId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchFichas() }, [client])

  async function fetchFichas() {
    setLoading(true)
    const [{ data: atrib }, { data: pool }] = await Promise.all([
      supabase.from('fichas').select('*').eq('personal_id', user.id).eq('cliente_id', client.id).eq('ativa', true).order('created_at', { ascending: false }),
      supabase.from('fichas').select('id,nome').eq('personal_id', user.id).is('cliente_id', null).order('nome'),
    ])
    setFichas(atrib || [])
    setTodas(pool || [])
    setLoading(false)
  }

  async function atribuir() {
    if (!fichaId) return
    setSaving(true)
    try {
      const { data: orig } = await supabase.from('fichas').select('*').eq('id', fichaId).single()
      const { error } = await supabase.from('fichas').insert({ ...orig, id: undefined, cliente_id: client.id, created_at: undefined })
      if (error) throw error
      showToast('Ficha atribuída!')
      setShowAtribuir(false); setFichaId('')
      fetchFichas()
    } catch { showToast('Erro ao atribuir ficha') }
    finally { setSaving(false) }
  }

  async function remover(id) {
    await supabase.from('fichas').update({ ativa: false }).eq('id', id)
    showToast('Ficha removida')
    fetchFichas()
  }

  if (loading) return <Spinner />

  if (viewing) {
    const f = fichas.find(x => x.id === viewing)
    return (
      <div>
        <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', color: C.green, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginBottom: 16, padding: 0 }}>← Fichas</button>
        <p style={{ fontSize: 17, fontWeight: 700, color: C.tp, marginBottom: 16 }}>{f.nome}</p>
        {(f.exercicios || []).map((ex, i) => (
          <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 14, marginBottom: 8, background: '#fff' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: C.tp, marginBottom: 8 }}>{i+1}. {ex.nome}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {ex.series && <span style={{ background: C.gl, color: C.gd, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{ex.series} séries</span>}
              {ex.reps   && <span style={{ background: '#E6F1FB', color: C.blue, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{ex.reps} reps</span>}
              {ex.carga  && <span style={{ background: '#FAEEDA', color: C.amber, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{ex.carga} kg</span>}
            </div>
            {ex.obs && <p style={{ fontSize: 12, color: C.ts, marginTop: 8, fontStyle: 'italic' }}>{ex.obs}</p>}
          </div>
        ))}
        <button onClick={() => remover(f.id)} style={{ marginTop: 8, padding: '10px 0', width: '100%', borderRadius: 10, border: `1px solid ${C.red}`, background: '#fff', color: C.red, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
          Remover ficha deste cliente
        </button>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: C.ts }}>{fichas.length} ficha{fichas.length !== 1 ? 's' : ''} ativas</p>
        {todas.length > 0 && <Btn onClick={() => setShowAtribuir(true)} style={{ padding: '7px 12px', fontSize: 12 }}>+ Atribuir ficha</Btn>}
      </div>

      {showAtribuir && (
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 14, padding: 16, marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.tp, marginBottom: 10 }}>Selecionar ficha</p>
          <select value={fichaId} onChange={e => setFichaId(e.target.value)} style={{ ...IS, marginBottom: 12, appearance: 'none' }}>
            <option value="">Escolha uma ficha...</option>
            {todas.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
          </select>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn variant="secondary" onClick={() => setShowAtribuir(false)} style={{ flex: 1 }}>Cancelar</Btn>
            <Btn onClick={atribuir} disabled={!fichaId || saving} style={{ flex: 2 }}>{saving ? 'Salvando...' : 'Atribuir'}</Btn>
          </div>
        </div>
      )}

      {fichas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', border: `1.5px dashed ${C.border}`, borderRadius: 14 }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>📋</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.tp, marginBottom: 4 }}>Nenhuma ficha atribuída</p>
          <p style={{ fontSize: 12, color: C.ts }}>Crie fichas na aba Fichas e atribua aqui</p>
        </div>
      ) : fichas.map(f => (
        <div key={f.id} onClick={() => setViewing(f.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 8, background: '#fff', cursor: 'pointer' }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: C.gl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>📋</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.tp }}>{f.nome}</p>
            <p style={{ fontSize: 11, color: C.ts }}>{(f.exercicios||[]).length} exercício{(f.exercicios||[]).length !== 1 ? 's' : ''}</p>
          </div>
          <span style={{ color: C.tt, fontSize: 18 }}>›</span>
        </div>
      ))}
    </div>
  )
}

// ─── Periodização ────────────────────────────────────────────────────────────
const FASES = ['Adaptação','Hipertrofia','Força','Potência','Manutenção','Definição']

const FASE_META = {
  Adaptação:  { emoji: '🏋️', bg: '#E6F1FB', tc: '#185FA5', bar: '#185FA5' },
  Hipertrofia:{ emoji: '💪', bg: '#E1F5EE', tc: '#0F6E56', bar: '#1D9E75' },
  Força:      { emoji: '🏋️', bg: '#FAEEDA', tc: '#854F0B', bar: '#E8940A' },
  Potência:   { emoji: '⚡', bg: '#FAECE7', tc: '#993C1D', bar: '#E05C2A' },
  Manutenção: { emoji: '🔄', bg: '#F5F4F0', tc: '#6B6860', bar: '#A09D98' },
  Definição:  { emoji: '✂️', bg: '#EEEDFE', tc: '#3C3489', bar: '#6B63D4' },
}

// Calcula data de início/fim de cada meso a partir da data_inicio do macro
function calcMesoDates(dataInicio, mesos) {
  const base = dataInicio ? new Date(dataInicio + 'T00:00:00') : new Date()
  const results = []
  let cursor = new Date(base)
  for (const m of mesos) {
    const inicio = new Date(cursor)
    const fim = new Date(cursor)
    fim.setDate(fim.getDate() + (parseInt(m.semanas) || 4) * 7 - 1)
    results.push({ inicio, fim })
    cursor.setDate(cursor.getDate() + (parseInt(m.semanas) || 4) * 7)
  }
  return results
}

function fmtMes(d) {
  const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${d.getDate().toString().padStart(2,'0')}/${MESES_CURTOS[d.getMonth()]}/${d.getFullYear()}`
}

function fmtMesAno(d) {
  const MESES_CURTOS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${MESES_CURTOS[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
}

// Calcula intensidade média por mês (simplificado: % baseado na fase)
const FASE_INTENSIDADE = { Adaptação: 65, Hipertrofia: 75, Força: 85, Potência: 90, Manutenção: 60, Definição: 70 }

function calcIntensidadePorMes(dataInicio, mesos) {
  const base = dataInicio ? new Date(dataInicio + 'T00:00:00') : new Date()
  const mapa = {}
  let cursor = new Date(base)
  for (const m of mesos) {
    const totalDias = (parseInt(m.semanas) || 4) * 7
    let dias = 0
    while (dias < totalDias) {
      const chave = `${cursor.getFullYear()}-${cursor.getMonth()}`
      if (!mapa[chave]) mapa[chave] = { date: new Date(cursor.getFullYear(), cursor.getMonth(), 1), intensidades: [] }
      mapa[chave].intensidades.push(FASE_INTENSIDADE[m.fase] || 70)
      cursor.setDate(cursor.getDate() + 1)
      dias++
    }
  }
  return Object.values(mapa).map(v => ({
    label: fmtMesAno(v.date),
    valor: Math.round(v.intensidades.reduce((a, b) => a + b, 0) / v.intensidades.length),
  }))
}

function Periodizacao({ client, showToast }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    objetivo: '', duracao_semanas: 12,
    data_inicio: new Date().toISOString().split('T')[0],
    mesos: []
  })

  useEffect(() => { fetchPeriod() }, [client])

  async function fetchPeriod() {
    setLoading(true)
    const { data: d } = await supabase.from('periodizacao').select('*').eq('cliente_id', client.id).eq('personal_id', user.id).maybeSingle()
    setData(d || null)
    if (d) setForm({
      objetivo: d.macro?.objetivo || '',
      duracao_semanas: d.macro?.duracao_semanas || 12,
      data_inicio: d.macro?.data_inicio || new Date().toISOString().split('T')[0],
      mesos: d.mesos || []
    })
    setLoading(false)
  }

  function addMeso() {
    setForm(f => ({ ...f, mesos: [...f.mesos, { fase: 'Hipertrofia', semanas: 4, obs: '', intensidade: 75 }] }))
  }
  function updateMeso(i, k, v) {
    setForm(f => ({ ...f, mesos: f.mesos.map((m, idx) => idx === i ? { ...m, [k]: v } : m) }))
  }
  function removeMeso(i) {
    setForm(f => ({ ...f, mesos: f.mesos.filter((_, idx) => idx !== i) }))
  }

  async function salvar() {
    setSaving(true)
    try {
      const totalSemanas = form.mesos.reduce((acc, m) => acc + (parseInt(m.semanas) || 0), 0)
      const payload = {
        cliente_id: client.id,
        personal_id: user.id,
        macro: {
          objetivo: form.objetivo,
          duracao_semanas: totalSemanas || form.duracao_semanas,
          data_inicio: form.data_inicio,
        },
        mesos: form.mesos,
        updated_at: new Date().toISOString(),
      }
      if (data?.id) {
        await supabase.from('periodizacao').update(payload).eq('id', data.id)
      } else {
        await supabase.from('periodizacao').insert(payload)
      }
      showToast('Periodização salva!')
      setEditing(false)
      fetchPeriod()
    } catch { showToast('Erro ao salvar') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  // ── Formulário de edição ──
  if (editing) return (
    <div>
      <p style={{ fontSize: 15, fontWeight: 700, color: C.tp, marginBottom: 16 }}>
        Periodização de {client.nome?.split(' ')[0]}
      </p>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Objetivo geral</label>
        <input value={form.objetivo} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))} placeholder="Ex: Hipertrofia com transição para força" style={IS} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Data de início</label>
          <input value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} type="date" style={IS} />
        </div>
      </div>

      <p style={{ fontSize: 13, fontWeight: 700, color: C.tp, marginBottom: 10 }}>Mesociclos</p>

      {form.mesos.map((m, i) => {
        const meta = FASE_META[m.fase] || FASE_META.Hipertrofia
        return (
          <div key={i} style={{ border: `1.5px solid ${meta.bg}`, borderRadius: 14, padding: 14, marginBottom: 10, background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{meta.emoji}</div>
                <p style={{ fontSize: 12, fontWeight: 700, color: C.ts }}>Bloco {i + 1}</p>
              </div>
              <button onClick={() => removeMeso(i)} style={{ background: 'none', border: 'none', color: C.red, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Remover</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 10, color: C.ts, display: 'block', marginBottom: 4 }}>Fase</label>
                <select value={m.fase} onChange={e => updateMeso(i, 'fase', e.target.value)} style={{ ...IS, appearance: 'none', fontSize: 13 }}>
                  {FASES.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: C.ts, display: 'block', marginBottom: 4 }}>Semanas</label>
                <input value={m.semanas} onChange={e => updateMeso(i, 'semanas', e.target.value)} type="number" min="1" max="16" style={{ ...IS, fontSize: 13 }} />
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, color: C.ts, display: 'block', marginBottom: 4 }}>Intensidade média (%)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="range" min="50" max="100" step="5"
                  value={m.intensidade || FASE_INTENSIDADE[m.fase] || 75}
                  onChange={e => updateMeso(i, 'intensidade', parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: meta.bar }}
                />
                <span style={{ fontSize: 13, fontWeight: 700, color: meta.tc, minWidth: 36 }}>
                  {m.intensidade || FASE_INTENSIDADE[m.fase] || 75}%
                </span>
              </div>
            </div>
            <input value={m.obs} onChange={e => updateMeso(i, 'obs', e.target.value)} placeholder="Observações (ex: foco em resistência)" style={{ ...IS, fontSize: 13 }} />
          </div>
        )
      })}

      <button onClick={addMeso} style={{ width: '100%', padding: '12px 0', borderRadius: 12, border: `1.5px dashed ${C.border}`, background: '#fff', color: C.ts, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>
        + Adicionar mesociclo
      </button>

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn variant="secondary" onClick={() => setEditing(false)} style={{ flex: 1 }}>Cancelar</Btn>
        <Btn onClick={salvar} disabled={saving} style={{ flex: 2 }}>{saving ? 'Salvando...' : 'Salvar periodização'}</Btn>
      </div>
    </div>
  )

  // ── Estado vazio ──
  if (!data) return (
    <div style={{ textAlign: 'center', padding: '40px 20px', border: `1.5px dashed ${C.border}`, borderRadius: 14 }}>
      <p style={{ fontSize: 28, marginBottom: 8 }}>📆</p>
      <p style={{ fontSize: 14, fontWeight: 600, color: C.tp, marginBottom: 4 }}>Sem periodização</p>
      <p style={{ fontSize: 12, color: C.ts, marginBottom: 16 }}>Crie um plano macro + mesociclos</p>
      <Btn onClick={() => setEditing(true)}>Criar periodização</Btn>
    </div>
  )

  // ── Visualização rica ──
  const mesos = data.mesos || []
  const dataInicio = data.macro?.data_inicio
  const mesoDates = calcMesoDates(dataInicio, mesos)
  const dataFim = mesoDates.length > 0 ? mesoDates[mesoDates.length - 1].fim : null
  const totalSemanas = mesos.reduce((acc, m) => acc + (parseInt(m.semanas) || 0), 0)
  const intensidadePorMes = calcIntensidadePorMes(dataInicio, mesos)
  const maxIntens = Math.max(...intensidadePorMes.map(x => x.valor), 1)

  // Linha do tempo proporcional
  const timelineSegs = mesos.map((m, i) => ({
    pct: ((parseInt(m.semanas) || 4) / totalSemanas) * 100,
    meta: FASE_META[m.fase] || FASE_META.Hipertrofia,
    fase: m.fase,
    idx: i,
  }))

  // Hoje na timeline
  const hoje = new Date()
  let hojePct = null
  if (dataInicio && dataFim) {
    const base = new Date(dataInicio + 'T00:00:00')
    const totalDias = (dataFim - base) / (1000 * 60 * 60 * 24)
    const diasPassados = (hoje - base) / (1000 * 60 * 60 * 24)
    if (diasPassados >= 0 && diasPassados <= totalDias) {
      hojePct = (diasPassados / totalDias) * 100
    }
  }

  return (
    <div>

      {/* Card Macrociclo */}
      <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, background: '#fff', padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>📅</span>
            <p style={{ fontSize: 15, fontWeight: 700, color: C.tp }}>Macrociclo {dataInicio ? new Date(dataInicio + 'T00:00:00').getFullYear() : ''}</p>
          </div>
          <button onClick={() => setEditing(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px', fontSize: 12, color: C.ts, cursor: 'pointer', fontFamily: 'inherit' }}>
            ✏️ Editar
          </button>
        </div>

        {dataInicio && dataFim && (
          <p style={{ fontSize: 12, color: C.ts, marginBottom: 2 }}>
            {fmtMes(new Date(dataInicio + 'T00:00:00'))} → {fmtMes(dataFim)} · {totalSemanas} semanas
          </p>
        )}
        {data.macro?.objetivo && (
          <p style={{ fontSize: 12, color: C.gd, fontWeight: 500, marginBottom: 12 }}>
            🎯 {data.macro.objetivo}
          </p>
        )}

        {/* Linha do tempo visual */}
        {totalSemanas > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: C.ts, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Linha do tempo</p>
            <div style={{ position: 'relative', height: 20, borderRadius: 10, overflow: 'visible', display: 'flex', marginBottom: 20 }}>
              {timelineSegs.map((seg, i) => (
                <div key={i} style={{
                  width: `${seg.pct}%`,
                  background: seg.meta.bar,
                  opacity: 0.85,
                  borderRadius: i === 0 ? '10px 0 0 10px' : i === timelineSegs.length - 1 ? '0 10px 10px 0' : 0,
                  position: 'relative',
                }} />
              ))}
              {/* Marcador de hoje */}
              {hojePct !== null && (
                <div style={{ position: 'absolute', left: `${hojePct}%`, top: -4, bottom: -4, width: 2, background: C.tp, borderRadius: 2, zIndex: 2 }}>
                  <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', background: C.tp, color: '#fff', fontSize: 9, padding: '2px 5px', borderRadius: 4, whiteSpace: 'nowrap' }}>hoje</div>
                </div>
              )}
            </div>

            {/* Labels dos marcos */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {mesoDates.filter((_, i) => i === 0 || i === Math.floor(mesos.length / 2) || i === mesos.length - 1).map((d, i, arr) => (
                <p key={i} style={{ fontSize: 10, color: C.tt, textAlign: i === arr.length - 1 ? 'right' : i === 0 ? 'left' : 'center' }}>
                  {fmtMes(i === 0 ? d.inicio : i === arr.length - 1 ? d.fim : d.inicio)}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gráfico de intensidade */}
      {intensidadePorMes.length > 0 && (
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 16, background: '#fff', padding: 16, marginBottom: 14 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: C.ts, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 4 }}>Intensidade ao longo do tempo</p>
          <p style={{ fontSize: 11, color: C.tt, marginBottom: 14 }}>Média (%) por mês</p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, overflowX: 'auto', paddingBottom: 4 }}>
            {intensidadePorMes.map((mes, i) => {
              const pctH = (mes.valor / 100) * 70
              const isAtivo = hojePct !== null && (() => {
                const totalMeses = intensidadePorMes.length
                const idxAtivo = Math.floor((hojePct / 100) * totalMeses)
                return i === idxAtivo
              })()
              return (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 38, flex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: isAtivo ? C.tp : C.ts }}>{mes.valor}%</p>
                  <div style={{
                    width: '100%', height: pctH + 10,
                    background: isAtivo ? C.green : C.gl,
                    borderRadius: '5px 5px 0 0',
                    border: isAtivo ? `1.5px solid ${C.gd}` : 'none',
                    transition: 'height 0.3s',
                  }} />
                  <p style={{ fontSize: 10, color: C.tt, whiteSpace: 'nowrap' }}>{mes.label}</p>
                </div>
              )
            })}
          </div>

          {/* Legenda */}
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            {[...new Set(mesos.map(m => m.fase))].map(fase => {
              const meta = FASE_META[fase] || FASE_META.Hipertrofia
              return (
                <div key={fase} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: meta.bar }} />
                  <span style={{ fontSize: 10, color: C.ts }}>{meta.emoji} {fase}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Mesociclos */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: C.ts, textTransform: 'uppercase', letterSpacing: 0.5 }}>Mesociclos ({mesos.length})</p>
        <button onClick={() => setEditing(true)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '5px 10px', fontSize: 11, color: C.ts, cursor: 'pointer', fontFamily: 'inherit' }}>+ Novo</button>
      </div>

      {mesos.length === 0 ? (
        <p style={{ fontSize: 13, color: C.ts }}>Nenhum mesociclo ainda.</p>
      ) : mesos.map((m, i) => {
        const meta = FASE_META[m.fase] || FASE_META.Hipertrofia
        const datas = mesoDates[i]
        return (
          <div key={i} style={{ border: `1px solid ${C.border}`, borderRadius: 14, padding: 14, marginBottom: 8, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {meta.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.tp }}>Bloco {i + 1} — {m.fase}</p>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 20, background: meta.bg, color: meta.tc, fontWeight: 600 }}>{m.fase}</span>
                </div>
                {datas && (
                  <p style={{ fontSize: 11, color: C.ts }}>
                    {fmtMes(datas.inicio)} → {fmtMes(datas.fim)} · {m.semanas} sem.
                  </p>
                )}
              </div>
              <span style={{ color: C.tt, fontSize: 18 }}>›</span>
            </div>
            {m.obs && (
              <p style={{ fontSize: 12, color: C.ts, marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>{m.obs}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Medidas ─────────────────────────────────────────────────────────────────
const CIRC_CAMPOS = ['Pescoço','Ombro','Peitoral','Cintura','Abdômen','Quadril','Coxa D','Coxa E','Panturrilha D','Panturrilha E','Braço D','Braço E','Antebraço D','Antebraço E']
const DOBRAS_CAMPOS = ['Tricipital','Subescapular','Peitoral','Axilar Média','Supra-ilíaca','Abdominal','Coxa']

function Medidas({ client, showToast }) {
  const { user } = useAuth()
  const [medidas, setMedidas] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNova, setShowNova] = useState(false)
  const [viewing, setViewing] = useState(null)
  const [tipo, setTipo] = useState('circunferencias')
  const [dataMed, setDataMed] = useState(new Date().toISOString().split('T')[0])
  const [peso, setPeso] = useState('')
  const [altura, setAltura] = useState('')
  const [dados, setDados] = useState({})
  const [obs, setObs] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchMedidas() }, [client])

  async function fetchMedidas() {
    setLoading(true)
    const { data } = await supabase.from('medidas').select('*').eq('cliente_id', client.id).eq('personal_id', user.id).order('data', { ascending: false })
    setMedidas(data || [])
    setLoading(false)
  }

  async function salvar() {
    setSaving(true)
    try {
      const { error } = await supabase.from('medidas').insert({
        cliente_id: client.id,
        personal_id: user.id,
        tipo,
        data: dataMed,
        dados: { ...dados, peso, altura },
        obs,
      })
      if (error) throw error
      showToast('Medidas salvas!')
      setShowNova(false); setDados({}); setPeso(''); setAltura(''); setObs('')
      fetchMedidas()
    } catch { showToast('Erro ao salvar medidas') }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />

  if (viewing) {
    const m = medidas.find(x => x.id === viewing)
    const campos = m.tipo === 'circunferencias' ? CIRC_CAMPOS : DOBRAS_CAMPOS
    return (
      <div>
        <button onClick={() => setViewing(null)} style={{ background: 'none', border: 'none', color: C.green, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginBottom: 16, padding: 0 }}>← Medidas</button>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.tp, marginBottom: 2 }}>{m.tipo === 'circunferencias' ? 'Circunferências' : '7 Dobras'}</p>
        <p style={{ fontSize: 12, color: C.ts, marginBottom: 16 }}>{fmtData(m.data)}</p>
        {(m.dados?.peso || m.dados?.altura) && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            {m.dados.peso && <div style={{ flex: 1, background: C.gl, borderRadius: 10, padding: '12px', textAlign: 'center' }}><p style={{ fontSize: 10, color: C.ts }}>Peso</p><p style={{ fontSize: 18, fontWeight: 800, color: C.green }}>{m.dados.peso} kg</p></div>}
            {m.dados.altura && <div style={{ flex: 1, background: '#E6F1FB', borderRadius: 10, padding: '12px', textAlign: 'center' }}><p style={{ fontSize: 10, color: C.ts }}>Altura</p><p style={{ fontSize: 18, fontWeight: 800, color: C.blue }}>{m.dados.altura} cm</p></div>}
          </div>
        )}
        {campos.map(c => m.dados?.[c] ? (
          <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${C.border}`, background: '#fff' }}>
            <p style={{ fontSize: 13, color: C.ts }}>{c}</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.tp }}>{m.dados[c]} {m.tipo === 'circunferencias' ? 'cm' : 'mm'}</p>
          </div>
        ) : null)}
        {m.obs && <p style={{ fontSize: 12, color: C.ts, marginTop: 16, fontStyle: 'italic' }}>{m.obs}</p>}
      </div>
    )
  }

  if (showNova) {
    const campos = tipo === 'circunferencias' ? CIRC_CAMPOS : DOBRAS_CAMPOS
    const unidade = tipo === 'circunferencias' ? 'cm' : 'mm'
    return (
      <div>
        <button onClick={() => setShowNova(false)} style={{ background: 'none', border: 'none', color: C.green, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600, marginBottom: 16, padding: 0 }}>← Voltar</button>
        <p style={{ fontSize: 15, fontWeight: 700, color: C.tp, marginBottom: 16 }}>Nova avaliação</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['circunferencias','7dobras'].map(t => (
            <button key={t} onClick={() => setTipo(t)} style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: `1.5px solid ${tipo===t ? C.green : C.border}`, background: tipo===t ? C.gl : '#fff', color: tipo===t ? C.gd : C.ts, fontSize: 13, fontWeight: tipo===t ? 700 : 400, cursor: 'pointer', fontFamily: 'inherit' }}>
              {t === 'circunferencias' ? '📏 Circunferências' : '🔢 7 Dobras'}
            </button>
          ))}
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Data</label>
          <input value={dataMed} onChange={e => setDataMed(e.target.value)} type="date" style={IS} />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Peso (kg)</label>
            <input value={peso} onChange={e => setPeso(e.target.value)} placeholder="75.5" type="number" step="0.1" style={IS} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Altura (cm)</label>
            <input value={altura} onChange={e => setAltura(e.target.value)} placeholder="170" type="number" style={IS} />
          </div>
        </div>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.ts, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Medidas em {unidade}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {campos.map(c => (
            <div key={c}>
              <label style={{ fontSize: 10, color: C.ts, display: 'block', marginBottom: 4 }}>{c}</label>
              <input value={dados[c] || ''} onChange={e => setDados(d => ({ ...d, [c]: e.target.value }))} placeholder="0" type="number" step="0.1" style={{ ...IS, fontSize: 13, padding: '10px 12px' }} />
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Observações</label>
          <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} style={{ ...IS, resize: 'none' }} />
        </div>
        <Btn onClick={salvar} disabled={saving} fullWidth style={{ padding: '14px 0', fontSize: 16 }}>
          {saving ? 'Salvando...' : 'Salvar medidas'}
        </Btn>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 13, color: C.ts }}>{medidas.length} avaliação{medidas.length !== 1 ? 'ões' : ''}</p>
        <Btn onClick={() => setShowNova(true)} style={{ padding: '7px 12px', fontSize: 12 }}>+ Nova medida</Btn>
      </div>
      {medidas.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', border: `1.5px dashed ${C.border}`, borderRadius: 14 }}>
          <p style={{ fontSize: 28, marginBottom: 8 }}>📏</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.tp, marginBottom: 4 }}>Nenhuma medida ainda</p>
          <p style={{ fontSize: 12, color: C.ts }}>Registre circunferências ou 7 dobras</p>
        </div>
      ) : medidas.map((m, i) => {
        const prev = medidas[i + 1]
        const difPeso = m.dados?.peso && prev?.dados?.peso ? (parseFloat(m.dados.peso) - parseFloat(prev.dados.peso)).toFixed(1) : null
        return (
          <div key={m.id} onClick={() => setViewing(m.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: `1px solid ${C.border}`, borderRadius: 14, marginBottom: 8, background: '#fff', cursor: 'pointer' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: m.tipo === 'circunferencias' ? '#E6F1FB' : C.gl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
              {m.tipo === 'circunferencias' ? '📏' : '🔢'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.tp }}>{m.tipo === 'circunferencias' ? 'Circunferências' : '7 Dobras'}</p>
              <p style={{ fontSize: 11, color: C.ts }}>{fmtData(m.data)}{m.dados?.peso ? ` · ${m.dados.peso} kg` : ''}</p>
            </div>
            {difPeso !== null && (
              <span style={{ fontSize: 12, fontWeight: 700, color: parseFloat(difPeso) < 0 ? C.green : C.red }}>
                {parseFloat(difPeso) > 0 ? '+' : ''}{difPeso} kg
              </span>
            )}
            <span style={{ color: C.tt, fontSize: 18 }}>›</span>
          </div>
        )
      })}
    </div>
  )
}
