import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { C, IS } from '../lib/tokens'
import { Btn, Spinner } from '../components/UI'

export default function AcceptInvite() {
  const nav = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')
  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState('form') // form | success
  const [form, setForm] = useState({ nome: '', senha: '', confirma: '', telefone: '' })
  const [erro, setErro] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (!token) { setLoading(false); return }
    supabase.from('invites')
      .select('*, personal:personal_id(nome, email)')
      .eq('token', token)
      .eq('status', 'pending')
      .single()
      .then(({ data, error }) => {
        if (error || !data) setInvite(null)
        else setInvite(data)
        setLoading(false)
      })
  }, [token])

  const handleSubmit = async () => {
    if (!form.nome || !form.senha) { setErro('Preencha todos os campos.'); return }
    if (form.senha.length < 6) { setErro('A senha deve ter ao menos 6 caracteres.'); return }
    if (form.senha !== form.confirma) { setErro('As senhas não coincidem.'); return }
    setSubmitting(true); setErro('')
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: invite.email,
        password: form.senha,
        options: { data: { nome: form.nome, role: 'cliente' } }
      })
      if (authError) throw authError

      // Create profile
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        nome: form.nome,
        email: invite.email,
        telefone: form.telefone,
        role: 'cliente',
        personal_id: invite.personal_id,
      })

      // Update invite status
      await supabase.from('invites').update({ status: 'accepted', cliente_id: authData.user.id }).eq('id', invite.id)

      setStep('success')
    } catch (e) {
      setErro(e.message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner /></div>

  if (!token || !invite) return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 44, marginBottom: 16 }}>❌</p>
        <p style={{ fontSize: 18, fontWeight: 700, color: C.tp, marginBottom: 8 }}>Link inválido ou expirado</p>
        <p style={{ fontSize: 13, color: C.ts, marginBottom: 24 }}>Este link de convite não existe ou já foi utilizado.</p>
        <Btn onClick={() => nav('/login')}>Ir para o login</Btn>
      </div>
    </div>
  )

  if (step === 'success') return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg, ${C.gd} 0%, ${C.green} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <p style={{ fontSize: 60, marginBottom: 20 }}>🎉</p>
        <p style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>Bem-vindo ao VirtusManager!</p>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', marginBottom: 30, lineHeight: 1.6 }}>
          Sua conta foi criada. Agora você tem acesso à sua área de cliente, fichas de treino e muito mais.
        </p>
        <button onClick={() => nav('/login')} style={{ padding: '15px 32px', borderRadius: 14, border: 'none', background: '#fff', color: C.gd, fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          Entrar no app →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ background: C.green, padding: '40px 24px 48px', textAlign: 'center' }}>
        <div style={{ width: 70, height: 70, borderRadius: 22, background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 16px' }}>💪</div>
        <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Você foi convidado!</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', lineHeight: 1.6 }}>
          <strong>{invite.personal?.nome}</strong> te convidou para usar o VirtusManager como cliente.
        </p>
      </div>

      <div style={{ padding: '28px 20px', marginTop: -16, background: C.bg, borderRadius: '20px 20px 0 0' }}>
        <div style={{ background: C.gl, border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 24 }}>
          <p style={{ fontSize: 12, color: C.gd }}>📧 Convite enviado para: <strong>{invite.email}</strong></p>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Seu nome completo <span style={{ color: C.red }}>*</span></label>
          <input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Seu nome" style={IS} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Telefone / WhatsApp</label>
          <input value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} placeholder="(11) 99999-9999" type="tel" style={IS} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Crie uma senha <span style={{ color: C.red }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <input value={form.senha} onChange={e => setForm(p => ({ ...p, senha: e.target.value }))} placeholder="Mínimo 6 caracteres" type={showPass ? 'text' : 'password'} style={{ ...IS, paddingRight: 44 }} />
            <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.tt }}>{showPass ? '🙈' : '👁️'}</button>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Confirme a senha <span style={{ color: C.red }}>*</span></label>
          <input value={form.confirma} onChange={e => setForm(p => ({ ...p, confirma: e.target.value }))} placeholder="Repita a senha" type={showPass ? 'text' : 'password'} style={{ ...IS, borderColor: form.confirma && form.confirma !== form.senha ? '#F0AAAA' : C.border }} />
        </div>

        {erro && <div style={{ background: '#FCEBEB', border: '1px solid #F0AAAA', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}><p style={{ fontSize: 12, color: C.red }}>{erro}</p></div>}

        <Btn onClick={handleSubmit} disabled={submitting} fullWidth style={{ padding: '15px 0', fontSize: 16 }}>
          {submitting ? 'Criando conta...' : 'Criar minha conta e acessar 🎉'}
        </Btn>
      </div>
    </div>
  )
}
