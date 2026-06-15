import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'
import { C, IS } from '../../lib/tokens'
import { Btn, Spinner } from '../UI'

export default function AgendarAulaTab({ showToast }) {
  const { user, profile } = useAuth()
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const minDate = new Date().toISOString().split('T')[0]

  async function solicitar() {
    if (!data || !hora) { showToast('Preencha data e hora'); return }
    setLoading(true)
    try {
      const dataHora = new Date(`${data}T${hora}`).toISOString()
      const { error } = await supabase.from('compromissos').insert({
        personal_id: profile?.personal_id,
        cliente_id: user.id,
        titulo: 'Solicitação de aula',
        tipo: 'Treino',
        data_hora: dataHora,
        observacoes: obs,
        status: 'solicitado',
      })
      if (error) throw error
      setEnviado(true)
      showToast('Solicitação enviada!')
    } catch(e) {
      showToast('Erro ao enviar solicitação')
    } finally {
      setLoading(false)
    }
  }

  if (enviado) return (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>✅</p>
      <p style={{ fontSize: 17, fontWeight: 700, color: C.tp, marginBottom: 8 }}>Solicitação enviada!</p>
      <p style={{ fontSize: 13, color: C.ts, marginBottom: 24, lineHeight: 1.6 }}>Seu personal receberá sua solicitação e confirmará em breve.</p>
      <button onClick={() => { setEnviado(false); setData(''); setHora(''); setObs('') }} style={{ padding: '12px 28px', borderRadius: 12, border: `1px solid ${C.border}`, background: '#fff', color: C.tp, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
        Nova solicitação
      </button>
    </div>
  )

  return (
    <div>
      <p style={{ fontSize: 13, color: C.ts, marginBottom: 20, lineHeight: 1.6 }}>
        Escolha uma data e horário de preferência. Seu personal confirmará o agendamento.
      </p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Data *</label>
          <input value={data} onChange={e => setData(e.target.value)} type="date" min={minDate} style={IS} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Hora *</label>
          <input value={hora} onChange={e => setHora(e.target.value)} type="time" style={IS} />
        </div>
      </div>
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Observações</label>
        <textarea value={obs} onChange={e => setObs(e.target.value)} placeholder="Ex: Prefiro treino de pernas, tenho lesão no joelho..." rows={4} style={{ ...IS, resize: 'none' }} />
      </div>
      <Btn onClick={solicitar} disabled={loading || !data || !hora} fullWidth style={{ padding: '15px 0', fontSize: 16 }}>
        {loading ? 'Enviando...' : 'Solicitar aula'}
      </Btn>
    </div>
  )
      }
