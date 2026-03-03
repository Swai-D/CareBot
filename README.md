# 🤖 CareBot — Customer Care AI

CareBot ni mfumo wa kisasa wa kusaidia biashara kuhudumia wateja wao kupitia WhatsApp kwa kutumia Artificial Intelligence (AI). Mfumo huu unatumia **OpenAI (via OpenClaw)** kujibu maswali ya wateja saa 24/7, ku-manage mazungumzo, na kutoa analytics za biashara yako.

## 🚀 Sifa Kuu (Key Features)

*   **WhatsApp Integration (Baileys QR Bridge):** Unganisha WhatsApp yako halisi kwa ku-scan QR code moja kwa moja kwenye dashibodi. Hakuna haja ya Meta Cloud API (Approved).
*   **AI Agent Builder:** Tengeneza utambulisho wa agent wako (Jina, Tone ya maongezi, na System Prompt).
*   **FAQ Management:** Fundisha AI yako maswali ya mara kwa mara ya biashara yako ili iweze kujibu kwa usahihi.
*   **Real-time Dashboard:** Fuatilia mazungumzo yote yanayoingia na kutoka, na uweze kuingilia kati (human handoff) inapobidi.
*   **Billing ya Kitanzania (TZS):** Mifumo ya malipo na vifurushi (Tiers) vilivyowekwa kwa sarafu ya Shilingi ya Tanzania.
    *   **Free:** 100 messages/mwezi (TZS 0)
    *   **Starter:** 1,000 messages/mwezi (TZS 25,000)
    *   **Growth:** 5,000 messages/mwezi (TZS 75,000)
    *   **Pro:** Unlimited messages (TZS 150,000)

## 🛠 Tech Stack

*   **Frontend:** Next.js 14 (App Router), Lucide React (Icons), Recharts (Analytics).
*   **Backend:** Next.js API Routes.
*   **Database:** MySQL ikiwa na **Prisma ORM**.
*   **WhatsApp:** Baileys Library (Multi-device support).
*   **AI:** OpenAI API (GPT-4o) via OpenClaw layer.
*   **Authentication:** JWT (JSON Web Tokens) kwa ajili ya usalama wa session.

## 📦 Jinsi ya Kuanza (Setup)

### 1. Clone Repository
```bash
git clone https://github.com/Swai-D/CareBot.git
cd CareBot
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Mazingira (Environment Variables)
Tengeneza faili la `.env` na uweke vigezo hivi:
```env
DATABASE_URL="mysql://root:password@localhost:3306/carebot_db"
JWT_SECRET="tengeneza_secret_yako_hapa"
OPENAI_API_KEY="sk-..."
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```
Fungua [http://localhost:3000](http://localhost:3000) kwenye browser yako.

## 📸 Screenshots
*(Coming soon...)*

## 🤝 Changia (Contributing)
Unakaribishwa kuchangia kuboresha CareBot! Fungua *Issue* au tuma *Pull Request*.

## 📄 Leseni (License)
MIT License.

---
© 2026 CareBot — All Rights Reserved.
