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
{ id: 'fichas', lbl: '📋 Fichas' },
{ id: 'period', lbl: '📆 Period.' },
{ id: 'medidas', lbl: '📏 Medidas' },
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

{aba === 'fichas' && <FichasCliente client={client} showToast={showToast} />}
{aba === 'period' && <Periodizacao client={client} showToast={showToast} />}
{aba === 'medidas' && <Medidas client={client} showToast={showToast} />}
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
{ex.reps && <span style={{ background: '#E6F1FB', color: C.blue, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{ex.reps} reps</span>}
{ex.carga && <span style={{ background: '#FAEEDA', color: C.amber, padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{ex.carga} kg</span>}
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

const FASE_CONFIG = {
  'Adaptação':   { bg: '#E6F1FB', tc: '#1A6FB5', emoji: '🌱', intBase: 55 },
  'Hipertrofia': { bg: '#EAFAF0', tc: '#1A7A40', emoji: '💪', intBase: 72 },
  'Força':       { bg: '#FAEEDA', tc: '#B86A00', emoji: '🏋️', intBase: 85 },
  'Potência':    { bg: '#FAECE7', tc: '#993C1D', emoji: '⚡', intBase: 90 },
  'Manutenção':  { bg: '#F5F4F0', tc: '#555', emoji: '🔄', intBase: 60 },
  'Definição':   { bg: '#EEEDFE', tc: '#3C3489', emoji: '🔥', intBase: 68 },
}

function addWeeks(dateStr, weeks) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().split('T')[0]
}

function Periodizacao({ client, showToast }) {
const { user } = useAuth()
const [data, setData] = useState(null)
const [loading, setLoading] = useState(true)
const [editing, setEditing] = useState(false)
const [saving, setSaving] = useState(false)
const [form, setForm] = useState({
  titulo: '',
  objetivo: '',
  data_inicio: new Date().toISOString().split('T')[0],
  mesos: []
})

useEffect(() => { fetchPeriod() }, [client])

async function fetchPeriod() {
setLoading(true)
const { data: d } = await supabase.from('periodizacao').select('*').eq('cliente_id', client.id).eq('personal_id', user.id).maybeSingle()
setData(d || null)
if (d) setForm({
  titulo: d.macro?.titulo || '',
  objetivo: d.macro?.objetivo || '',
  data_inicio: d.macro?.data_inicio || new Date().toISOString().split('T')[0],
  mesos: d.mesos || []
})
setLoading(false)
}

function addMeso() {
setForm(f => ({ ...f, mesos: [...f.mesos, { fase: 'Hipertrofia', semanas: 4, intensidade: 72, obs: '' }] }))
}
function updateMeso(i, k, v) {
setForm(f => ({ ...f, mesos: f.mesos.map((m, idx) => idx === i ? { ...m, [k]: v } : m) }))
}
function removeMeso(i) {
setForm(f => ({ ...f, mesos: f.mesos.filter((_, idx) => idx !== i) }))
}

const totalSemanas = form.mesos.reduce((s, m) => s + Number(m.semanas || 0), 0)

async function salvar() {
setSaving(true)
try {
const payload = {
  cliente_id: client.id,
  personal_id: user.id,
  macro: {
    titulo: form.titulo,
    objetivo: form.objetivo,
    data_inicio: form.data_inicio,
    duracao_semanas: totalSemanas
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

// ── FORMULÁRIO ──
if (editing) return (
<div>
<p style={{ fontSize: 15, fontWeight: 700, color: C.tp, marginBottom: 16 }}>
  {data ? 'Editar' : 'Nova'} Periodização
</p>

<div style={{ marginBottom: 12 }}>
  <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Título do plano</label>
  <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Plano 2026 — Hipertrofia" style={IS} />
</div>

<div style={{ marginBottom: 12 }}>
  <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Objetivo geral</label>
  <input value={form.objetivo} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))} placeholder="Ex: Ganho de massa + definição" style={IS} />
</div>

<div style={{ marginBottom: 20 }}>
  <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Data de início</label>
  <input value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} type="date" style={IS} />
</div>

<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
  <p style={{ fontSize: 13, fontWeight: 700, color: C.tp }}>Mesociclos</p>
  <span style={{ fontSize: 12, color: C.ts }}>{totalSemanas} semanas no total</span>
</div>

{form.mesos.map((m, i) => {
  const cfg = FASE_CONFIG[m.fase] || FASE_CONFIG['Hipertrofia']
  return (
    <div key={i} style={{ border: `1.5px solid ${cfg.tc}22`, borderRadius: 12, padding: 14, marginBottom: 10, background: cfg.bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: cfg.tc }}>{cfg.emoji} Meso {i + 1}</p>
        <button onClick={() => removeMeso(i)} style={{ background: 'none', border: 'none', color: C.red, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>Remover</button>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 2 }}>
          <label style={{ fontSize: 10, color: C.ts, display: 'block', marginBottom: 4 }}>Fase</label>
          <select value={m.fase} onChange={e => {
            const nova = e.target.value
            updateMeso(i, 'fase', nova)
            updateMeso(i, 'intensidade', FASE_CONFIG[nova]?.intBase || 70)
          }} style={{ ...IS, appearance: 'none', fontSize: 13 }}>
            {FASES.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, color: C.ts, display: 'block', marginBottom: 4 }}>Semanas</label>
          <input value={m.semanas} onChange={e => updateMeso(i, 'semanas', e.target.value)} type="number" min="1" max="16" style={{ ...IS, fontSize: 13 }} />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <label style={{ fontSize: 10, color: C.ts }}>Intensidade</label>
          <span style={{ fontSize: 11, fontWeight: 700, color: cfg.tc }}>{m.intensidade || cfg.intBase}%</span>
        </div>
        <input
          type="range" min="50" max="100"
          value={m.intensidade || cfg.intBase}
          onChange={e => updateMeso(i, 'intensidade', Number(e.target.value))}
          style={{ width: '100%', accentColor: cfg.tc }}
        />
      </div>

      <input value={m.obs} onChange={e => updateMeso(i, 'obs', e.target.value)} placeholder="Observações do meso" style={{ ...IS, background: '#fff' }} />
    </div>
  )
})}

<button onClick={addMeso} style={{ width: '100%', padding: '10px 0', borderRadius: 10, border: `1.5px dashed ${C.border}`, background: '#fff', color: C.ts, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 20 }}>
  + Adicionar mesociclo
</button>

<div style={{ display: 'flex', gap: 8 }}>
  <Btn variant="secondary" onClick={() => setEditing(false)} style={{ flex: 1 }}>Cancelar</Btn>
  <Btn onClick={salvar} disabled={saving} style={{ flex: 2 }}>{saving ? 'Salvando...' : 'Salvar periodização'}</Btn>
</div>
</div>
)

// ── ESTADO VAZIO ──
if (!data) return (
<div style={{ textAlign: 'center', padding: '40px 20px', border: `1.5px dashed ${C.border}`, borderRadius: 14 }}>
<p style={{ fontSize: 28, marginBottom: 8 }}>📆</p>
<p style={{ fontSize: 14, fontWeight: 600, color: C.tp, marginBottom: 4 }}>Sem periodização</p>
<p style={{ fontSize: 12, color: C.ts, marginBottom: 16 }}>Crie um plano macro + mesociclos</p>
<Btn onClick={() => setEditing(true)}>Criar periodização</Btn>
</div>
)

// ── VISUALIZAÇÃO ──
const mesos = data.mesos || []
const dataInicio = data.macro?.data_inicio
const totalSem = data.macro?.duracao_semanas || mesos.reduce((s, m) => s + Number(m.semanas || 0), 0)
const dataFim = dataInicio ? addWeeks(dataInicio, totalSem) : null

// Calcula datas de cada meso
let cursor = dataInicio
const mesosComDatas = mesos.map((m, i) => {
  const inicio = cursor
  const fim = cursor ? addWeeks(cursor, Number(m.semanas)) : null
  if (cursor) cursor = fim
  return { ...m, inicio, fim, idx: i }
})

// Hoje
const hoje = new Date()
const hojeStr = hoje.toISOString().split('T')[0]

// Progresso na linha do tempo
function pctTimeline(dateStr) {
  if (!dataInicio || !dataFim) return 0
  const start = new Date(dataInicio).getTime()
  const end = new Date(dataFim).getTime()
  const now = new Date(dateStr).getTime()
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100))
}
const hojePosPct = pctTimeline(hojeStr)
const isOngoing = dataInicio && dataFim && hojeStr >= dataInicio && hojeStr <= dataFim

// Gráfico intensidade por mês
const mesesGraf = []
if (dataInicio && mesosComDatas.length > 0) {
  const startMs = new Date(dataInicio)
  const endMs = dataFim ? new Date(dataFim) : new Date(addWeeks(dataInicio, totalSem || 4))
  let cur = new Date(startMs.getFullYear(), startMs.getMonth(), 1)
  while (cur <= endMs) {
    const label = MESES[cur.getMonth()]
    // Qual meso está ativo nesse mês?
    const mesAtivo = mesosComDatas.find(m => {
      if (!m.inicio || !m.fim) return false
      return cur >= new Date(m.inicio) && cur < new Date(m.fim)
    })
    const intensidade = mesAtivo ? (mesAtivo.intensidade || FASE_CONFIG[mesAtivo.fase]?.intBase || 70) : 0
    const isHoje = cur.getMonth() === hoje.getMonth() && cur.getFullYear() === hoje.getFullYear()
    const fase = mesAtivo?.fase || null
    mesesGraf.push({ label, intensidade, isHoje, fase })
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1)
    if (mesesGraf.length > 14) break
  }
}
const maxInt = Math.max(...mesesGraf.map(m => m.intensidade), 80)

return (
<div>

  {/* ── Card Macrociclo ── */}
  <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <div>
        <p style={{ fontSize: 16, fontWeight: 800, color: C.tp, marginBottom: 2 }}>
          {data.macro?.titulo || `Macrociclo ${new Date(dataInicio || Date.now()).getFullYear()}`}
        </p>
        {dataInicio && dataFim && (
          <p style={{ fontSize: 12, color: C.ts }}>
            {fmtData(dataInicio)} → {fmtData(dataFim)}
            <span style={{ marginLeft: 6, fontWeight: 600, color: C.tp }}>{totalSem} sem.</span>
          </p>
        )}
        {data.macro?.objetivo && (
          <p style={{ fontSize: 12, color: C.gd, fontWeight: 600, marginTop: 4 }}>🎯 {data.macro.objetivo}</p>
        )}
      </div>
      <button onClick={() => setEditing(true)} style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, color: C.ts, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>✏️ Editar</button>
    </div>

    {/* Linha do tempo */}
    {mesos.length > 0 && (
      <div style={{ marginTop: 8 }}>
        <div style={{ position: 'relative', height: 28, borderRadius: 8, overflow: 'hidden', display: 'flex', background: C.border }}>
          {mesosComDatas.map((m, i) => {
            const pct = (Number(m.semanas) / totalSem) * 100
            const cfg = FASE_CONFIG[m.fase] || FASE_CONFIG['Hipertrofia']
            return (
              <div key={i} title={`Meso ${i+1}: ${m.fase} (${m.semanas} sem)`} style={{
                width: `${pct}%`, height: '100%', background: cfg.tc,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: '#fff', fontWeight: 700,
                borderRight: i < mesos.length - 1 ? '2px solid #fff' : 'none',
                overflow: 'hidden', whiteSpace: 'nowrap',
              }}>
                {pct > 8 ? `${cfg.emoji}` : ''}
              </div>
            )
          })}
          {/* Marcador hoje */}
          {isOngoing && (
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: `${hojePosPct}%`,
              width: 2, background: '#fff', boxShadow: '0 0 4px rgba(0,0,0,.4)',
              zIndex: 2
            }}>
              <div style={{ position: 'absolute', top: -16, left: -12, background: C.tp, color: '#fff', fontSize: 8, padding: '2px 4px', borderRadius: 4, whiteSpace: 'nowrap', fontWeight: 700 }}>HOJE</div>
            </div>
          )}
        </div>

        {/* Legenda fases */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          {[...new Set(mesos.map(m => m.fase))].map(fase => {
            const cfg = FASE_CONFIG[fase] || {}
            return (
              <div key={fase} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: cfg.tc }} />
                <span style={{ fontSize: 10, color: C.ts }}>{fase}</span>
              </div>
            )
          })}
        </div>
      </div>
    )}
  </div>

  {/* ── Gráfico de Intensidade ── */}
  {mesesGraf.length > 0 && (
    <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 16, marginBottom: 14 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: C.ts, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Intensidade por mês</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 72 }}>
        {mesesGraf.map((m, i) => {
          const h = m.intensidade > 0 ? Math.max(12, (m.intensidade / maxInt) * 64) : 4
          const cfg = m.fase ? (FASE_CONFIG[m.fase] || {}) : {}
          const barColor = m.isHoje ? C.gd : (cfg.tc || C.border)
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {m.isHoje && <span style={{ fontSize: 7, fontWeight: 700, color: C.gd, marginBottom: -2 }}>{m.intensidade}%</span>}
              <div style={{ width: '100%', height: h, borderRadius: 4, background: m.intensidade > 0 ? barColor : C.border, opacity: m.isHoje ? 1 : 0.7 }} />
              <span style={{ fontSize: 8, color: m.isHoje ? C.gd : C.ts, fontWeight: m.isHoje ? 700 : 400 }}>{m.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )}

  {/* ── Mesociclos ── */}
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
    <p style={{ fontSize: 13, fontWeight: 700, color: C.tp }}>Mesociclos</p>
    <span style={{ fontSize: 12, color: C.ts }}>{mesos.length} bloco{mesos.length !== 1 ? 's' : ''}</span>
  </div>

  {mesos.length === 0 ? (
    <p style={{ fontSize: 13, color: C.ts }}>Nenhum mesociclo ainda.</p>
  ) : mesosComDatas.map((m, i) => {
    const cfg = FASE_CONFIG[m.fase] || FASE_CONFIG['Hipertrofia']
    const isAtual = isOngoing && m.inicio && m.fim && hojeStr >= m.inicio && hojeStr < m.fim
    return (
      <div key={i} style={{
        border: `1.5px solid ${isAtual ? cfg.tc : C.border}`,
        borderRadius: 14, padding: '14px 16px', marginBottom: 10,
        background: isAtual ? cfg.bg : '#fff',
        boxShadow: isAtual ? `0 2px 8px ${cfg.tc}22` : 'none'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 16 }}>{cfg.emoji}</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: cfg.tc }}>Bloco {i+1} — {m.fase}</p>
              {isAtual && <span style={{ fontSize: 10, background: cfg.tc, color: '#fff', padding: '2px 6px', borderRadius: 10, fontWeight: 700 }}>Atual</span>}
            </div>
            {m.inicio && m.fim && (
              <p style={{ fontSize: 11, color: C.ts }}>
                {fmtData(m.inicio)} → {fmtData(m.fim)}
              </p>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: cfg.tc }}>{m.semanas}</p>
            <p style={{ fontSize: 9, color: C.ts, textTransform: 'uppercase' }}>sem</p>
          </div>
        </div>

        {/* Barra de intensidade */}
        {m.intensidade && (
          <div style={{ marginTop: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: C.ts }}>Intensidade</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: cfg.tc }}>{m.intensidade}%</span>
            </div>
            <div style={{ height: 4, borderRadius: 4, background: `${cfg.tc}22`, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${m.intensidade}%`, background: cfg.tc, borderRadius: 4 }} />
            </div>
          </div>
        )}

        {m.obs && <p style={{ fontSize: 12, color: C.ts, marginTop: 8, fontStyle: 'italic' }}>{m.obs}</p>}
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
