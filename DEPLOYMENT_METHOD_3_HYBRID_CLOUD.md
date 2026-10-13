# CA Agent 2.0 — Production Deployment & Operations Manual
## Method 3: Hybrid Cloud PaaS (Vercel + Render / Railway)

> **Architecture Target**: Decoupled Cloud PaaS Deployment  
> **Frontend**: React 18 + Vite hosted on **Vercel Edge Network**  
> **Backend**: FastAPI + Uvicorn + Hybrid RAG hosted on **Render** (or **Railway**)  
> **Models**: Google Gemini 1.5/2.5 Flash & Pro + Ollama / SentenceTransformers  
> **Reference**: Section 5 & Section 6 of CA Agent 2.0 Deployment Architecture

---

## 1. Architecture Overview

In a Hybrid Cloud PaaS model, the client-facing single-page application (SPA) and the compute-heavy AI/RAG engine are split across specialized cloud platforms for zero-maintenance scaling:

```mermaid
graph TD
    Client[Taxpayer / CA Browser] -->|HTTPS Requests| Vercel[Vercel Edge CDN<br/>React 18 SPA]
    Vercel -->|Static Assets & Client Routing| Client
    Client -->|API Calls /upload, /ask, /api/itr/*| Render[Render / Railway Web Service<br/>FastAPI Python Backend<br/>(Min 4 GB RAM Plan)]
    Render -->|LLM Reasoning & Flash Extraction| Gemini[Google Gemini API<br/>gemini-1.5-pro / flash]
    Render -->|bge-m3 Embeddings| Ollama[External Ollama Instance<br/>(AWS t3.medium / Hetzner)]
    Render -->|Temporary Statement Files| TempDir[(temp/ Storage Volume)]
    Cron[Automated Cleanup Job<br/>Daily 02:00 AM] -.->|Purge files > 24h| TempDir
```

### Key Advantages
- **Zero Server Management**: No Nginx server blocks or manual SSL renewals required.
- **Instant Global CDN**: Vercel delivers optimized client bundles worldwide.
- **Isolated Compute**: Heavy vector similarity queries and IsolationForest calculations do not impact frontend responsiveness.
- **High Security**: Strict CORS lockdown and ephemeral storage cleanup prevent unauthorized access and disk exhaustion.

---

## 2. Frontend Deployment on Vercel

### Step 2.1: Pre-Deployment Checks
Ensure your repository contains:
- `vercel.json` in the root directory (handles SPA fallback routing and optional proxying).
- Correct environment variable configuration for API endpoints.

### Step 2.2: Push Repository to GitHub
Ensure all code and configuration changes are committed and pushed:
```bash
git add .
git commit -m "feat: configure Vercel SPA rewrites and dynamic API endpoints"
git push origin main
```

### Step 2.3: Import Project in Vercel
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New** > **Project**.
3. Select your GitHub repository (`CA version 2.0` / `ca-agent`).
4. Configure Build and Output Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install` (or `bun install`)

### Step 2.4: Set Environment Variables
In the Vercel **Environment Variables** section, add:
| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://ca-backend.onrender.com` | Base URL of your deployed Render backend |

> **Note**: Replace `https://ca-backend.onrender.com` with your actual Render/Railway backend domain.

### Step 2.5: SPA Routing & Rewrite Configuration (`vercel.json`)
The root `vercel.json` file ensures client-side routing (`/dashboard`, `/itr-chat`, `/itr-filing`) does not return 404 on hard refreshes, while forwarding `/api` and `/upload` traffic:

```json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://ca-backend.onrender.com/api/$1" },
    { "source": "/upload", "destination": "https://ca-backend.onrender.com/upload" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 3. Backend Deployment on Render / Railway

### Step 3.1: Create Render Web Service
1. Navigate to the [Render Dashboard](https://dashboard.render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository.
4. Choose your deployment runtime:
   - **Option A (Docker - Recommended)**: Select **Docker**. Render automatically detects `Dockerfile.backend`.
   - **Option B (Native Python 3.11)**:
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn api:app --host 0.0.0.0 --port $PORT --workers 2`

### Step 3.2: Instance Sizing & RAM Requirements
> [!IMPORTANT]
> **Select an instance with at least 4 GB RAM** (e.g., Render **Standard** plan or Railway Pro).
> Precomputed ICAI embeddings (`embeddings_foundation.joblib`, `embeddings_Intermediate.joblib`, `embeddings_Final.joblib`) together with scikit-learn models consume ~2.2 GB of memory upon initialization. Starter/Free instances (512 MB) will crash with **OOM (Out Of Memory) Exit Code 137**.

### Step 3.3: Set Backend Environment Variables
In Render/Railway, configure the following environment variables:

| Variable | Recommended Value | Description |
| :--- | :--- | :--- |
| `PYTHONUNBUFFERED` | `1` | Real-time container log streaming |
| `GEMINI_API_KEY` | `AIzaSy...` | Primary Gemini API Key for tax reasoning |
| `DEV_GEMINI_API_KEY` | `AIzaSy...` | Fallback Gemini API Key |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app,http://localhost:8080` | Permitted frontend domains for CORS |
| `OLLAMA_URL` | `http://<your-ollama-host>:11434` | External Ollama endpoint |
| `UPLOAD_FOLDER` | `temp` | Upload directory for bank statements |

### Step 3.4: Deploy via `render.yaml` Blueprint (Optional 1-Click Setup)
You can deploy directly using the bundled [render.yaml](file:///d:/OG_PROJECTS/CA%20version%202.0/render.yaml) file:
1. In Render, select **Blueprints**.
2. Select your repository.
3. Render will provision the web service with predefined Dockerfile, health check path (`/docs`), and resource settings.

### Step 3.5: Ollama Setup in Cloud PaaS
Since cloud PaaS web services run ephemeral containers without dedicated GPUs, choose one of these strategies for vector embeddings (`bge-m3:latest`):
1. **Lightweight Compute VM (Recommended)**: Deploy Ollama on a low-cost cloud instance (AWS `t3.medium` or Hetzner `CPX21` ~$6/month):
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ollama pull bge-m3:latest
   # Bind to 0.0.0.0 in systemd and protect via firewall or basic auth
   ```
   Set `OLLAMA_URL=http://<instance-ip>:11434` in Render.
2. **In-Process Embeddings (Roadmap Step 5)**: Transition to local SentenceTransformers (`all-MiniLM-L6-v2`), eliminating Ollama dependencies completely.

---

## 4. Critical Production Hardening & Code Adjustments

### 4.1 Remediation of Hardcoded Local Endpoints
During code auditing, hardcoded `http://localhost:8000` URLs were identified and remediated in two critical ITR pages:

1. **[src/pages/ITRFilingPage.tsx](file:///d:/OG_PROJECTS/CA%20version%202.0/src/pages/ITRFilingPage.tsx)**:
   - **Issue**: Upload and analysis endpoints called `http://localhost:8000/upload` and `http://localhost:8000/api/itr/analyze`.
   - **Resolution**:
     ```typescript
     const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
     const uploadRes = await fetch(`${apiBase}/upload`, { method: 'POST', body: formData });
     const analyzeRes = await fetch(`${apiBase}/api/itr/analyze`, { ... });
     ```

2. **[src/pages/ITRChatPage.tsx](file:///d:/OG_PROJECTS/CA%20version%202.0/src/pages/ITRChatPage.tsx)**:
   - **Issue**: Document ingestion and multi-turn chat called hardcoded local URLs.
   - **Resolution**:
     ```typescript
     const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
     const uploadRes = await fetch(`${apiBase}/upload`, { method: 'POST', body: formData });
     const res = await fetch(`${apiBase}/api/itr/chat`, { ... });
     ```

### 4.2 Production CORS Lockdown ([api.py](file:///d:/OG_PROJECTS/CA%20version%202.0/api.py))
Wildcard CORS (`allow_origins=["*"]`) allows unauthorized third-party origins to access your API. In `api.py`, CORS is now locked down and supports both environment-driven configuration and secure defaults:

```python
# Production CORS Lockdown
cors_env = os.environ.get("ALLOWED_ORIGINS", "").strip()
if cors_env:
    ALLOWED_ORIGINS = [origin.strip() for origin in cors_env.split(",") if origin.strip()]
else:
    ALLOWED_ORIGINS = [
        "https://ca.yourdomain.com",
        "https://ca-agent-frontend.vercel.app",
        "http://localhost:8080",  # Staging / Vite default
        "http://localhost:5173",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
```

### 4.3 Automated Storage Cleanup for `temp/` Directory
Users upload bank statements, Form 16 PDFs, and P&L scans that are parsed into memory. Retaining these files indefinitely causes disk exhaustion and privacy compliance liabilities.

#### Automated Solution A: Python Cleanup Utility ([cleanup_temp.py](file:///d:/OG_PROJECTS/CA%20version%202.0/cleanup_temp.py))
A cross-platform Python script is provided with retention filtering, safety safeguards, and dry-run preview:

```bash
# Preview files that would be purged (older than 24 hours)
python cleanup_temp.py --dry-run --verbose

# Run cleanup (deletes statement files older than 1 day)
python cleanup_temp.py --days 1

# Custom threshold (e.g., delete files older than 6 hours)
python cleanup_temp.py --hours 6
```

#### Automated Solution B: Shell Script ([scripts/cleanup_temp.sh](file:///d:/OG_PROJECTS/CA%20version%202.0/scripts/cleanup_temp.sh))
For Linux hosts and Docker environments:
```bash
chmod +x scripts/cleanup_temp.sh
./scripts/cleanup_temp.sh
```

#### Automated Solution C: Production Daily Cron Job
On your backend host (or via Render Cron Job / crontab), schedule daily execution at 02:00 AM:

```bash
# Open crontab editor
crontab -e

# Option 1: Native find command (standard Linux/VPS)
0 2 * * * find /var/www/ca-agent/temp -type f -mtime +1 -delete

# Option 2: Using the Python cleanup script with log output
0 2 * * * /usr/bin/python3 /app/cleanup_temp.py --days 1 >> /var/log/ca-cleanup.log 2>&1
```

---

## 5. Verification Checklist & Smoke Testing

### Step 5.1: Test CORS Preflight Response
Run a preflight `OPTIONS` request using curl to verify your Vercel domain is accepted:
```bash
curl -I -X OPTIONS "https://ca-backend.onrender.com/upload" \
  -H "Origin: https://ca-agent-frontend.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```
**Expected Response**:
```http
HTTP/1.1 200 OK
access-control-allow-origin: https://ca-agent-frontend.vercel.app
access-control-allow-credentials: true
access-control-allow-methods: GET, POST, OPTIONS
```

### Step 5.2: Test Frontend SPA Direct Routing
In your browser, directly navigate to:
- `https://<your-vercel-app>.vercel.app/itr-filing`
- `https://<your-vercel-app>.vercel.app/itr-chat`
- `https://<your-vercel-app>.vercel.app/dashboard`

Verify that pages load smoothly without `404 Not Found` errors (confirming `vercel.json` rewrites are active).

### Step 5.3: Test Document Upload & Analysis
1. Open the deployed Vercel frontend.
2. Navigate to **ITR Filing** (`/itr-filing`).
3. Upload a sample bank statement PDF (`Statement.pdf`).
4. Verify:
   - Green toast notification: *"Document extracted successfully!"*
   - Recommended return form classification (e.g. ITR-1 / ITR-4) rendered.
   - File was successfully parsed and temporary artifact is eligible for cleanup.

### Step 5.4: Test Storage Cleanup Execution
Test the cleanup script to ensure safe operation:
```bash
python cleanup_temp.py --dry-run
```
Expected output:
```text
[INFO] Scanning target directory: /app/temp
[INFO] Retention threshold: 24.0 hours (1.00 days)
[INFO] DRY-RUN MODE ENABLED: No files will actually be deleted.
============================================================
Cleanup Summary:
  • Files scanned : 4
  • Files removed : 2 (simulated)
  • Disk freed    : 1.45 MB
============================================================
```

---

## 6. Summary of Created & Modified Artifacts

| File | Status | Description |
| :--- | :--- | :--- |
| [vercel.json](file:///d:/OG_PROJECTS/CA%20version%202.0/vercel.json) | **Created** | SPA route rewrite rules & API proxying for Vercel |
| [cleanup_temp.py](file:///d:/OG_PROJECTS/CA%20version%202.0/cleanup_temp.py) | **Created** | Automated temp statement storage cleaner with retention flags |
| [scripts/cleanup_temp.sh](file:///d:/OG_PROJECTS/CA%20version%202.0/scripts/cleanup_temp.sh) | **Created** | Shell cleanup script for Linux crontab and Docker containers |
| [render.yaml](file:///d:/OG_PROJECTS/CA%20version%202.0/render.yaml) | **Created** | Render Blueprint for 1-click cloud backend deployment |
| [src/pages/ITRFilingPage.tsx](file:///d:/OG_PROJECTS/CA%20version%202.0/src/pages/ITRFilingPage.tsx) | **Updated** | Replaced hardcoded `localhost:8000` with dynamic `apiBase` |
| [src/pages/ITRChatPage.tsx](file:///d:/OG_PROJECTS/CA%20version%202.0/src/pages/ITRChatPage.tsx) | **Updated** | Replaced hardcoded `localhost:8000` with dynamic `apiBase` |
| [api.py](file:///d:/OG_PROJECTS/CA%20version%202.0/api.py) | **Updated** | Locked down CORS with `ALLOWED_ORIGINS` environment support |
