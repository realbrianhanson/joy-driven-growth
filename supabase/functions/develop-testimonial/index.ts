import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const SYSTEM_PROMPT = `You are a careful testimonial editor. Your job is to take the HONEST raw answers a real customer gave on a form and develop them into a polished, copy-paste-ready testimonial — a DRAFT a human will review before publishing.

Absolute rules (honesty guardrails):
- Develop and structure ONLY what the customer actually said. Never invent results, numbers, names, dates, features, or sentiment.
- Do not exaggerate. Do not make a lukewarm answer sound enthusiastic.
- If the source material is thin, the developed version stays thin — faithful, just cleaned up and readable.
- Write in first person, in the customer's authentic voice. Preserve their tone (warm / direct / dry / etc.).
- Fix grammar, structure paragraphs naturally, remove filler — that is all. No embellishment.

Respond with JSON ONLY (no markdown fences, no preamble):
{"developed_content": "<polished first-person testimonial, well-structured paragraph(s)>", "pull_quote": "<single strongest sentence from what they said, max 160 chars>", "one_liner": "<punchy version, max 100 chars>"}`;

async function callAi(userPrompt: string): Promise<{ developed_content: string; pull_quote: string | null; one_liner: string | null } | null> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) throw new Error('LOVABLE_API_KEY not configured')

  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-pro-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  })

  if (!res.ok) {
    if (res.status === 429) throw new Response(JSON.stringify({ error: 'rate_limited' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    if (res.status === 402) throw new Response(JSON.stringify({ error: 'credits_exhausted' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    throw new Error(`ai_error_${res.status}`)
  }
  const data = await res.json()
  const raw = data?.choices?.[0]?.message?.content ?? ''
  const cleaned = String(raw).replace(/```json\n?|\n?```/g, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    if (typeof parsed?.developed_content !== 'string' || !parsed.developed_content.trim()) return null
    return {
      developed_content: parsed.developed_content,
      pull_quote: typeof parsed.pull_quote === 'string' ? parsed.pull_quote.slice(0, 200) : null,
      one_liner: typeof parsed.one_liner === 'string' ? parsed.one_liner.slice(0, 140) : null,
    }
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader.toLowerCase().startsWith('bearer ')) return json({ error: 'unauthorized' }, 401)

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData?.user) return json({ error: 'unauthorized' }, 401)
  const callerId = userData.user.id

  let body: any
  try { body = await req.json() } catch { return json({ error: 'invalid_json' }, 400) }
  const testimonialId = body?.testimonial_id
  if (!testimonialId || typeof testimonialId !== 'string') return json({ error: 'missing_testimonial_id' }, 400)

  const admin = createClient(supabaseUrl, serviceKey)

  const { data: t, error: tErr } = await admin
    .from('testimonials')
    .select('id, user_id, content, rating, author_name, author_company, custom_fields, type')
    .eq('id', testimonialId)
    .maybeSingle()
  if (tErr || !t) return json({ error: 'testimonial_not_found' }, 404)

  // Authorize: owner or accepted team member
  if (t.user_id !== callerId) {
    const { data: membership } = await admin
      .from('team_members')
      .select('id')
      .eq('owner_user_id', t.user_id)
      .eq('member_user_id', callerId)
      .maybeSingle()
    if (!membership) return json({ error: 'forbidden' }, 403)
  }

  if (!t.content && (!t.custom_fields || Object.keys(t.custom_fields).length === 0)) {
    return json({ error: 'nothing_to_develop' }, 400)
  }

  const customAnswersText = t.custom_fields && typeof t.custom_fields === 'object'
    ? Object.entries(t.custom_fields).map(([k, v]) => `- ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join('\n')
    : ''

  const userPrompt = `Customer: ${t.author_name ?? 'Anonymous'}${t.author_company ? ` (${t.author_company})` : ''}
Rating: ${t.rating ?? 'n/a'}

Raw testimonial they wrote:
"""${t.content ?? '(none)'}"""

Their answers to grounding questions:
${customAnswersText || '(none)'}

Develop this into a polished first-person testimonial draft following the rules in the system prompt. Stay faithful to what they actually said.`

  let developed: { developed_content: string; pull_quote: string | null; one_liner: string | null } | null = null
  try {
    developed = await callAi(userPrompt)
    if (!developed) developed = await callAi(userPrompt) // one retry on parse failure
  } catch (e) {
    if (e instanceof Response) return e
    console.error('develop-testimonial ai error:', e)
    return json({ error: 'ai_error' }, 500)
  }
  if (!developed) return json({ error: 'ai_parse_failed' }, 502)

  const nowIso = new Date().toISOString()
  const { error: updErr } = await admin
    .from('testimonials')
    .update({
      developed_content: developed.developed_content,
      developed_pull_quote: developed.pull_quote,
      developed_one_liner: developed.one_liner,
      developed_at: nowIso,
    })
    .eq('id', testimonialId)
  if (updErr) return json({ error: 'update_failed', detail: updErr.message }, 500)

  return json({
    ok: true,
    developed_content: developed.developed_content,
    developed_pull_quote: developed.pull_quote,
    developed_one_liner: developed.one_liner,
    developed_at: nowIso,
  })
})