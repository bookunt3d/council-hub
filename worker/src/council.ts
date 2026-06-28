import type { Sage, SageMessage, CouncilSession, PanelKey } from './types'
import { getPanel, SAGE_MAP, getPanelName } from './sages'
import { mistralChat, tgSendMsg, tgEscape, getApiKey, saveSession, deleteSession } from './helpers'
import type { Env } from './types'

const BOT_CREATOR = `شما نویسنده و کارگردان یک شورای فیلسوفان ایرانی هستید.
شما باید نقش هر یک از حکیمان را در قالب یک روایت سینمایی اجرا کنید.
همه خروجی‌ها به فارسی روان است.
از نثر ادبی و استدلال عمیق استفاده کنید.
اشعار و نقل‌قول‌ها درون > blockquote قرار گیرند.
هر حکیم باید حداقل یک بار به کتاب یا اثر خودش ارجاع دهد.
بدون جدول، بدون لیست عددی خشک.`

function makeSystemPrompt(
  sage: Sage,
  role: 'opener' | 'member' | 'secretary' | 'closer' | 'debater',
  question: string,
  history: SageMessage[],
): string {
  let prompt = `${BOT_CREATOR}\n\n`
  prompt += `## نقش فعلی: ${sage.emoji} ${sage.name}\n`
  prompt += `- **معرفی:** ${sage.desc}\n`
  prompt += `- **لنز فکری:** ${sage.lens}\n`
  prompt += `- **اثر شاخص:** ${sage.work}\n`
  prompt += `- **نقل قول کلیدی:** ${sage.quote}\n`
  prompt += `- **نقش در جلسه:** ${sage.role === 'chair' ? 'رئیس جلسه' : sage.role === 'secretary' ? 'دبیر جلسه' : 'عضو شورا'}\n`

  if (role === 'opener') {
    prompt += `\n## مأموریت: افتتاحیه جلسه\n`
    prompt += `شما رئیس جلسه هستید. جلسه را با شکوه و وقار آغاز کنید:\n`
    prompt += `1. علت مادی: مسئله چیست؟\n2. علت صوری: ابعاد مسئله\n3. علت فاعلی: نیروهای مؤثر\n4. علت غایی: هدف از بررسی\n`
    prompt += `- اعضا را معرفی کنید و تخصص هر یک را به مسئله پیوند بزنید\n`
    prompt += `- ترتیب سخنرانان را اعلام کنید\n`
  } else if (role === 'member') {
    prompt += `\n## مأموریت: نظر اولیه\n`
    prompt += `نظر خود را درباره این پرسش بیان کنید. با یک خط مقدمه سینمایی شروع کنید.\n`
    prompt += `استدلال خود را با ارجاع به آثار خود مستند کنید.\n`
    prompt += `در پایان، نوبت را به حکیم بعدی بسپارید.\n`
  } else if (role === 'debater') {
    prompt += `\n## مأموریت: گفتگو و نقد\n`
    prompt += `سخنان حکیمان قبلی را نقد کنید. با یک حرکت نمایشی شروع کنید.\n`
    prompt += `می‌توانید با یک حکیم خاص موافقت یا مخالفت کنید.\n`
    prompt += `نقد خود را مستدل و محترمانه بیان کنید.\n`
  } else if (role === 'secretary') {
    prompt += `\n## مأموریت: صورت‌جلسه\n`
    prompt += `شما دبیر جلسه هستید. با دقت یک دانشمند:\n`
    prompt += `- نقاط اشتراک نظر اعضا را فهرست کنید\n`
    prompt += `- اختلافات را ثبت کنید\n`
    prompt += `- نکات شگفت‌انگیز را برجسته کنید\n`
    prompt += `- پیش‌نویس رأی شورا را ارائه دهید\n`
  } else if (role === 'closer') {
    prompt += `\n## مأموریت: رأی نهایی\n`
    prompt += `شما رئیس جلسه هستید. جمع‌بندی نهایی را اعلام کنید:\n`
    prompt += `- رأی شورا: **اجماع** / **اکثریت** / **فاقد اجماع**\n`
    prompt += `- درصد اعتماد به رأی\n`
    prompt += `- کلام پایانی — یک جمله قصار از یکی از اعضا درون > blockquote\n`
  }

  prompt += `\n## موضوع جلسه\n${question}\n`

  if (history.length > 0) {
    prompt += `\n## گفتگوی پیشین جلسه\n`
    for (const msg of history) {
      const s = SAGE_MAP.get(msg.sageId)
      prompt += `${s?.emoji ?? ''} ${s?.name ?? msg.sageId}: ${msg.content}\n\n`
    }
  }

  return prompt
}

// Build markup for report
function buildMarkdownReport(question: string, panelName: string, history: SageMessage[]): string {
  const lines: string[] = []
  lines.push(`# 🏛 گزارش شورای خرد\n`)
  lines.push(`## ${question}\n`)
  lines.push(`**پانل:** ${panelName}\n---\n`)

  for (const msg of history) {
    const s = SAGE_MAP.get(msg.sageId)
    if (!s) { lines.push(`${msg.content}\n\n`); continue }
    if (s.id === 'farabi' && history.indexOf(msg) === 0) {
      lines.push(`## ◈ فاز ۱ — افتتاحیه\n### ${s.emoji} ${s.name} (رئیس جلسه)\n\n${msg.content}\n---\n`)
    } else if (s.id === 'biruni') {
      lines.push(`## ◈ صورت‌جلسه\n### ${s.emoji} ${s.name} (دبیر جلسه)\n\n${msg.content}\n---\n`)
    } else if (s.id === 'farabi' && history.indexOf(msg) === history.length - 1) {
      lines.push(`## 🏆 رأی نهایی\n### ${s.emoji} ${s.name} (رئیس جلسه)\n\n${msg.content}\n---\n`)
    } else {
      lines.push(`### ${s.emoji} ${s.name}\n${msg.content}\n---\n`)
    }
  }

  return lines.join('\n')
}

// Fisher-Yates shuffle (uniform)
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export async function runCouncil(
  env: Env,
  chatId: number,
  question: string,
  panelKey: PanelKey,
  apiKey: string,
): Promise<void> {
  try {
    const panel = getPanel(panelKey)
    const panelName = `${getPanelName(panel.length)} (${panel.map(s => s.name).join('، ')})`
    const history: SageMessage[] = []
    const session: CouncilSession = { question, panel: panelKey, step: 0, history, createdAt: Date.now(), updatedAt: Date.now() }
    await saveSession(env, chatId, session)

    const send = async (sage: Sage, content: string) => {
      const text = `${sage.emoji} <b>${sage.name}</b>\n\n${tgEscape(content)}`
      await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId, text)
      history.push({ sageId: sage.id, content })
      session.history = history
      await saveSession(env, chatId, session)
    }

    // Step 1: Opener
    session.step = 1
    await saveSession(env, chatId, session)
    const farabi = SAGE_MAP.get('farabi')
    const biruni = SAGE_MAP.get('biruni')
    if (!farabi || !biruni) {
      await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId, '❌ خطای داخلی: تنظیمات شورا مشکل دارد.')
      return
    }
    const openerPrompt = makeSystemPrompt(farabi, 'opener', question, [])
    const opener = await mistralChat(apiKey, [
      { role: 'system', content: openerPrompt },
      { role: 'user', content: `افتتاحیه جلسه شورای خرد درباره «${question}» را بنویس.` },
    ])
    await send(farabi, opener)

    // Step 2: Initial opinions — PARALLEL
    session.step = 2
    await saveSession(env, chatId, session)
    const members = panel.filter(s => s.id !== 'farabi')
    const memberResults = await Promise.all(members.map(sage =>
      mistralChat(apiKey, [
        { role: 'system', content: makeSystemPrompt(sage, 'member', question, history) },
        { role: 'user', content: `نظر اولیه خود را درباره «${question}» بیان کن. پایان پاسخ را به حکیم بعدی بسپار.` },
      ])
    ))
    for (let i = 0; i < members.length; i++) {
      await send(members[i], memberResults[i])
    }

    // Step 3: Debate — 2 rounds, debaters in parallel
    session.step = 3
    await saveSession(env, chatId, session)
    const debaters = panel.filter(s => s.id !== 'farabi' && s.id !== 'biruni')
    for (let round = 1; round <= 2; round++) {
      const selected = shuffle(debaters).slice(0, Math.min(3, debaters.length))
      const debateResults = await Promise.all(selected.map(sage =>
        mistralChat(apiKey, [
          { role: 'system', content: makeSystemPrompt(sage, 'debater', question, history) },
          { role: 'user', content: `دور ${round} گفتگو: سخنان حکیمان پیشین را نقد کن و استدلال خود را بیان کن.` },
        ])
      ))
      for (let i = 0; i < selected.length; i++) {
        await send(selected[i], debateResults[i])
      }
    }

    // Step 4: Minutes
    session.step = 4
    await saveSession(env, chatId, session)
    const minutesPrompt = makeSystemPrompt(biruni, 'secretary', question, history)
    const minutes = await mistralChat(apiKey, [
      { role: 'system', content: minutesPrompt },
      { role: 'user', content: `صورت‌جلسه شورا را بنویس: نقاط اشتراک، اختلافات، نکات برجسته.` },
    ])
    await send(biruni, minutes)

    // Step 5: Verdict
    session.step = 5
    await saveSession(env, chatId, session)
    const closerPrompt = makeSystemPrompt(farabi, 'closer', question, history)
    const verdict = await mistralChat(apiKey, [
      { role: 'system', content: closerPrompt },
      { role: 'user', content: `رأی نهایی شورا درباره «${question}» را اعلام کن.` },
    ])
    await send(farabi, verdict)

    // Store report
    const md = buildMarkdownReport(question, panelName, history)
    await env.SESSIONS.put(`report:${chatId}`, md, { expirationTtl: 86400 })
    await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId,
      '📄 **گزارش کامل شورا**: با دستور /report دریافت کنید.')

    await deleteSession(env, chatId)
  } catch (err: any) {
    const msg = `❌ **خطا در شورا:**\n\`${tgEscape(err?.message ?? 'خطای ناشناخته')}\`\n\nدوباره تلاش کن /council`
    try {
      await tgSendMsg(env.TELEGRAM_BOT_TOKEN, chatId, msg)
    } catch { /* ignore */ }
    await deleteSession(env, chatId)
  }
}

export async function handleCouncilCommand(
  env: Env,
  chatId: number,
  text: string,
): Promise<string> {
  let panelKey: PanelKey = 'full'
  let question = text.trim()

  if (question.startsWith('--quick ')) { panelKey = 'quick'; question = question.slice(8).trim() }
  else if (question.startsWith('--full ')) { panelKey = 'full'; question = question.slice(7).trim() }
  else if (question.startsWith('--all ')) { panelKey = 'all'; question = question.slice(6).trim() }
  else if (question.startsWith('--')) { /* unknown flag → full */ }

  if (!question) {
    return '❌ سوالی برای شورا وارد نکردی.\nمثال:\n/council --full آینده هوش مصنوعی در ایران'
  }

  const apiKey = await getApiKey(env, chatId)
  if (!apiKey) {
    return '🔑 ابتدا کلید API میسترال خود را با /setkey تنظیم کن.\nمثال: /setkey sk-mi...'
  }

  const panel = getPanel(panelKey)
  return `🏛 **شورای خرد** تشکیل شد.\n📋 پانل: **${getPanelName(panel.length)}** (${panel.map(s => s.name).join('، ')})\n❓ موضوع: ${question}\n⏳ چند لحظه صبر کن...`
}

export { buildMarkdownReport }
