# 🏛 شورای خرد — Council of Wisdom

سرویس شخصی شورای فیلسوفان ایرانی روی Cloudflare Workers + Telegram Bot.

هر کاربر کلید API شخصی Mistral AI خود را به ربات می‌دهد و شورایی از ۱۰ اندیشمند بزرگ ایران را تشکیل می‌دهد.

## 🚀 شروع سریع

### ۱. پیش‌نیازها

- [Node.js](https://nodejs.org/) ۱۸+
- [Cloudflare account](https://dash.cloudflare.com/sign-up)
- [Mistral AI API key](https://console.mistral.ai/api-keys/)
- [Telegram Bot Token](https://t.me/BotFather)

### ۲. دیپلوی

```bash
git clone https://github.com/YOUR_USER/council-hub.git
cd council-hub/worker
npm install

# Create KV namespaces
npx wrangler kv:namespace create KEYS
npx wrangler kv:namespace create SESSIONS

# Copy the IDs into wrangler.toml
# Edit wrangler.toml — paste KV IDs

# Set secrets
npx wrangler secret put TELEGRAM_BOT_TOKEN
# Paste bot token from @BotFather

npx wrangler secret put COUNCIL_SECRET
# Run: openssl rand -hex 32

# Deploy
npx wrangler deploy
```

### ۳. تنظیم وب‌هوک

```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<WORKER>.workers.dev/"
```

### ۴. استفاده

1. توی تلگرام ربات را باز کن → `/start`
2. تنظیم کلید: `/setkey sk-mi-...`
3. تشکیل شورا: `/council --full آینده هوش مصنوعی`

## 🤖 دستورات ربات

| دستور | توضیح |
|---|---|
| `/start` | خوش‌آمدگویی |
| `/help` | راهنمای کامل |
| `/setkey sk-mi...` | تنظیم کلید API میسترال |
| `/council --quick ...` | شورای ۲ نفره چکیده |
| `/council --full ...` | شورای ۵ نفره (پیش‌فرض) |
| `/council --all ...` | شورای کامل ۱۰ نفره |
| `/status` | وضعیت جلسه |
| `/report` | دریافت گزارش شورا |
| `/ping` | بررسی سلامت |

## 🎯 پانل‌ها

| پانل | اعضا |
|---|---|
| `--quick` | 🔵 فارابی، ⚕️ رازی |
| `--full` | 🔵 فارابی، ⚕️ رازی، 📚 ابن‌سینا، 🌹 سعدی، 🟠 مولانا |
| `--all` | هر ۱۰ حکیم |

## 👥 اعضای شورا

| حکیم | نقش | توضیح |
|---|---|---|
| 🔵 فارابی | رئیس جلسه | منطق‌گرا، علل اربعه، مدینه فاضله |
| ⚕️ رازی | عضو | تجربه‌گرا، پزشک، شک‌آور |
| 📚 ابن‌سینا | عضو | فلسفه، طب، برهان سینوی |
| 🌹 سعدی | عضو | اخلاق، سیاست عملی، گلستان |
| 🔭 خیام | عضو | ریاضی، نجوم، شک فلسفی |
| ✨ ملاصدرا | عضو | وجودگرا، حرکت جوهری |
| ⚡ امیرکبیر | عضو | عملگرا، نوسازی، دارالفنون |
| 🏛️ خواجه‌نظام | عضو | سیاست، امنیت، سیاست‌نامه |
| 🟢 بیرونی | دبیر جلسه | دانشمند، دقیق، بی‌طرف |
| 🟠 مولانا | عضو | عارف، شهودی، مثنوی |

## ساختار پروژه

```
council-hub/
├── worker/              ← Cloudflare Worker source
│   ├── src/
│   │   ├── index.ts     ← Webhook router + command handler
│   │   ├── council.ts   ← Council orchestration (batch prompts)
│   │   ├── helpers.ts   ← Telegram/Mistral/KV API wrappers
│   │   ├── sages.ts     ← 10 sage profiles + panel config
│   │   └── types.ts     ← TypeScript types
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
├── landing/             ← Netlify landing page
│   ├── index.html       ← معرفی + راهنما
│   └── _redirects
├── README.md
└── LICENSE
```

## معماری فنی

```
Telegram → Webhook → CF Worker → Mistral API (batch, 2-3 calls)
                           ↓
                    KV (keys, sessions, reports)
                           ↓
                    ← Telegram sendMessage
```

- **Batch Mistral:** به‌جای ۲۵ API call، پرامپت‌ها دسته‌ای می‌شوند (۲-۳ batch). هر batch همه حکیم‌های یک فاز را هم‌زمان تولید می‌کند.
- **Cloudflare KV:** Session state, API keys, reports
- **waitUntil:** شورا در پس‌زمینه اجرا می‌شود، وب‌هوک بلافاصله ۲۰۰ برمی‌گرداند
- **زیر ۳۰ ثانیه:** سازگار با Free Plan کلودفلر

## 💰 هزینه

| سرویس | هزینه |
|---|---|
| Cloudflare Workers | رایگان (۱۰۰k req/day) |
| Cloudflare KV | رایگان (۱GB) |
| Mistral AI | ~$0.002/جلسه |

## 📄 لایسنس

MIT
