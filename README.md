# VedaAI - AI Teacher Assessment & Grading Platform

VedaAI is a full-stack, AI-powered platform built exclusively for teachers. It drastically reduces the time spent on administrative tasks by automatically generating structured question papers, lesson plans, and grading rubrics using state-of-the-art Large Language Models (LLMs).

## 🚀 Features

- **Automated Question Papers:** Generate structured question papers based on Subject, Class Level, and specific Question Types.
- **Intelligent Routing:** Automatically routes complex mathematical queries to powerful 70B parameter models (Groq) and relies on precise numerical verification engines (Gemini) for 100% accuracy.
- **Lesson Plan Generator:** Create detailed, week-by-week classroom instruction plans with objectives and required materials.
- **AI Grading Helper:** Grade student answers instantly against predefined rubrics using critical thinking models.
- **PDF Export:** Download cleanly formatted, ready-to-print PDFs with auto-generated Answer Keys.
- **Cloud Synchronization:** All assignments, groups, and rubrics are saved seamlessly to MongoDB.

## 🛠️ Technology Stack

- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS
- **Backend:** Next.js Serverless API Routes
- **Database:** MongoDB (Mongoose)
- **WebSockets:** Socket.IO (for real-time generation progress bars)
- **Background Jobs:** BullMQ & Upstash Redis
- **AI Providers:** Groq (Llama-3), Google Gemini 2.5 Flash

## ⚙️ Setup & Deployment (Render)

This application is fully optimized for deployment on [Render](https://render.com).

1. **Fork or Clone this repository.**
2. **Create a new Web Service on Render** and connect your GitHub repository.
3. **Configure Build Settings:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
4. **Environment Variables:**
   You **must** configure the following environment variables in your Render Dashboard (do not push your `.env.local` file):

   ```env
   # Security
   JWT_SECRET=your_secure_random_string

   # Database (MongoDB)
   MONGO_URI=mongodb+srv://<username>:<password>@cluster...

   # Redis (Upstash) for background tasks
   REDIS_URL=rediss://...

   # AI Providers
   GROQ_API_KEY=gsk_...
   NEXT_PUBLIC_GROQ_API_KEY=gsk_...
   GEMINI_API_KEY=AIza...
   OCR_API_KEY=...
   NEXT_PUBLIC_OCR_API_KEY=...
   ```

5. **Deploy:** Click deploy. Render will automatically install dependencies, compile TypeScript, build the Next.js static pages, and start your WebSockets server.

## 👨‍💻 Local Development

To run this project locally on your machine:

1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Create a `.env.local` file in the root directory and fill in your API keys (see above).
4. Run `npm run dev` to start the local server.
5. Open `http://localhost:3000` in your browser.

---

*Built with ❤️ for Educators.*
