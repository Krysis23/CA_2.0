# CA Agent 2.0 — Complete Project Context & Architecture Guide

> **Audience**: AI models, pair programmers, and developers working on the CA Agent codebase.
> **Date**: October 2026
> **Repository**: `CA version 2.0` (Branch: `fyp-extensions`)

---

## 1. Executive Summary & Mission

**CA Agent 2.0** is an enterprise-grade Chartered Accountant AI copilot specialized in **Indian Taxation, GST, Financial Statement Analysis, and Agentic ITR Filing**. 

It transforms complex Indian statutory tax laws (Income Tax Act 1961, Finance Acts, GST statutes, and ICAI curriculum) and raw taxpayer financial artifacts (bank statements, Form 16, P&L statements) into verified tax computations, anomaly flags, and guided return filings.

### Key Capabilities
1. **Interactive Statutory Q&A**: Answers nuanced queries on Indian direct/indirect tax citing specific sections (e.g., Section 44AD presumptive taxation, 80C deductions, 115BAC new tax regime slabs, Section 17(5) blocked ITC).
2. **Multimodal Bank & Statement Ingestion**: Uses Gemini Vision to parse bank statements and extract structured JSON (credits, debits, closing balance, estimated income, and transaction line items).
3. **Transaction Anomaly Detection**: Unsupervised machine learning (`IsolationForest`) flags statistically anomalous inflows/outflows that affect tax audit compliance or advance tax liabilities.
4. **Rolling Conversational Memory**: Compresses multi-turn history into dense financial fact summaries using Gemini Flash so the assistant retains context across lengthy conversations without context window degradation.
5. **Multi-Document Cross-Analysis**: Aggregates metrics across multiple statements to compute combined net cash flows and annual tax liabilities, visualized via Recharts.
6. **Agentic ITR Filing Assistant**: Guided multi-step agent (`ITRAgent`) that classifies the appropriate return form (ITR-1 through ITR-4), detects missing information (Form 16, capital gains statements), auto-fills schedules, and exports filing checklists.
7. **Hybrid RAG + GraphRAG**: Dense vector embeddings + Cross-Encoder reranking + Knowledge graph cross-reference traversal of legal sections.

---

## 2. Technology Stack & Specifications

### Hardware Environment
- Target Environment: Intel Core i5 (12th gen), 16 GB RAM, 4 GB VRAM (Windows 11 / PowerShell).
- Designed for high local efficiency on CPU with optional GPU acceleration.

### Backend Stack
- **Framework**: FastAPI with Uvicorn (HTTP Server running on `127.0.0.1:8000`).
- **Language**: Python 3.11 / 3.13 (`.venv/Scripts/python.exe`).
- **LLM Reasoning**: `google.generativeai` (`gemini-1.5-pro` for deep tax reasoning; `gemini-1.5-flash` for extraction, memory compression, and step classification).
- **Embeddings & Vector Search**:
  - Current baseline: Ollama running `bge-m3:latest` on `http://127.0.0.1:11434`.
  - Roadmap (Step 5): In-process fine-tuned `SentenceTransformer` (`all-MiniLM-L6-v2`) eliminating Ollama.
- **Reranker**: `cross-encoder/ms-marco-MiniLM-L-6-v2` via `sentence-transformers`.
- **GraphRAG**: `networkx` directed graph of Income Tax Act sections (`income_tax_graph.gpickle`, `income_tax_embeddings.joblib`).
- **Machine Learning**: `scikit-learn` (`IsolationForest` for transaction anomaly detection), `numpy`, `pandas`.
- **Corpora Storage**: Joblib serialization (`embeddings_foundation.joblib`, `embeddings_Intermediate.joblib`, `embeddings_Final.joblib`).

### Frontend Stack
- **Framework**: React 18 with TypeScript and Vite (`http://localhost:8080/`, configured in `vite.config.ts`).
- **Styling**: TailwindCSS, CSS Modules, Lucide React icons, Framer Motion animations.
- **Charts & Visualizations**: Recharts (`ResponsiveContainer`, `BarChart`, `PieChart`).
- **State Management**: React Context (`ChatContext`, `AuthContext`) backed by `localStorage`.
- **Routing**: `react-router-dom` v6 with protected routes.

---

## 3. Directory Structure & Key Files

```plaintext
d:/OG_PROJECTS/CA version 2.0/
├── api.py                           # Main FastAPI server: endpoints for /ask, /upload, /api/itr/*
├── ca_agent.py                      # Core CA reasoning engine, prompt orchestration & tax calculations
├── file_handler.py                  # Gemini Vision document extraction & transaction parser
├── memory.py                        # Rolling conversational memory compressor (Gemini 1.5 Flash)
├── anomaly.py                       # IsolationForest unsupervised anomaly detection
├── itr_agent.py                     # 4-step Agentic ITR Filing Assistant state machine
├── search.py                        # Hybrid RAG pipeline (Ollama bge-m3, cosine sim, CrossEncoder)
├── hyde.py                          # Hypothetical Document Embeddings (HyDE) query expansion
├── dev_config.py                    # Environment and fallback configuration
├── requirements.txt                 # Backend Python package requirements
├── package.json                     # Frontend dependencies & npm run scripts
├── vite.config.ts                   # Vite configuration (port 8080, proxy aliases)
│
├── graphRag/                        # GraphRAG knowledge graph module
│   ├── graph_retriever.py           # Multi-hop graph search and cross-reference expansion
│   ├── graph_query_expander.py      # Tax section query parser
│   ├── income_tax_graph.gpickle     # Precomputed NetworkX tax knowledge graph
│   └── income_tax_embeddings.joblib # Knowledge graph node embeddings
│
├── embeddings_foundation.joblib     # Precomputed ICAI Foundation level embeddings
├── embeddings_Intermediate.joblib   # Precomputed ICAI Intermediate level embeddings
├── embeddings_Final.joblib          # Precomputed ICAI Final level embeddings
│
└── src/                             # React TypeScript Frontend
    ├── App.tsx                      # Root component, routing, QueryClient & Context providers
    ├── contexts/
    │   ├── AuthContext.tsx          # User login state & mock/token auth
    │   └── ChatContext.tsx          # Multi-conversation state, file uploads, message persistence
    ├── pages/
    │   ├── Dashboard.tsx            # Main CA Agent workspace page (ChatSidebar + ChatArea)
    │   ├── Login.tsx                # User authentication & auto-redirect
    │   ├── Signup.tsx               # User registration
    │   ├── ITRHubPage.tsx           # Hub for guided ITR workflows & past sessions
    │   ├── ITRChatPage.tsx          # Dedicated guided ITR chat workflow
    │   ├── ITRFilingPage.tsx        # Quick 30-second ITR document drop & analysis
    │   └── NotFound.tsx             # 404 handler
    └── components/
        ├── ChatArea.tsx             # Main chat message feed, suggestion cards & prompt input
        ├── ChatSidebar.tsx          # Session history, New Chat button, nav links (ITR Hub, Dashboard)
        ├── ChatInput.tsx            # Text input, file dropzone attachment & submit handler
        ├── ChatMessage.tsx          # Markdown message renderer, bank summary cards & citations
        ├── Dashboard.tsx            # Multi-document Recharts analytics (Credits vs Debits, Tax, Net)
        ├── BankStatementCard.tsx    # Compact financial card for parsed bank statements
        └── Logo.tsx                 # Branding logo component
```

---

## 4. Subsystem Deep Dive

### 4.1 Reasoning Engine (`ca_agent.py`)
- Receives combined queries (user text + parsed document context + rolling memory summary + retrieved RAG chunks).
- Constructs specialized system instructions for Indian CA domain:
  - References the Income Tax Act 1961, Finance Acts (up to FY 2025-26 / AY 2026-27), GST Act 2017.
  - Slabs: Default new tax regime u/s 115BAC vs old tax regime with Chapter VI-A deductions (80C, 80D, 24(b)).
  - Business taxation: Presumptive schemes u/s 44AD (8%/6%), 44ADA (50%), 44AE.
- Provides `merge_doc_data(docs: list[dict])`: aggregates multiple parsed statements to compute cross-statement totals, net cash flows, and estimated advance tax liabilities.

### 4.2 Document Extraction Pipeline (`file_handler.py`)
- Accepts PDF or image uploads (`png`, `jpg`, `jpeg`, `webp`).
- Converts documents to images using `pdf2image` and sends them to Gemini 1.5 Flash Vision.
- Enforces strict JSON extraction format:
  ```json
  {
    "person_entity": "Full Name or Company",
    "account_number": "Last 4 digits",
    "statement_period": "Mon YYYY - Mon YYYY",
    "opening_balance": "0.00",
    "closing_balance": "0.00",
    "total_credits": "0.00",
    "total_debits": "0.00",
    "tds_deducted": "0.00",
    "estimated_annual_income": "0.00",
    "transactions": [
      {
        "date": "DD Mon YYYY",
        "description": "UPI / NEFT / Salary",
        "amount": "0.00",
        "type": "credit or debit"
      }
    ]
  }
  ```

### 4.3 Anomaly Detection Engine (`anomaly.py`)
- Operates on the extracted `transactions` list.
- Uses `scikit-learn.ensemble.IsolationForest` (`contamination=0.07`, `random_state=42`) on transaction amounts.
- Generates human-friendly rationale for flagged transactions:
  - High ratio vs mean: *"This credit of Rs. 150,000 is 6.2x your average transaction amount. Large one-time amounts may affect advance tax liability."*
  - High standard deviation outlier: *"Statistically unusual — verify this transaction."*
- Appends `flagged_transactions` and summary text directly to the `/upload` response.

### 4.4 Rolling Conversational Memory (`memory.py`)
- Solves context explosion across extended multi-turn conversations.
- Function `build_context(history, keep_recent=6)`:
  - Keeps the last 6 turns (3 Q&A pairs) verbatim.
  - Passes older turns to Gemini 1.5 Flash with `SUMMARY_PROMPT` to compress financial facts (entities, incomes, deductions, decisions reached, pending documents) into under 200 words.
  - Stores compressed summary in `conversation_summary` so the LLM retains facts permanently with minimal token footprint.

### 4.5 Agentic ITR Filing Assistant (`itr_agent.py`)
State machine implementing a 4-step workflow:
1. `classify`: Predicts ITR form (`ITR-1`, `ITR-2`, `ITR-3`, `ITR-4`) based on income sources, salary, capital gains, or business turnover.
2. `gap_fill`: Compares available statement data with required statutory disclosures and prompts for missing items (e.g. Form 16, interest certificates).
3. `pre_fill`: Maps extracted values to statutory ITR schedule fields (Gross Salary, TDS Schedule, Opening/Closing balances).
4. `export`: Generates a structured markdown checklist (`# ITR-X Filing Checklist`) for taxpayer download.

### 4.6 Retrieval Pipeline (`search.py` + `graphRag/`)
1. **HyDE Expansion**: Generates hypothetical legal passage using Gemini Flash to align semantic vectors.
2. **Dense Vector Search**: Embeds user query via Ollama `bge-m3` (1024 dimensions) and performs cosine similarity across ICAI curricula (`Foundation`, `Intermediate`, `Final`).
3. **GraphRAG Expansion**: Traverses directed network of section references (`NetworkX`) to pull cross-referenced provisions (e.g. claiming Section 10(13A) HRA along with Section 24 home loan interest).
4. **Cross-Encoder Reranking**: Scores retrieved chunks against the exact query using `ms-marco-MiniLM-L-6-v2` and sorts by relevance rank.

---

## 5. API Endpoints Contract

| Endpoint | Method | Input Payload | Output Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/ask` | `POST` | `AskRequest`<br>`{ question, history, doc_data, plain_file_texts, conversation_summary }` | `{ answer, summary, merged_data, retrieved_chunks }` | Main RAG question-answering endpoint |
| `/upload` | `POST` | `multipart/form-data`<br>`file: UploadFile`, `context?: string` | `{ doc_item, doc_data, summary_message, plain_text_append }` | Parses statement, extracts fields & flags anomalies |
| `/api/itr/chat` | `POST` | `{ message, history, context, doc_data }` | `{ reply }` | Conversational guided ITR assistance |
| `/api/itr/analyze` | `POST` | `{ doc_data }` | `{ form, confidence, rationale, checklist, prefilled }` | Direct ITR classification & checklist extraction |
| `/itr` | `POST` | `{ doc_data, agent_state }` | `{ message, step_complete, state, checklist? }` | Step-by-step ITRAgent state machine |
| `/calendar` | `POST` | `{ doc_data }` | `{ deadlines: [{ name, due_date, type, note }] }` | Generates upcoming tax & GST deadlines |

---

## 6. Frontend Navigation & Route Architecture

| Route | Page / Component | Purpose |
| :--- | :--- | :--- |
| `/login` | `src/pages/Login.tsx` | Authentication screen; auto-redirects authenticated users to `/chat` |
| `/signup` | `src/pages/Signup.tsx` | Account registration; auto-redirects authenticated users to `/chat` |
| `/chat` | `src/pages/Dashboard.tsx` | **Main App Dashboard** (Sidebar + Chat Area + Welcome Prompts) |
| `/dashboard` | `src/components/Dashboard.tsx` | **Financial Overview** (Multi-doc bar charts, pie charts, KPI cards) |
| `/itr-hub` | `src/pages/ITRHubPage.tsx` | ITR Hub launcher with filing options & past sessions |
| `/itr-chat` | `src/pages/ITRChatPage.tsx` | Step-by-step conversational ITR filing assistant |
| `/itr` | `src/pages/ITRFilingPage.tsx` | Quick statement upload & instant 30-second ITR checklist |

> **Crucial Routing Rule**:
> In `src/components/ChatArea.tsx`, the welcome screen renders when `!activeConversation || activeConversation.messages.length === 0`.
> Never re-introduce an unconditional redirect to `/itr-hub` when `!activeConversation`, as this breaks login navigation.

---

## 7. How to Run & Verify the Stack Locally

### Terminal 1: Ollama Embedding Service
```powershell
ollama serve
# Ensure bge-m3 is downloaded: ollama list
```

### Terminal 2: FastAPI Backend
```powershell
cd "d:\OG_PROJECTS\CA version 2.0"
.\.venv\Scripts\python.exe -m uvicorn api:app --reload --host 127.0.0.1 --port 8000
```
- Health Check: `http://127.0.0.1:8000/docs` (Swagger UI).

### Terminal 3: React / Vite Frontend
```powershell
cd "d:\OG_PROJECTS\CA version 2.0"
npm run dev
```
- Vite Dev Server runs on **`http://localhost:8080/`** (configured in `vite.config.ts`).

---

## 8. Implementation Guide (12-Step Roadmap) Status

| Step | Feature | Key Artifacts | Current Status |
| :--- | :--- | :--- | :--- |
| **Step 1** | Rolling Conversational Memory | `memory.py`, `api.py`, `ChatContext.tsx` | **Completed** |
| **Step 2** | Multi-Document Cross-Analysis | `ca_agent.py`, `components/Dashboard.tsx` | **Completed** |
| **Step 3** | Anomaly Detection on Transactions | `anomaly.py`, `file_handler.py`, `api.py` | **Completed** |
| **Step 4** | RAGAS Evaluation Harness | `eval_dataset.json`, `run_eval.py` | **Pending** |
| **Step 5** | Fine-Tuned Domain Embeddings | `fine_tune_embeddings.py`, `search.py` | **Pending** (Will replace Ollama) |
| **Step 6** | GraphRAG Hybrid Retrieval | `build_tax_graph.py`, `graph_retrieve.py` | **Partially Built** (`graphRag/` module present) |
| **Step 7** | Hallucination Guard & NLI Badges | `hallucination_guard.py`, `ChatMessage.tsx` | **Pending** |
| **Step 8** | Agentic ITR Filing Assistant | `itr_agent.py`, `ITRWizard.tsx` | **In Progress** (Backend exists, UI hub created) |
| **Step 9** | Compliance Calendar & Alerts | `compliance_calendar.py`, `CalendarView.tsx` | **Pending** |
| **Step 10**| Voice Interface (Web Speech API) | `useSpeech.ts`, `ChatInput.tsx` | **Pending** |
| **Step 11**| Containerisation | `Dockerfile`, `docker-compose.yml` | **Pending** |
| **Step 12**| Cloud Deployment | Render, Vercel, CORS | **Pending** |

---

## 9. Golden Rules for Future Modifications

1. **Preserve Documentation & Comments**: Always retain existing domain comments, citations, and docstrings.
2. **Never Break RAG Flow**: When editing `search.py` or `api.py`, ensure `retrieved_chunks` preview records are returned alongside `answer`.
3. **Keep Port Allocations Intact**:
   - Backend expects port `8000`.
   - Vite is configured for port `8080` in `vite.config.ts`.
   - Ollama listens on port `11434`.
4. **Step 5 Milestone**: Do not delete Ollama calls in `search.py` until the fine-tuned domain model checkpoint in `models/icai-embeddings` has been trained and `.joblib` files are rebuilt.
