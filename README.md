# PerafAI Backend 🧠 (Performance Intelligence Engine)

This repository contains the core logic for the **PerafAI** performance analysis system. It orchestrates synthetic Lighthouse audits, processes real-time telemetry from the `ai-perf-sdk`, and powers the **RAG (Retrieval-Augmented Generation)** pipeline for performance reasoning.

## 🚀 Core Technologies
- **Runtime**: Node.js & Express
- **Database**: MongoDB Atlas (Session & User data)
- **Vector DB**: Pinecone (Performance Context Storage)
- **AI Models**: Groq (Llama 3.3 70B) & Hugging Face (Embeddings)
- **Artifacts**: Cloudinary (Report Archival)
- **Observability**: OpenTelemetry & Lighthouse

## 🏗️ Architecture & Features
- **Integrated RAG Pipeline**: Ingests API latency data and Lighthouse metrics into a high-dimensional vector space for grounded AI analysis.
- **Protobuf Telemetry Parser**: Efficiently handles serialized telemetry traces from the custom SDK.
- **Asynchronous Job Orchestration**: Fire-and-forget Lighthouse audits ensuring high API responsiveness.
- **Cloud-Native Design**: Fully configured for seamless deployment on **Render**.

## 📦 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file based on the following template:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PINECONE_API_KEY=your_pinecone_key
PINECONE_INDEX=performance-telemetry
GROQ_API_KEY=your_groq_key
HF_TOKEN=your_huggingface_token
CLOUDINARY_URL=your_cloudinary_url
```

### 3. Run the Server
```bash
npm run dev
```

## 🛠️ API Endpoints
- `POST /api/analysis/start`: Initiate a new audit.
- `POST /api/telemetry`: Receive SDK telemetry traces.
- `GET /api/analysis/:id`: Fetch session metrics and AI insights.

---
Part of the [PerafAI Ecosystem](https://prfeai-backend.onrender.com).
