import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { C, IS } from '../../lib/tokens'
import { Btn, Spinner } from '../UI'

const TIPOS = ['Musculação','Funcional','Avaliação','Cardio','Pilates','Outro']

function Toggle({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
        background: value ? C.green : '#D1D5DB',
        position: 'relative', transition: 'background .2s', flexShrink: 0
      }}
    >
      <div style={{
        position: 'absolute', top: 2,
        left: value ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%',
        background: '#fff', transition: 'left .2s',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)'
      }} />
    </div>
  )
}

export default function NovoCompromissoTab({ showToast, goToAgenda }) {
  const { user } = useAuth()
  const [clientes, setClientes] = useState([])
  const [clientesSel, setClientesSel] = useState([])
  const [tipo, setTipo] = useState('Musculação')
  const [local, setLocal] = useState('')
  const [data, setData] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFim, setHoraFim] = useState('')
  const [obs, setObs] = useState('')
  const [syncGoogle, setSyncGoogle] = useState(true)
  const [syncOutlook, setSyncOutlook] = useState(true)
  const [syncInterna, setSyncInterna] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingC, setLoadingC] = useState(true)

  useEffect(() => { fetchClientes() }, [user])

  async function fetchClientes() {
    if (!user) return
    const { data: d } = await supabase
      .from('profiles').select('id,nome')
      .eq('personal_id', user.id).eq('role', 'cliente').order('nome')
    setClientes(d || [])
    setLoadingC(false)
  }

  function toggleCliente(id) {
    setClientesSel(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function salvar() {
    if (!data || !horaInicio) { showToast('Preencha data e horário'); return }
    setLoading(true)
    try {
      const dataHora = new Date(`${data}T${horaInicio}`).toISOString()
      const inserts = clientesSel.length > 0
        ? clientesSel.map(cid => ({
            personal_id: user.id,
            cliente_id: cid,
            titulo: tipo,
            tipo,
            local: local || null,
            data_hora: dataHora,
            hora_fim: horaFim || null,
            observacoes: obs,
            status: 'agendado',
            sync_google: syncGoogle,
            sync_outlook: syncOutlook,
          }))
        : [{
            personal_id: user.id,
            cliente_id: null,
            titulo: tipo,
            tipo,
            local: local || null,
            data_hora: dataHora,
            hora_fim: horaFim || null,
            observacoes: obs,
            status: 'agendado',
            sync_google: syncGoogle,
            sync_outlook: syncOutlook,
          }]

      const { error } = await supabase.from('compromissos').insert(inserts)
      if (error) throw error

      showToast(clientesSel.length > 1
        ? `Compromisso criado para ${clientesSel.length} clientes!`
        : 'Compromisso criado!')

      setClientesSel([])
      setLocal('')
      setData('')
      setHoraInicio('')
      setHoraFim('')
      setObs('')
      setTipo('Musculação')
      goToAgenda && goToAgenda()
    } catch (e) {
      showToast('Erro ao criar compromisso')
    } finally {
      setLoading(false)
    }
  }

  if (loadingC) return <Spinner />

  const secStyle = {
    background: '#fff', border: `1px solid ${C.border}`,
    borderRadius: 14, padding: 16, marginBottom: 14
  }
  const secLabel = {
    fontSize: 11, fontWeight: 700, color: C.ts,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14
  }

  return (
    <div>

      {/* ── DETALHES DO TREINO ── */}
      <div style={secStyle}>
        <p style={secLabel}>Detalhes do Treino</p>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Tipo</label>
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            style={{ ...IS, appearance: 'none' }}
          >
            {TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Local</label>
          <input
            value={local}
            onChange={e => setLocal(e.target.value)}
            placeholder="Academia..."
            style={IS}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Data</label>
            <input value={data} onChange={e => setData(e.target.value)} type="date" style={IS} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Horário início</label>
            <input value={horaInicio} onChange={e => setHoraInicio(e.target.value)} type="time" style={IS} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Horário fim</label>
            <input value={horaFim} onChange={e => setHoraFim(e.target.value)} type="time" style={IS} />
          </div>
        </div>

        {obs !== undefined && (
          <div style={{ marginTop: 12 }}>
            <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Obs.</label>
            <textarea
              value={obs}
              onChange={e => setObs(e.target.value)}
              placeholder="Foco, restrições..."
              rows={2}
              style={{ ...IS, resize: 'none' }}
            />
          </div>
        )}
      </div>

      {/* ── CLIENTES ── */}
      {clientes.length > 0 && (
        <div style={secStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={{ ...secLabel, marginBottom: 0 }}>Clientes</p>
            {clientesSel.length > 0 && (
              <span style={{ fontSize: 11, color: C.gd, fontWeight: 600, background: C.gl, padding: '2px 8px', borderRadius: 10 }}>
                {clientesSel.length} selecionado{clientesSel.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {clientes.map(c => {
            const sel = clientesSel.includes(c.id)
            const initials = (c.nome || '??').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            return (
              <div
                key={c.id}
                onClick={() => toggleCliente(c.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 12px', borderRadius: 10, marginBottom: 8,
                  border: `1.5px solid ${sel ? C.green : C.border}`,
                  background: sel ? C.gl : '#FAFAFA',
                  cursor: 'pointer', transition: 'all .15s'
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 20, height: 20, borderRadius: 5,
                  border: `2px solid ${sel ? C.green : C.border}`,
                  background: sel ? C.green : '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'all .15s'
                }}>
                  {sel && <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, lineHeight: 1 }}>✓</span>}
                </div>
                {/* Avatar */}
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: sel ? C.gd : '#C4C4C4',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
                }}>
                  {initials}
                </div>
                <p style={{ fontSize: 14, fontWeight: sel ? 600 : 400, color: sel ? C.gd : C.tp }}>
                  {c.nome}
                </p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── SINCRONIZAÇÃO ── */}
      <div style={secStyle}>
        <p style={secLabel}>Sincronização</p>

        {[
          { label: 'Google Calendar', icon: '🔵', value: syncGoogle, set: setSyncGoogle },
          { label: 'Outlook Calendar', icon: '🔷', value: syncOutlook, set: setSyncOutlook },
          { label: 'Agenda interna', icon: '📅', value: syncInterna, set: setSyncInterna },
        ].map(({ label, icon, value, set }) => (
          <div
            key={label}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: label !== 'Agenda interna' ? `1px solid ${C.border}` : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <p style={{ fontSize: 14, color: C.tp, fontWeight: 500 }}>{label}</p>
            </div>
            <Toggle value={value} onChange={set} />
          </div>
        ))}
      </div>

      {/* ── BOTÕES ── */}
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          onClick={goToAgenda}
          style={{
            flex: 1, padding: '14px 0', borderRadius: 12,
            border: `1px solid ${C.border}`, background: '#fff',
            color: C.tp, fontSize: 14, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit'
          }}
        >
          Cancelar
        </button>
        <Btn
          onClick={salvar}
          disabled={loading || !data || !horaInicio}
          style={{ flex: 2, padding: '14px 0', fontSize: 14 }}
        >
          {loading ? 'Criando...' : 'Criar e enviar ↗'}
        </Btn>
      </div>
    </div>
  )
}
