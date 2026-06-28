import type { Env, CouncilSession } from './types'

// ── Telegram API ──────────────────────────────────────────────

const TG_API = 'https://api.telegram.org'

export async function tgSendMsg(
  token: string,
  chatId: number | string,
  text: string,
  opts: Record<string, unknown> = {},
): Promise<Response> {
  return fetch(`${TG_API}/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', ...opts }),
  })
}

export async function tgSendDoc(
  token: string,
  chatId: number | string,
  content: string,
  filename: string,
): Promise<Response> {
  const formData = new FormData()
  formData.append('chat_id', String(chatId))
  formData.append('document', new Blob([content], { type: 'text/markdown' }), filename)
  return fetch(`${TG_API}/bot${token}/sendDocument`, {
    method: 'POST',
    body: formData,
  })
}

// ── Mistral API ───────────────────────────────────────────────

const MISTRAL_API = 'https://api.mistral.ai/v1/chat/completions'

export async function mistralChat(
  apiKey: string,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
): Promise<string> {
  const res = await fetch(MISTRAL_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages,
      max_tokens: 2048,
      temperature: 0.85,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Mistral ${res.status}: ${body}`)
  }

  const json: any = await res.json()
  return json.choices?.[0]?.message?.content ?? ''
}

// ── KV ────────────────────────────────────────────────────────

const KEY_PREFIX = 'key:'
const SESSION_PREFIX = 'session:'

export async function getApiKey(env: Env, chatId: number): Promise<string | null> {
  return env.KEYS.get(`${KEY_PREFIX}${chatId}`, 'text')
}

export async function setApiKey(env: Env, chatId: number, key: string): Promise<void> {
  await env.KEYS.put(`${KEY_PREFIX}${chatId}`, key)
}

export function sessionKey(chatId: number): string {
  return `${SESSION_PREFIX}${chatId}`
}

export async function getSession(env: Env, chatId: number): Promise<CouncilSession | null> {
  const raw = await env.SESSIONS.get(sessionKey(chatId), 'text')
  return raw ? JSON.parse(raw) : null
}

export async function saveSession(env: Env, chatId: number, sess: CouncilSession): Promise<void> {
  sess.updatedAt = Date.now()
  await env.SESSIONS.put(sessionKey(chatId), JSON.stringify(sess), { expirationTtl: 3600 })
}

export async function deleteSession(env: Env, chatId: number): Promise<void> {
  await env.SESSIONS.delete(sessionKey(chatId))
}

// ── JSON extraction from LLM output ──────────────────────────

export function extractJson(text: string): any {
  try { return JSON.parse(text) } catch { /* ignore */ }
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (match) try { return JSON.parse(match[1].trim()) } catch { /* ignore */ }
  const objMatch = text.match(/(\{[\s\S]*\})/)
  if (objMatch) try { return JSON.parse(objMatch[1]) } catch { /* ignore */ }
  return null
}

// ── Escaping for Telegram MarkdownV2 ─────────────────────────

export function tgEscape(text: string): string {
  // Telegram Markdown: escape inline formatting chars
  return text
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
}
