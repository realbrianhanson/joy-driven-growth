import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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

  const apiKey = req.headers.get('x-api-key') || ''
  if (!apiKey || apiKey.length < 20) return json({ error: 'missing_api_key' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const keyHash = await sha256Hex(apiKey)
  const { data: keyRow, error: keyErr } = await supabase
    .from('api_keys')
    .select('id, user_id, revoked_at')
    .eq('key_hash', keyHash)
    .maybeSingle()

  if (keyErr || !keyRow) return json({ error: 'invalid_api_key' }, 401)
  if (keyRow.revoked_at) return json({ error: 'revoked_api_key' }, 401)

  let body: any
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid_json' }, 400)
  }

  const author_name = (body.author_name || '').toString().trim()
  const content = (body.content || '').toString().trim()
  if (!author_name || author_name.length > 200) return json({ error: 'invalid_author_name' }, 400)
  if (!content || content.length > 4000) return json({ error: 'invalid_content' }, 400)

  const rating = body.rating != null ? Math.max(1, Math.min(5, parseInt(body.rating))) : null
  const insert = {
    user_id: keyRow.user_id,
    author_name,
    author_email: body.author_email ? String(body.author_email).slice(0, 200) : null,
    author_title: body.author_title ? String(body.author_title).slice(0, 200) : null,
    author_company: body.author_company ? String(body.author_company).slice(0, 200) : null,
    content,
    rating,
    type: 'text',
    status: 'pending',
    source: 'api',
  }

  const { data: inserted, error: insErr } = await supabase
    .from('testimonials')
    .insert(insert)
    .select('id, created_at')
    .single()

  if (insErr) return json({ error: 'insert_failed', detail: insErr.message }, 500)

  await supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyRow.id)

  return json({ ok: true, testimonial: inserted })
})