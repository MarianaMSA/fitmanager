import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { C, IS } from '../lib/tokens'
import { Btn } from '../components/UI'

export default function Login() {
  const nav = useNavigate()
  const { signIn, resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return }
    setLoading(true); setErro('')
    try {
      await signIn({ email, password: senha })
      nav('/app', { replace: true })
    } catch (e) {
      setErro('E-mail ou senha incorretos.')
    } finally {
      setLoading(false)
    }
  }

  const handleForgot = async () => {
    if (!forgotEmail) return
    setForgotLoading(true)
    try {
      await resetPassword(forgotEmail)
      setForgotSent(true)
    } catch (e) {
      setErro('Erro ao enviar e-mail. Verifique o endereço.')
    } finally {
      setForgotLoading(false)
    }
  }

  if (forgot) return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ background: C.green, padding: '20px 20px 40px' }}>
        <button onClick={() => setForgot(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.85)', fontSize: 22, cursor: 'pointer', padding: 0, marginBottom: 16, display: 'block' }}>←</button>
        <p style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Recuperar senha</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>Enviaremos um link para seu e-mail</p>
      </div>
      <div style={{ padding: '28px 20px' }}>
        {!forgotSent ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>E-mail cadastrado</label>
              <input value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="seu@email.com" type="email" style={IS} />
            </div>
            {erro && <div style={{ background: '#FCEBEB', border: '1px solid #F0AAAA', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}><p style={{ fontSize: 12, color: C.red }}>{erro}</p></div>}
            <Btn onClick={handleForgot} disabled={!forgotEmail || forgotLoading} fullWidth>
              {forgotLoading ? 'Enviando...' : 'Enviar link de recuperação'}
            </Btn>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <p style={{ fontSize: 44, marginBottom: 16 }}>📧</p>
            <p style={{ fontSize: 17, fontWeight: 700, color: C.tp, marginBottom: 10 }}>Link enviado!</p>
            <p style={{ fontSize: 13, color: C.ts, lineHeight: 1.6 }}>Verifique sua caixa de entrada em <strong>{forgotEmail}</strong> e siga as instruções para redefinir sua senha.</p>
            <button onClick={() => { setForgot(false); setForgotSent(false) }} style={{ marginTop: 24, padding: '12px 28px', borderRadius: 12, border: `1px solid ${C.border}`, background: '#fff', color: C.tp, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Voltar ao login
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ background: C.green, padding: '20px 20px 44px' }}>
        <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.85)', fontSize: 22, cursor: 'pointer', padding: 0, marginBottom: 16, display: 'block' }}>←</button>
        <p style={{ fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Bem-vindo de volta 👋</p>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.75)' }}>Entre com sua conta VirtusManager</p>
      </div>

      <div style={{ padding: '28px 20px', marginTop: -20, background: C.bg, borderRadius: '20px 20px 0 0' }}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>E-mail</label>
          <input value={email} onChange={e => { setEmail(e.target.value); setErro('') }} placeholder="seu@email.com" type="email" style={IS} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        <div style={{ marginBottom: 6 }}>
          <label style={{ fontSize: 11, color: C.ts, display: 'block', marginBottom: 6 }}>Senha</label>
          <div style={{ position: 'relative' }}>
            <input value={senha} onChange={e => { setSenha(e.target.value); setErro('') }} placeholder="••••••••" type={showPass ? 'text' : 'password'} style={{ ...IS, paddingRight: 44 }} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.tt }}>
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <button onClick={() => setForgot(true)} style={{ background: 'none', border: 'none', color: C.green, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
            Esqueci minha senha
          </button>
        </div>

        {erro && (
          <div style={{ background: '#FCEBEB', border: '1px solid #F0AAAA', borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: C.red }}>{erro}</p>
          </div>
        )}

        <Btn onClick={handleLogin} disabled={loading} fullWidth style={{ marginBottom: 24, padding: '15px 0', fontSize: 16 }}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Btn>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: C.border }} />
          <p style={{ fontSize: 11, color: C.tt }}>ou</p>
          <div style={{ flex: 1, height: 1, background: C.border }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: C.ts }}>
          Não tem conta?{' '}
          <button onClick={() => nav('/register')} style={{ background: 'none', border: 'none', color: C.green, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
            Criar conta de Personal
          </button>
        </p>
      </div>
    </div>
  )
}
