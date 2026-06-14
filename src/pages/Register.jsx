import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { C, IS } from '../lib/tokens'
import { Btn, Card } from '../components/UI'

const ESPECIALIDADES = [
  'Musculação', 'Funcional', 'HIIT', 'Crossfit', 'Pilates',
  'Yoga', 'Natação', 'Corrida', 'Emagrecimento', 'Hipertrofia',
  'Reabilitação', 'Idosos', 'Gestantes', 'Fisioterapia',
]

export default function Register() {
  const nav = useNavigate()
  const { signUp } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    nome: '', email: '', telefone: '', cref: '', bio: '',
    especialidades: [], senha: '', confirma: '',
  })
  const upd = (f, v) => setForm(p => ({ ...p, [f]: v }))
  const toggleEsp = e => setForm(p => ({ ...p, especialidades: p.especialidades.includes(e) ? p.especialidades.filter(x => x !== e) : [...p.especialidades, e] }))

  const progress = (step / 3) * 100

  const nextStep = async () => {
    setErro('')
    if (step === 1) {
      if (!form.nome || !form.email || !form.telefone) { setErro('Preencha todos os campos obrigatórios.'); return }
      if (!form.email.includes('@')) { setErro('E-mail inválido.'); return }
      setStep(2); return
    }
    if (step === 2) { setStep(3); return }
    if (step === 3) {
      if (form.senha.length < 6) { setErro('A senha deve ter ao menos 6 caracteres.'); return }
      if (form.senha !== form.confirma) { setErro('As senhas não coincidem.'); return }
      setLoading(true)
      try {
        await signUp({
          email: form.email, password: form.senha,
          nome: form.nome, telefone: form.telefone,
          cref: form.cref, bio: form.bio,
          especialidades: form.especialidades, role: 'personal',
        })
        nav('/app', { replace: true })
      } catch (e) {
        setErro(e.message || 'Erro ao criar conta. Tente novamente.')
        setLoading(false)
      }
    }
  }

  const passScore = (() => {
    const l = form.senha.length
    if (!l) return 0
    if (l < 6) return 1
    if (l < 8) return 2
    if (l < 10 && !/[!@#$%^&*]/.test(form.senha)) return 3
    return 4
  })()
  const passColors = ['', '#E24B4A', '#F5A623', '#1D9E75', '#0F6E56']
  const passLabels = ['', 'Fraca', 'Razoável', 'Boa', 'Forte']

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      {/* Header */}
      <div style={{ background: C.green, padding: '20px 20px 40px' }}>
        <button onClick={step === 1 ? () => nav('/') : () => setStep(s => s - 1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.85)', fontSize: 22, cursor: 'pointer', padding: 0, marginBottom: 16, display: 'block' }}>←</button>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Criar conta</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginBottom: 16 }}>
          Passo {step} de 3 — {['Dados pessoais', 'Especialidades', 'Criar senha'][step - 1]}
        </p>
        <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: '#fff', borderRadius: 4, transition: 'width .4s' }} />
        </div>
      </div>

      <div style={{ padding: '24px 20px', marginTop: -16, background: C.bg, borderRadius: '20px 20px 0 0', minHeight: 'calc(100vh - 160px)' }}>

        {/* PASSO 1 */}
        {step === 1 && (
          <div>
            {[['nome', 'Nome completo', 'Rafael Pereira', 'text', true], ['email', 'E-mail', 'rafael@email.com', 'email', true], ['telefone', 'Telefone / WhatsApp', '(11) 99999-9999', 'tel', true], ['cref', 'CREF', '000000-G/SP', 'text', false]].map(([f, l, ph, t, req]) => (
              <div key={f} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>{l}{req && <span style={{ color: C.red }}> *</span>}</label>
                <input value={form[f]} onChange={e => upd(f, e.target.value)} placeholder={ph} type={t} style={IS} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Sobre você <span style={{ color: C.tt }}>(opcional)</span></label>
              <textarea value={form.bio} onChange={e => upd('bio', e.target.value)} placeholder="Experiência, metodologia..." style={{ ...IS, height: 80, resize: 'none' }} />
            </div>
          </div>
        )}

        {/* PASSO 2 */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: 13, color: C.ts, marginBottom: 16, lineHeight: 1.6 }}>Selecione suas especialidades (opcional). Ajuda seus clientes a encontrarem você.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {ESPECIALIDADES.map(e => {
                const sel = form.especialidades.includes(e)
                return (
                  <button key={e} onClick={() => toggleEsp(e)} style={{ padding: '9px 16px', borderRadius: 22, border: `1.5px solid ${sel ? C.green : C.border}`, background: sel ? C.gl : '#fff', color: sel ? C.gd : C.ts, fontSize: 13, fontWeight: sel ? 600 : 400, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}>
                    {sel && '✓ '}{e}
                  </button>
                )
              })}
            </div>
            {form.especialidades.length > 0 && (
              <div style={{ background: C.gl, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
                <p style={{ fontSize: 11, color: C.gd, fontWeight: 500 }}>{form.especialidades.length} especialidade{form.especialidades.length !== 1 ? 's' : ''} selecionada{form.especialidades.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
        )}

        {/* PASSO 3 */}
        {step === 3 && (
          <div>
            <Card style={{ padding: 14, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: C.gl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>💪</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: C.tp }}>{form.nome}</p>
                  <p style={{ fontSize: 12, color: C.ts }}>{form.email}</p>
                  {form.cref && <p style={{ fontSize: 11, color: C.tt, marginTop: 2 }}>CREF {form.cref}</p>}
                </div>
              </div>
              {form.especialidades.length > 0 && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {form.especialidades.slice(0, 4).map(e => <span key={e} style={{ fontSize: 10, padding: '2px 9px', borderRadius: 20, background: C.gl, color: C.gd, fontWeight: 500 }}>{e}</span>)}
                  {form.especialidades.length > 4 && <span style={{ fontSize: 10, color: C.tt }}>+{form.especialidades.length - 4}</span>}
                </div>
              )}
            </Card>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Crie uma senha <span style={{ color: C.red }}>*</span></label>
              <div style={{ position: 'relative' }}>
                <input value={form.senha} onChange={e => upd('senha', e.target.value)} placeholder="Mínimo 6 caracteres" type={showPass ? 'text' : 'password'} style={{ ...IS, paddingRight: 44 }} />
                <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.tt }}>{showPass ? '🙈' : '👁️'}</button>
              </div>
              {form.senha && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
                    {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= passScore ? passColors[passScore] : '#E8E6E0', transition: 'background .2s' }} />)}
                  </div>
                  <p style={{ fontSize: 10, color: passColors[passScore] }}>{passLabels[passScore]}</p>
                </div>
              )}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Confirme a senha <span style={{ color: C.red }}>*</span></label>
              <input value={form.confirma} onChange={e => upd('confirma', e.target.value)} placeholder="Repita a senha" type={showPass ? 'text' : 'password'} style={{ ...IS, borderColor: form.confirma && form.confirma !== form.senha ? '#F0AAAA' : C.border }} />
              {form.confirma && form.confirma !== form.senha && <p style={{ fontSize: 10, color: C.red, marginTop: 5 }}>As senhas não coincidem</p>}
            </div>

            <div style={{ background: '#F0EEE8', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: 11, color: C.ts, lineHeight: 1.6 }}>
                Ao criar sua conta você concorda com os <span style={{ color: C.green, fontWeight: 500 }}>Termos de Uso</span> e a <span style={{ color: C.green, fontWeight: 500 }}>Política de Privacidade</span> do VirtusManager.
              </p>
            </div>
          </div>
        )}

        {erro && <div style={{ background: '#FCEBEB', border: '1px solid #F0AAAA', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}><p style={{ fontSize: 12, color: C.red }}>{erro}</p></div>}

        <Btn onClick={nextStep} disabled={loading} fullWidth style={{ padding: '15px 0', fontSize: 16 }}>
          {loading ? 'Criando conta...' : step === 3 ? 'Criar minha conta ✓' : 'Continuar →'}
        </Btn>

        {step === 1 && (
          <p style={{ textAlign: 'center', fontSize: 13, color: C.ts, marginTop: 20 }}>
            Já tem conta?{' '}
            <button onClick={() => nav('/login')} style={{ background: 'none', border: 'none', color: C.green, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Entrar</button>
          </p>
        )}
      </div>
    </div>
  )
}
