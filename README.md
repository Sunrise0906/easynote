# Recall — AI Note-Taking Assistant

Turn **live recordings, audio/video files, YouTube links, PDFs, images and pasted text** into structured notes, summaries, key points, **flashcards, quizzes, mind maps** and an **AI chat tutor** grounded in your material — with translation into 15+ languages, folders, sharing and export.

A complete full-stack implementation (Next.js App Router + TypeScript + Tailwind) with local file-based storage. No database required.

## 快速开始 (Quick start)

```bash
npm install
cp .env.example .env.local   # 填入 ANTHROPIC_API_KEY(可选,但 AI 功能需要)
npm run dev                  # http://localhost:3000
```

- 打开 http://localhost:3000 → 营销主页
- 登录页内置演示账号 **demo@easynote.local / demo1234**,含一条完整示例笔记(笔记/转录/闪卡/测验/思维导图全部可用,无需任何 API key)
- 也可以「Continue as guest」一键进入

### 配置 (`.env.local`)

| 变量 | 作用 | 是否必需 |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | AI 笔记、摘要、闪卡、测验、对话、翻译、图片/扫描 PDF 识别 | AI 功能必需 |
| `ANTHROPIC_MODEL` | Claude 模型(默认 `claude-opus-4-8`) | 否 |
| `OPENAI_API_KEY` | 上传音频/视频文件的转写(Whisper) | 否(现场录音不需要) |
| `STT_API_KEY` / `STT_BASE_URL` / `STT_MODEL` | 任意 OpenAI 兼容转写服务(如 Groq) | 否 |
| `DATA_DIR` | 数据目录(默认 `./data`) | 否 |

没有配置任何 key 时:落地页、账号系统、YouTube 字幕抓取、PDF 文本提取、现场录音转写(浏览器内)、演示笔记全部可用;AI 生成类功能会显示清晰的配置提示。

## Features

**Capture** — six input types
- 🎙️ Live recording with real-time in-browser transcription (Web Speech API) + audio playback
- 🎧 Audio / 🎬 video file upload → Whisper-compatible transcription with timestamps
- ▶️ YouTube link → captions fetched automatically, video embedded & time-synced
- 📄 PDF → per-page text extraction (scanned PDFs fall back to Claude vision)
- 🖼️ Image (slides, whiteboards, handwriting) → Claude vision transcription
- 📝 Pasted text

**Understand & study**
- Structured AI notes (overview / sections / key takeaways) — editable Markdown
- Summary + key points card
- Time-stamped transcript with search, copy, and click-to-seek into the audio/video
- Flashcards (flip, shuffle, got-it tracking, regenerate)
- Multiple-choice quizzes with explanations and a results screen
- Interactive mind map built from the note structure (collapse/expand, pan/zoom, SVG export)
- AI chat tutor per note (streaming, grounded in the transcript, history saved)
- One-click translation of notes into 15+ languages (cached per language)

**Organize & share**
- Folders, search, rename, move, delete
- Public read-only share links (revocable)
- Export as Markdown / TXT / transcript / JSON
- Starter vs Pro plans with usage quotas and a demo checkout (no real payments)
- Email/password accounts + guest mode (scrypt hashing, cookie sessions)

## Architecture

```
src/
  app/
    (marketing)/   home, features, price, faq, about, blog, terms, privacy
    (app)/         notes dashboard, note workspace, recording, settings
    login/         sign in / sign up / guest
    share/[token]/ public read-only note view
    api/           REST API (auth, notes, upload, generate, chat SSE,
                   translate, share, export, media w/ Range, folders, billing)
  components/      marketing + app UI (tabs, player, mindmap, recorder…)
  lib/
    ai/            Claude client, generation prompts, chat streaming
    ingest/        pipeline: youtube captions, pdf, whisper, plus job runner
    store.ts       JSON-file persistence (users, sessions, folders, notes)
    auth.ts        scrypt + cookie sessions
data/              runtime data (gitignored): users, notes, uploads
```

- **AI**: Anthropic Claude (`claude-opus-4-8` by default) via the official SDK; structured outputs (JSON schema) for flashcards/quiz/notes; streaming SSE for chat; prompt-cached note context.
- **Processing** runs in-process in the background; the client polls note status (`pending → transcribing → generating → ready/error`) and shows step-by-step progress.
- **Storage** is plain JSON files with atomic writes and per-file async locks — easy to inspect, back up, or reset (`rm -rf data`).

## Deployment 部署

The app is a single long-running Node server with file-based storage under `DATA_DIR` (default `./data`, `/data` in Docker). **Deploy it anywhere that gives you a persistent volume** — it is not designed for serverless platforms (Vercel/Netlify functions have no shared writable disk).

### Docker (any VPS)

```bash
docker compose up -d --build
# data persists in the `easynote-data` volume; set keys in .env or the environment
```

### Fly.io (recommended, ~free tier)

```bash
fly launch --copy-config --no-deploy   # uses the included fly.toml
fly volumes create easynote_data --size 1
fly secrets set ANTHROPIC_API_KEY=sk-ant-... APP_URL=https://<app>.fly.dev
fly deploy
```

Continuous deployment: add a `FLY_API_TOKEN` repo secret and set the `FLY_DEPLOY_ENABLED=true` repository variable — `.github/workflows/deploy-fly.yml` deploys on every push to `main`.

### Render / Railway

- **Render**: New → Blueprint → point at this repo (`render.yaml` included; persistent disk requires a paid plan).
- **Railway**: New project → Deploy from repo (Dockerfile is auto-detected) → add a volume mounted at `/data` → set env vars.

### Production checklist

- `ANTHROPIC_API_KEY` set (AI features), optional `OPENAI_API_KEY`/`STT_*` (uploaded-file transcription)
- `APP_URL=https://your-domain` (share links, sitemap, OG metadata)
- Volume mounted at `DATA_DIR` — this is all user data; back it up by copying the directory
- Health probe: `GET /api/health`
- Single instance only: the in-process job runner, file locks and rate limiter assume one running instance. Scale up (bigger machine), not out.

## Ops notes 运维说明

- Sessions/rate limits are per-instance and in-memory/file-based — restart-safe except in-flight note processing, which is auto-marked as interrupted with a one-click retry.
- Auth endpoints are rate-limited per IP; cookies are `HttpOnly` + `Secure` in production.
- Security headers (nosniff, frame-deny, referrer policy, permissions policy) are set globally.

## Notes & limits

- Uploaded-file transcription uses an OpenAI-compatible endpoint and inherits its 25 MB audio limit; live recording avoids this entirely.
- YouTube import requires the video to have captions (auto-captions included).
- Web Speech API live transcription works best in Chrome/Edge.
- The Pro "checkout" is a demo — it flips your local account's plan without payment.
