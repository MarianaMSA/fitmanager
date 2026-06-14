import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { email, nome, personalNome, inviteUrl } = await req.json()

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff;">
      <div style="background:linear-gradient(135deg,#1D9E75,#15C784);border-radius:16px;padding:20px 24px;text-align:center;margin-bottom:24px;">
        <span style="font-size:28px;">💪</span>
        <span style="color:#fff;font-size:22px;font-weight:800;margin-left:8px;vertical-align:middle;">VirtusManager</span>
      </div>
      <h2 style="color:#1A1917;font-size:20px;margin-bottom:8px;">Olá${nome ? ', '+nome : ''}! 👋</h2>
      <p style="color:#555;line-height:1.7;margin-bottom:28px;">
        <strong>${personalNome}</strong> te convidou para usar o <strong>VirtusManager</strong> —
        plataforma completa de treinos, fichas personalizadas e agenda.
      </p>
      <div style="text-align:center;margin-bottom:28px;">
        <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#1D9E75,#15C784);color:#fff;text-decoration:none;padding:15px 36px;border-radius:12px;font-weight:700;font-size:16px;letter-spacing:0.3px;">
          Criar minha conta →
        </a>
      </div>
      <p style="color:#999;font-size:12px;text-align:center;margin-bottom:4px;">Ou copie e cole o link no navegador:</p>
      <p style="color:#1D9E75;font-size:12px;text-align:center;word-break:break-all;">${inviteUrl}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
      <p style="color:#ccc;font-size:11px;text-align:center;">VirtusManager · Plataforma para Personal Trainers</p>
    </div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'VirtusManager <onboarding@resend.dev>',
      to: email,
      subject: `${personalNome} te convidou para o VirtusManager`,
      html,
    }),
  })

  const data = await res.json()
  return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: res.ok ? 200 : 400 })
})
