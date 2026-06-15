import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { C, IS } from '../../lib/tokens'
import { Btn, Spinner } from '../UI'

const TIPOS = ['Treino','Avaliação','Consulta','Outro']

export default function NovoCompromissoTab({ showToast, goToAgenda }) {
  const { user } = useAuth()
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState('Treino')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingC, setLoadingC] = useState(true)

  useEffect(() => { fetchClientes() }, [user])

  async function fetchClientes() {
    if (!user) return
    const { data } = await supabase.from('profiles').select('id,nome').eq('personal_id', user.id).eq('role','cliente').order('nome')
    setClientes(data || [])
    setLoadingC(false)
  }

  async function salvar() {
    if (!data || !hora) { showToast('Preencha data e hora'); return }
    setLoading(true)
    try {
      const dataHora = new Date(`${data}T${hora}`).toISOString()
      const { error } = await supabase.from('compromissos').insert({
        personal_id: user.id,
        cliente_id: clienteId || null,
        titulo: titulo || tipo,
        tipo,
        data_hora: dataHora,
        observacoes: obs,
        status: 'agendado',
      })
      if (error) throw error
      showToast('Compromisso criado!')
      setClienteId(''); setTitulo(''); setData(''); setHora(''); setObs(''); setTipo('Treino')
      goToAgenda && goToAgenda()
    } catch(e) {
      showToast('Erro ao criar compromisso')
    } finally {
      setLoading(false)
    }
  }

  if (loadingC) return <Spinner />

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Tipo</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TIPOS.map(t => (
            <button key={t} onClick={() => setTipo(t)} style={{ padding: '8px 16px', borderRadius: 20, border: `1.5px solid ${tipo===t ? C.green : C.border}`, background: tipo===t ? C.gl : '#fff', color: tipo===t ? C.gd : C.ts, fontSize: 13, fontWeight: tipo===t ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {clientes.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Cliente (opcional)</label>
          <select value={clienteId} onChange={e => setClienteId(e.target.value)} style={{ ...IS, appearance: 'none' }}>
            <option value="">Nenhum</option>
            {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Título (opcional)</label>
        <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder={tipo} style={IS} />
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Data *</label>
          <input value={data} onChange={e => setData(e.target.value)} type="date" style={IS} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Hora *</label>
          <input value={hora} onChange={e => setHora(e.target.value)} type="time" style={IS} />
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Observações</label>
        <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Notas adicionais..." rows={3} style={{ ...IS, resize: 'none' }} />
      </div>

      <Btn onClick={salvar} disabled={loading || !data || !hora} fullWidth style={{ padding: '15px 0', fontSize: 16 }}>
        {loading ? 'Salvando...' : '+ Adicionar à agenda'}
      </Btn>
    </div>
  )
      }
