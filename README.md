# 💰 Labour Expense Bot

WhatsApp expense submission bot using LetsBot + Google Sheets. No AI required — guided step-by-step flow.

---

## How It Works

Labour sends a WhatsApp message → Bot guides them through 4 questions → Expense logged to Google Sheets → Confirmation sent back.

```
Labour (WhatsApp) → LetsBot → This server → Google Sheets
                                    ↓
                             Confirmation back
```

---

## Setup Guide

### Step 1 — Google Sheets (Service Account)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google Sheets API**
4. Go to **IAM & Admin → Service Accounts → Create Service Account**
5. Give it a name (e.g. `expense-bot`)
6. Click **Keys → Add Key → JSON** — download the file
7. Open your Google Sheet → Share it with the service account email (e.g. `expense-bot@yourproject.iam.gserviceaccount.com`) as **Editor**
8. Copy the Sheet ID from the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

### Step 2 — LetsBot

1. Log in to [LetsBot](https://app.letsbot.net)
2. Go to **Settings → API** → copy your **API Token** and **Instance ID**
3. Go to **Webhooks → Add Webhook**
4. Set URL to: `https://your-railway-url.up.railway.app/webhook`
5. Set trigger to: **Incoming Messages**

### Step 3 — Deploy to Railway

1. Push this folder to a GitHub repo
2. Go to [Railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add these environment variables in Railway dashboard:

| Variable | Value |
|---|---|
| `LETSBOT_TOKEN` | Your LetsBot API token |
| `LETSBOT_INSTANCE` | Your LetsBot instance ID |
| `GOOGLE_SHEET_ID` | Sheet ID from URL |
| `GOOGLE_SHEET_NAME` | Tab name (default: `Expenses`) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON content from downloaded key file (paste as one line) |

4. Railway auto-deploys. Copy your public URL (e.g. `https://expense-bot-production.up.railway.app`)
5. Paste that URL into LetsBot webhook

---

## Labour Experience

```
Bot: Hi Ahmed! Let's log your expense.

     Step 1 of 4 — Category
     1. Petrol / Transport
     2. Food / Meals
     3. Tools / Materials
     ...

Labour: 1

Bot: Step 2 of 4 — Amount
     How much did you spend? (in AED)

Labour: 120

Bot: Step 3 of 4 — Date
     Reply with: today / yesterday / 02-Sep

Labour: today

Bot: Step 4 of 4 — Description
     Add a short note.

Labour: Site visit to Al Quoz

Bot: Please confirm:
     Category: Petrol / Transport
     Amount: AED 120.00
     Date: 02 Sep 2026
     Note: Site visit to Al Quoz

     Reply YES to submit or NO to cancel.

Labour: yes

Bot: 🎉 Expense logged! Reference: EXP-20260902-A3F1
```

---

## Google Sheet Output

| Ref | Name | Phone | Category | Amount (AED) | Date | Description | Submitted At |
|---|---|---|---|---|---|---|---|
| EXP-20260902-A3F1 | Ahmed | 971501234567 | Petrol / Transport | 120.00 | 02 Sep 2026 | Site visit to Al Quoz | 2026-09-02T08:30:00Z |

---

## Local Development

```bash
npm install
cp .env.example .env
# Fill in .env values
npm run dev
```

Test with curl:
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"phone":"971501234567","message":"hello","name":"Ahmed"}'
```
