import type { Env } from './types'
import { getApiKey, setApiKey, getSession, tgSendMsg, tgEscape } from './helpers'
import { handleCouncilCommand, runCouncil } from './council'
import { SAGE_MAP } from './sages'

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    // Only POST from Telegram
    if (req.method !== 'POST') {
      return new Response('OK', { status: 200 })
    }

    let body: any
    try {
      body = await req.json()
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    const msg = body.message
    if (!msg || !msg.text) return new Response('OK', { status: 200 })

    const chatId = msg.chat.id
    const text = msg.text.trim()

    // Commands
    if (text === '/start') {
      await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId, WELCOME_MSG)
      return new Response('OK', { status: 200 })
    }

    if (text === '/help') {
      await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId, HELP_MSG)
      return new Response('OK', { status: 200 })
    }

    // /setkey <key>
    if (text.startsWith('/setkey ')) {
      const key = text.slice(8).trim()
      if (!key.startsWith('sk-mi')) {
        await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId, '❌ کلید API میسترال باید با `sk-mi` شروع شود.')
        return new Response('OK', { status: 200 })
      }
      await setApiKey(env, chatId, key)
      await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId, '✅ **کلید API ذخیره شد.**\nحالا با /council سوال بپرس.')
      return new Response('OK', { status: 200 })
    }

    // /council [...]
    if (text.startsWith('/council')) {
      const reply = await handleCouncilCommand(env, chatId, text.slice(9))
      await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId, reply)

      // If valid council, get API key and run in background
      if (reply.startsWith('🏛')) {
        const apiKey = await getApiKey(env, chatId)
        if (apiKey) {
          const questionPart = text.slice(9).trim()
          let panelKey: 'quick' | 'full' | 'all' = 'full'
          let question = questionPart
          if (question.startsWith('--quick ')) { panelKey = 'quick'; question = question.slice(8).trim() }
          else if (question.startsWith('--full ')) { panelKey = 'full'; question = question.slice(7).trim() }
          else if (question.startsWith('--all ')) { panelKey = 'all'; question = question.slice(6).trim() }

          // Fire-and-forget via waitUntil
          env.waitUntil(runCouncil(env, chatId, question, panelKey, apiKey))
        }
      }

      return new Response('OK', { status: 200 })
    }

    // /status — resume broken session
    if (text === '/status') {
      const sess = await getSession(env, chatId)
      if (!sess) {
        await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId, '📭 جلسه فعالی وجود ندارد.')
      } else {
        const elapsed = Math.round((Date.now() - sess.updatedAt) / 1000)
        await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId,
          `📋 جلسه: ${sess.question}\n⏳ مرحله ${sess.step}\n🕐 ${elapsed} ثانیه پیش فعال بود.`)
      }
      return new Response('OK', { status: 200 })
    }

    // /report — get markdown report
    if (text === '/report') {
      const report = await env.SESSIONS.get(`report:${chatId}`, 'text')
      if (!report) {
        await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId, '📭 گزارشی موجود نیست. یک شورا برگزار کن.')
      } else {
        await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId,
          `📄 گزارش شورا:\n\`\`\`\n${report.slice(0, 4000)}\n\`\`\``)
      }
      return new Response('OK', { status: 200 })
    }

    // /ping for health
    if (text === '/ping') {
      await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId, '🏛 شورای خرد فعال است.')
      return new Response('OK', { status: 200 })
    }

    // Unknown
    await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId, tgEscape(
      'دستور نامشخص. /help برای راهنما.'))
    return new Response('OK', { status: 200 })
  },
}

const WELCOME_MSG = `🏛 **به ربات شورای خرد خوش آمدید!**

این ربات یک شورای فیلسوفان و اندیشمندان بزرگ ایرانی را تشکیل می‌دهد تا درباره هر موضوعی که می‌پرسی بحث کنند.

**شروع کار:**
1. /setkey sk-mi... — کلید API میسترال خود را تنظیم کن
2. /council سوالت — یک شورا تشکیل بده

**پانل‌ها:**
- /council --quick ... — ۲ حکیم (چکیده)
- /council --full ... — ۵ حکیم (پیش‌فرض)
- /council --all ... — ۱۰ حکیم (کامل)

**سایر دستورات:**
/help — راهنما
/status — وضعیت جلسه
/report — دریافت گزارش
/ping — سلامت`

const HELP_MSG = `🏛 **راهنمای ربات شورای خرد**

**اعضای شورا:**
${['farabi', 'razi', 'ebnesina', 'sadi', 'khayyam', 'mollasadra', 'amirkabir', 'khajehnezam', 'biruni', 'molana'].map(id => {
  const s = SAGE_MAP.get(id)
  return s ? `- ${s.emoji} ${s.name}: ${s.desc}` : ''
}).join('\n')}

**پانل‌ها:**
- \`--quick\`: ${['farabi', 'razi'].map(id => SAGE_MAP.get(id)?.name).join('، ')}
- \`--full\`: ${['farabi', 'razi', 'ebnesina', 'sadi', 'molana'].map(id => SAGE_MAP.get(id)?.name).join('، ')}
- \`--all\`: هر ۱۰ حکیم

**مراحل جلسه:**
1. 🔵 افتتاحیه (فارابی)
2. 💬 نظرات اولیه (اعضا)
3. ⚡ گفتگو و نقد (۲ دور)
4. 📋 صورت‌جلسه (بیرونی)
5. 🏆 رأی نهایی (فارابی)

**نکته:** کلید API میسترال PERSONAL است و فقط در این چت ذخیره می‌شود.`
