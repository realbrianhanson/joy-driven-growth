import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

async function sha256Hex(input: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  // ── Resolve owner: either by form_slug (public form) or x-api-key (developer API) ──
  let ownerUserId: string | null = null
  let formId: string | null = null
  let source = 'api'
  let apiKeyRowId: string | null = null

  const formSlug = body.form_slug ? String(body.form_slug) : null
  const apiKey = req.headers.get('x-api-key') || ''

  if (formSlug) {
    const { data: form, error: formErr } = await supabase
      .from('forms')
      .select('id, user_id, is_published')
      .eq('slug', formSlug)
      .maybeSingle()
    if (formErr || !form) return json({ error: 'form_not_found' }, 404)
    if (!form.is_published) return json({ error: 'form_not_published' }, 403)
    ownerUserId = form.user_id
    formId = form.id
    source = body.source ? String(body.source) : 'form'
  } else {
    if (!apiKey || apiKey.length < 20) return json({ error: 'missing_api_key_or_form_slug' }, 401)
    const keyHash = await sha256Hex(apiKey)
    const { data: keyRow, error: keyErr } = await supabase
      .from('api_keys')
      .select('id, user_id, revoked_at')
      .eq('key_hash', keyHash)
      .maybeSingle()
    if (keyErr || !keyRow) return json({ error: 'invalid_api_key' }, 401)
    if (keyRow.revoked_at) return json({ error: 'revoked_api_key' }, 401)
    ownerUserId = keyRow.user_id
    apiKeyRowId = keyRow.id
  }

  const author_name = (body.author_name || '').toString().trim()
  const content = (body.content || '').toString().trim()
  if (!author_name || author_name.length > 200) return json({ error: 'invalid_author_name' }, 400)
  if (content.length > 4000) return json({ error: 'invalid_content' }, 400)

  const type = ['text', 'video', 'audio'].includes(body.type) ? body.type : 'text'
  // Text submissions require content; video/audio can stand on their own
  if (type === 'text' && !content) return json({ error: 'invalid_content' }, 400)
  if (type === 'video' && !body.video_url) return json({ error: 'missing_video_url' }, 400)
  if (type === 'audio' && !body.audio_url) return json({ error: 'missing_audio_url' }, 400)

  const rating = body.rating != null ? Math.max(1, Math.min(5, parseInt(body.rating))) : null

  const allowedDisplay = ['full', 'first_initial', 'anonymous'] as const
  const display_preference = allowedDisplay.includes(body.display_preference)
    ? body.display_preference
    : 'full'
  const consent_given = body.consent_given === true
  const consent_text_raw = body.consent_text != null ? String(body.consent_text) : null
  if (consent_text_raw && consent_text_raw.length > 2000) {
    return json({ error: 'invalid_consent_text' }, 400)
  }
  const consent_text = consent_text_raw
  const consent_timestamp = consent_given ? new Date().toISOString() : null

  const already_developed = body.already_developed === true
  const developed_content = typeof body.developed_content === 'string' ? body.developed_content.slice(0, 8000) : null
  const developed_pull_quote = typeof body.developed_pull_quote === 'string' ? body.developed_pull_quote.slice(0, 300) : null
  const developed_one_liner = typeof body.developed_one_liner === 'string' ? body.developed_one_liner.slice(0, 200) : null
  const developed_at = already_developed && developed_content ? new Date().toISOString() : null

  const insert = {
    user_id: ownerUserId!,
    form_id: formId,
    author_name,
    author_email: body.author_email ? String(body.author_email).slice(0, 200) : null,
    author_title: body.author_title ? String(body.author_title).slice(0, 200) : null,
    author_company: body.author_company ? String(body.author_company).slice(0, 200) : null,
    content: content || null,
    rating,
    type,
    video_url: body.video_url ? String(body.video_url) : null,
    audio_url: body.audio_url ? String(body.audio_url) : null,
    custom_fields: body.custom_fields && typeof body.custom_fields === 'object' ? body.custom_fields : {},
    status: 'pending',
    source,
    consent_given,
    consent_text,
    consent_timestamp,
    display_preference,
    developed_content: already_developed ? developed_content : null,
    developed_pull_quote: already_developed ? developed_pull_quote : null,
    developed_one_liner: already_developed ? developed_one_liner : null,
    developed_at,
  }

  const { data: inserted, error: insErr } = await supabase
    .from('testimonials')
    .insert(insert)
    .select('id, created_at')
    .single()

  if (insErr) return json({ error: 'insert_failed', detail: insErr.message }, 500)

  if (apiKeyRowId) {
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKeyRowId)
  }

  if (formId) {
    await supabase.rpc('increment_form_submissions', { form_id: formId })
  }

  return json({ ok: true, testimonial: inserted })
})