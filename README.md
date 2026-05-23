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

## 🏗️ Architecture & Approach

### **Architecture Overview**
This application utilizes a modern, decoupled Full-Stack architecture:
1. **Client (Next.js/React):** Manages user interactions, form validations, and global state via **Zustand**. Real-time progress bars are rendered via **Socket.IO** clients connecting to the backend.
2. **API Layer (Express/Next.js routes):** Handles incoming REST requests. Instead of blocking the main thread while the LLM generates content, the API instantly queues a job using **BullMQ** and returns a `jobId`.
3. **Message Queue & Cache (Redis):** Acts as the backbone for BullMQ, holding pending AI generation jobs and caching frequently accessed static assignment templates.
4. **Worker Process:** A background worker constantly polls the Redis queue, takes jobs, communicates with the LLM APIs (Gemini/Groq), parses the responses into structured JSON, and saves the final result to **MongoDB**.
5. **Real-time Notifications:** Once the background worker saves the database record, it triggers an event over **Socket.IO** to notify the specific user's browser that their assessment is ready to view.

### **Technical Approach**
- **Structured LLM Outputs:** Rather than risking raw, malformed text responses from AI models, we heavily utilize JSON-schema enforcement in our prompts to guarantee structured responses (Sections, Difficulty, Marks).
- **Graceful Error Handling:** If an LLM response times out or hallucinates data, the background worker safely catches the error, re-queues the job if necessary, and alerts the frontend gracefully.
- **Responsive Fluid UI:** The user interface heavily utilizes Tailwind CSS `flex-wrap` and mobile-first container sizing to ensure the complex assessment layouts remain beautiful and readable on both Desktop and Mobile devices.

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
