"""
generate_deployment_pdf.py
──────────────────────────────────────────────────────────────────────────────
Generates a comprehensive, enterprise-grade, publication-quality PDF
deployment guide for CA Agent 2.0 using ReportLab.
──────────────────────────────────────────────────────────────────────────────
"""

import os
import sys
from datetime import datetime

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    KeepTogether,
    PageBreak,
    HRFlowable,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY


class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute total pages and draw consistent
    running headers and footers with 'Page X of Y'.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_decorations(self, page_count):
        page_num = self._pageNumber
        width, height = letter

        # Footer on all pages
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        
        # Footer line
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(36, 32, width - 36, 32)
        
        self.drawString(36, 20, "CA Agent 2.0 • Complete Production Deployment Manual")
        page_str = f"Page {page_num} of {page_count}"
        self.drawRightString(width - 36, 20, page_str)

        # Running header on page 2 and onwards
        if page_num > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#1E293B"))
            self.drawString(36, height - 26, "CA AGENT 2.0 — PRODUCTION DEPLOYMENT & OPERATIONS GUIDE")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawRightString(width - 36, height - 26, "FastAPI • React 18 • Ollama • Gemini 2.5")
            self.setStrokeColor(colors.HexColor("#E2E8F0"))
            self.setLineWidth(0.5)
            self.line(36, height - 31, width - 36, height - 31)

        self.restoreState()


def build_pdf(filename="CA_Agent_2_0_Deployment_Guide.pdf"):
    # Page setup: Letter (8.5 x 11 inches), 36pt margins (0.5 inch)
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=42,
        bottomMargin=42,
    )

    styles = getSampleStyleSheet()

    # Enterprise Color Palette
    PRIMARY = colors.HexColor("#0F172A")          # Slate 900
    SECONDARY = colors.HexColor("#1E293B")        # Slate 800
    ACCENT_BLUE = colors.HexColor("#2563EB")      # Blue 600
    ACCENT_DARK_BLUE = colors.HexColor("#1D4ED8") # Blue 700
    TEAL = colors.HexColor("#0D9488")             # Teal 600
    MUTED_TEXT = colors.HexColor("#475569")       # Slate 600
    CARD_BG = colors.HexColor("#F8FAFC")          # Slate 50
    BORDER_COLOR = colors.HexColor("#CBD5E1")     # Slate 300
    CODE_BG = colors.HexColor("#0F172A")          # Code block background
    CODE_FG = colors.HexColor("#F1F5F9")          # Code text color

    # Typography Hierarchy
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12.5,
        textColor=PRIMARY,
        spaceAfter=5,
    )

    doc_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=21,
        leading=25,
        textColor=PRIMARY,
        spaceAfter=3,
    )

    doc_subtitle = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10.5,
        leading=14.5,
        textColor=ACCENT_BLUE,
        spaceAfter=8,
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16.5,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=5,
        keepWithNext=True,
    )

    subsection_heading = ParagraphStyle(
        'SubSectionHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=ACCENT_DARK_BLUE,
        spaceBefore=7,
        spaceAfter=3,
        keepWithNext=True,
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=7,
        leading=9,
        textColor=CODE_FG,
    )

    callout_text = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=PRIMARY,
    )

    table_header = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white,
    )

    table_cell = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.2,
        leading=9.5,
        textColor=PRIMARY,
    )

    table_cell_code = ParagraphStyle(
        'TableCellCode',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=6.8,
        leading=8.8,
        textColor=ACCENT_DARK_BLUE,
    )

    story = []

    def make_callout(title, text, alert_type="info"):
        bg = colors.HexColor("#EFF6FF") if alert_type == "info" else (
             colors.HexColor("#FEF3C7") if alert_type == "warning" else colors.HexColor("#ECFDF5")
        )
        bar_color = ACCENT_BLUE if alert_type == "info" else (
             colors.HexColor("#D97706") if alert_type == "warning" else TEAL
        )
        
        content = [
            Paragraph(f"<b>{title}</b>", ParagraphStyle('CTitle', parent=callout_text, fontName='Helvetica-Bold', textColor=bar_color)),
            Spacer(1, 2),
            Paragraph(text, callout_text)
        ]
        
        t = Table([[content]], colWidths=[letter[0] - 72])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg),
            ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
            ('LINELEFT', (0,0), (0,-1), 3.5, bar_color),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 7),
            ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ]))
        return t

    def make_code_box(code_str):
        lines = code_str.strip().split("\n")
        para_list = []
        for line in lines:
            escaped = (
                line.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace(" ", "&nbsp;")
            )
            para_list.append(Paragraph(escaped, code_style))
        
        t = Table([[para_list]], colWidths=[letter[0] - 72])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), CODE_BG),
            ('BOX', (0,0), (-1,-1), 0.75, colors.HexColor("#334155")),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 7),
            ('RIGHTPADDING', (0,0), (-1,-1), 7),
        ]))
        return t

    # ─────────────────────────────────────────────────────────────────────────
    # COVER / HEADER BLOCK
    # ─────────────────────────────────────────────────────────────────────────
    badge_style = ParagraphStyle(
        'Badge',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.white,
    )
    badge_table = Table([[Paragraph("ENTERPRISE ARCHITECTURE &amp; OPERATIONS SPECIFICATION", badge_style)]], colWidths=[270])
    badge_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), ACCENT_BLUE),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 4))

    story.append(Paragraph("CA Agent 2.0: Full Production Deployment Guide", doc_title))
    story.append(Paragraph("End-to-End Walkthrough: Architecture, Linux VPS / Systemd, Docker Microservices, Cloud PaaS, Nginx &amp; Hardening", doc_subtitle))
    
    meta_data = [
        [
            Paragraph("<b>Platform:</b> CA Agent 2.0 (Chartered Accountant AI)", table_cell),
            Paragraph(f"<b>Date:</b> {datetime.now().strftime('%B %Y')}", table_cell),
            Paragraph("<b>Stack:</b> React 18, Vite, FastAPI, Ollama, Gemini", table_cell),
        ],
        [
            Paragraph("<b>Target Environments:</b> Ubuntu 22.04/24.04, Docker, Vercel/Render", table_cell),
            Paragraph("<b>Roadmap:</b> Step 11 &amp; 12 Production Rollout", table_cell),
            Paragraph("<b>Security:</b> TLS 1.3, Scoped CORS, Non-Root Daemons", table_cell),
        ]
    ]
    t_meta = Table(meta_data, colWidths=[(letter[0]-72)/3]*3)
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), CARD_BG),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 8))

    # ─────────────────────────────────────────────────────────────────────────
    # SECTION 1: ARCHITECTURE OVERVIEW & HARDWARE PREREQUISITES
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("1. System Architecture &amp; Hardware Sizing", section_heading))
    story.append(Paragraph(
        "<b>CA Agent 2.0</b> is an enterprise chartered accountant copilot designed for Indian taxation, GST, bank statement anomaly detection, "
        "and guided ITR filing. Deploying the system requires coordinating four coordinated tiers: the <b>Client Frontend</b>, "
        "the <b>FastAPI Application Server</b>, the <b>Ollama Vector Embedding Engine</b>, and the <b>Google Gemini Multimodal API</b>.",
        body_style
    ))

    arch_table_data = [
        [Paragraph("Tier", table_header), Paragraph("Service &amp; Framework", table_header), Paragraph("Default Port", table_header), Paragraph("Role &amp; Resource Footprint", table_header)],
        [
            Paragraph("<b>Frontend</b>", table_cell),
            Paragraph("React 18 + Vite + Tailwind + Recharts", table_cell),
            Paragraph("8080 (Dev)<br/>80 / 443 (Prod)", table_cell_code),
            Paragraph("Static SPA bundle served via Nginx. Handles chat sessions, multi-document financial dashboards, and guided ITR wizard.", table_cell)
        ],
        [
            Paragraph("<b>Backend API</b>", table_cell),
            Paragraph("FastAPI (Python 3.11/3.13) + Uvicorn", table_cell),
            Paragraph("8000", table_cell_code),
            Paragraph("Orchestrates RAG retrieval, CrossEncoder reranking, IsolationForest anomaly detection, memory compression, and ITR state machine.", table_cell)
        ],
        [
            Paragraph("<b>Vector Engine</b>", table_cell),
            Paragraph("Ollama (bge-m3:latest)", table_cell),
            Paragraph("11434", table_cell_code),
            Paragraph("Generates 1024-dimensional multilingual embeddings for query matching against ~270 MB ICAI corpora. Requires ~1.5 GB RAM.", table_cell)
        ],
        [
            Paragraph("<b>Cognitive API</b>", table_cell),
            Paragraph("Google Gemini 2.5 Flash / 1.5 Pro", table_cell),
            Paragraph("HTTPS (443 Outbound)", table_cell_code),
            Paragraph("Statutory CA reasoning, document vision extraction (PDF/Images), and conversational memory compression.", table_cell)
        ],
    ]
    t_arch = Table(arch_table_data, colWidths=[65, 125, 80, letter[0]-72-270])
    t_arch.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_arch)
    story.append(Spacer(1, 6))

    story.append(make_callout(
        "Hardware Sizing Recommendation",
        "• <b>Compute</b>: 4 vCPU minimum (e.g. AWS t3.xlarge / c6i.xlarge, DigitalOcean 8GB Droplet, Hetzner CPX41).<br/>"
        "• <b>Memory</b>: 8 GB RAM minimum; <b>16 GB RAM strongly recommended</b> to hold all three ICAI joblib matrices and Ollama bge-m3 in RAM without swapping.<br/>"
        "• <b>Disk</b>: 40 GB NVMe SSD (Ollama model ~2.5 GB, ICAI corpora ~300 MB, PyTorch &amp; HuggingFace model cache ~2 GB).<br/>"
        "• <b>Network</b>: Outbound HTTPS connectivity to <i>generativelanguage.googleapis.com:443</i>.",
        "info"
    ))
    story.append(Spacer(1, 8))

    # ─────────────────────────────────────────────────────────────────────────
    # SECTION 2: ENVIRONMENT VARIABLES & ARTIFACT VALIDATION
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("2. Environment Variables &amp; Asset Pre-Flight Check", section_heading))
    story.append(Paragraph(
        "Configure production environment variables and verify that all precomputed serialized model assets exist in the root working directory.",
        body_style
    ))

    env_table_data = [
        [Paragraph("Variable Name", table_header), Paragraph("Scope", table_header), Paragraph("Required", table_header), Paragraph("Description &amp; Production Setting", table_header)],
        [
            Paragraph("GEMINI_API_KEY", table_cell_code),
            Paragraph("Backend", table_cell),
            Paragraph("Yes", table_cell),
            Paragraph("Primary Gemini API key used by <code>ca_agent.py</code> and <code>file_handler.py</code> (Vision parsing).", table_cell)
        ],
        [
            Paragraph("DEV_GEMINI_API_KEY", table_cell_code),
            Paragraph("Backend", table_cell),
            Paragraph("Yes", table_cell),
            Paragraph("Secondary key used for HyDE query expansion (<code>hyde.py</code>) and ITR agent (<code>itr_agent.py</code>).", table_cell)
        ],
        [
            Paragraph("OLLAMA_URL", table_cell_code),
            Paragraph("Backend", table_cell),
            Paragraph("Optional", table_cell),
            Paragraph("Address of Ollama instance. Default: <code>http://localhost:11434</code> (or <code>http://ollama:11434</code> in Docker).", table_cell)
        ],
        [
            Paragraph("ENABLE_HYDE", table_cell_code),
            Paragraph("Backend", table_cell),
            Paragraph("Optional", table_cell),
            Paragraph("<code>false</code> for lowest latency; <code>true</code> for advanced hypothetical document generation.", table_cell)
        ],
        [
            Paragraph("ENABLE_METRICS", table_cell_code),
            Paragraph("Backend", table_cell),
            Paragraph("Optional", table_cell),
            Paragraph("Must be set to <code>false</code> in production to eliminate RAGAS judge overhead.", table_cell)
        ],
        [
            Paragraph("VITE_API_URL", table_cell_code),
            Paragraph("Frontend", table_cell),
            Paragraph("Yes", table_cell),
            Paragraph("Target API base for React app: <code>https://api.yourdomain.com</code> or <code>/api</code> when proxied.", table_cell)
        ],
    ]
    t_env = Table(env_table_data, colWidths=[115, 50, 50, letter[0]-72-215])
    t_env.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_env)
    story.append(Spacer(1, 5))

    story.append(make_callout(
        "Critical Pre-Flight Check: Joblib Corpora Files",
        "The backend server loads 5 serialized files directly on startup in <code>search.py</code>. If any file is missing, the server will crash with <i>RuntimeError</i>:<br/>"
        "• <code>embeddings_foundation.joblib</code> (88 MB)<br/>"
        "• <code>embeddings_Intermediate.joblib</code> (76 MB)<br/>"
        "• <code>embeddings_Final.joblib</code> (102 MB)<br/>"
        "• <code>graphRag/income_tax_graph.gpickle</code> (85 KB)<br/>"
        "• <code>graphRag/income_tax_embeddings.joblib</code> (4.5 MB)<br/>"
        "<b>Rule:</b> When cloning via Git, ensure <b>Git LFS</b> is installed (<code>git lfs install &amp;&amp; git lfs pull</code>) or transfer these files via secure S3/rsync.",
        "warning"
    ))

    # Page Break to start Method 1 cleanly on Page 2
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # SECTION 3: METHOD 1 - BARE-METAL / LINUX VPS DEPLOYMENT
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("3. Method 1: Bare-Metal / Linux VPS Deployment (Ubuntu 22.04 / 24.04)", section_heading))
    story.append(Paragraph(
        "This is the production-grade approach for a dedicated cloud virtual machine (AWS EC2, DigitalOcean, Hetzner, Linode). "
        "It provides maximum throughput, native systemd process supervision, local Ollama caching, and TLS termination via Nginx.",
        body_style
    ))

    story.append(Paragraph("Step 3.1: Server Provisioning &amp; Toolchain Setup", subsection_heading))
    story.append(make_code_box(
"""# Update system packages and install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv git git-lfs curl nginx certbot \\
                    python3-certbot-nginx build-essential ufw

# Install Node.js 20 LTS (required for building the React frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify runtimes
python3 --version  # Expect Python 3.11+
node -v            # Expect v20.x+
git lfs install    # Enable Large File Storage"""
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Step 3.2: Ollama Service Setup &amp; bge-m3 Model Pull", subsection_heading))
    story.append(Paragraph(
        "Install Ollama as a managed background systemd daemon and pull the multilingual dense embedding model:",
        body_style
    ))
    story.append(make_code_box(
"""# Download and run official Ollama installer
curl -fsSL https://ollama.com/install.sh | sh

# Enable and start Ollama service
sudo systemctl enable ollama
sudo systemctl start ollama

# Pull the bge-m3 embedding model (approx 2.3 GB)
ollama pull bge-m3

# Verify model is available locally
curl http://localhost:11434/api/tags"""
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Step 3.3: Repository Setup &amp; Python Virtual Environment", subsection_heading))
    story.append(make_code_box(
"""# Prepare application directory
sudo mkdir -p /var/www/ca-agent && sudo chown -R $USER:$USER /var/www/ca-agent
cd /var/www/ca-agent

# Clone repository
git clone <YOUR_GIT_REPO_URL> .
git lfs pull   # Fetch the 270 MB .joblib corpora files

# Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Create temporary upload directory with write permissions
mkdir -p temp && chmod 775 temp

# Create production .env file
cat <<EOF > .env
GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
DEV_GEMINI_API_KEY="YOUR_ACTUAL_DEV_GEMINI_API_KEY"
ENABLE_HYDE=false
ENABLE_METRICS=false
OLLAMA_URL="http://localhost:11434"
EOF"""
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Step 3.4: Configure Backend Systemd Daemon", subsection_heading))
    story.append(Paragraph(
        "Create a systemd unit at <code>/etc/systemd/system/ca-backend.service</code> to manage Uvicorn workers and auto-restart on failure:",
        body_style
    ))
    story.append(make_code_box(
"""sudo tee /etc/systemd/system/ca-backend.service > /dev/null <<'EOF'
[Unit]
Description=CA Agent 2.0 FastAPI Backend
After=network.target ollama.service
Wants=ollama.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ca-agent
EnvironmentFile=/var/www/ca-agent/.env
ExecStart=/var/www/ca-agent/.venv/bin/uvicorn api:app --host 127.0.0.1 --port 8000 --workers 2 --timeout-keep-alive 65
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
EOF

# Set ownership, reload systemd daemon, and launch service
sudo chown -R www-data:www-data /var/www/ca-agent
sudo systemctl daemon-reload
sudo systemctl enable ca-backend
sudo systemctl start ca-backend

# Check service status
sudo systemctl status ca-backend --no-pager"""
    ))

    # Page Break to continue Method 1 frontend & Nginx on Page 3
    story.append(PageBreak())

    story.append(Paragraph("Step 3.5: Build and Deploy the React Frontend", subsection_heading))
    story.append(Paragraph(
        "Compile the frontend SPA into static production assets in <code>/var/www/ca-agent/dist</code>:",
        body_style
    ))
    story.append(make_code_box(
"""cd /var/www/ca-agent

# Set production API base (use relative path if proxying via Nginx)
echo "VITE_API_URL=/api" > .env.production

# Install npm dependencies and build production bundle
npm ci
npm run build

# Verify build output
ls -lh dist/index.html"""
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Step 3.6: Configure High-Performance Nginx Reverse Proxy &amp; SSL", subsection_heading))
    story.append(Paragraph(
        "Configure Nginx to serve static assets, proxy API routes, handle 50MB PDF statement uploads, and enable Let's Encrypt TLS 1.3:",
        body_style
    ))
    story.append(make_code_box(
"""sudo tee /etc/nginx/sites-available/ca-agent > /dev/null <<'EOF'
server {
    listen 80;
    server_name ca.yourdomain.com;

    # Allow large bank statement PDF/Image uploads
    client_max_body_size 50M;

    # High-performance Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Frontend Single Page Application
    location / {
        root /var/www/ca-agent/dist;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy pass to FastAPI Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;
        proxy_connect_timeout 60s;
    }

    # Proxy root level endpoints (/upload, /ask, /itr, /calendar, /docs)
    location ~ ^/(upload|ask|itr|calendar|docs|openapi.json) {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 180s;
        proxy_connect_timeout 60s;
    }
}
EOF

# Enable site, test configuration and reload Nginx
sudo ln -sf /etc/nginx/sites-available/ca-agent /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Issue free automatic SSL certificate via Let's Encrypt Certbot
sudo certbot --nginx -d ca.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com"""
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Step 3.7: Firewall Hardening (UFW)", subsection_heading))
    story.append(make_code_box(
"""# Allow SSH, HTTP, and HTTPS traffic only
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status"""
    ))

    # Page Break for Method 2: Docker
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # SECTION 4: METHOD 2 - CONTAINERIZED DOCKER DEPLOYMENT
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("4. Method 2: Containerized Deployment (Docker &amp; Docker Compose)", section_heading))
    story.append(Paragraph(
        "For portable cloud deployments (AWS ECS, Google Cloud Run, Azure Container Apps, or Docker Swarm), "
        "use this production multi-container topology comprising an <b>Ollama embedding service</b>, "
        "a <b>Python 3.11-slim FastAPI backend</b>, and an <b>Nginx Alpine frontend</b>.",
        body_style
    ))

    story.append(Paragraph("4.1 Backend Dockerfile (Dockerfile.backend)", subsection_heading))
    story.append(make_code_box(
"""# Stage 1: Build wheel cache
FROM python:3.11-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Minimal runtime image
FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

# Copy source code and precomputed model matrices
COPY . .
RUN mkdir -p /app/temp && chmod 777 /app/temp

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=3 \\
    CMD curl -f http://localhost:8000/docs || exit 1

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]"""
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("4.2 Frontend Dockerfile (Dockerfile.frontend)", subsection_heading))
    story.append(make_code_box(
"""# Stage 1: Build React static assets
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Serve via Nginx Alpine
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.docker.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]"""
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("4.3 Docker Compose Orchestrator (docker-compose.yml)", subsection_heading))
    story.append(make_code_box(
"""version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: ca_ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama_storage:/root/.ollama
    entrypoint: >
      sh -c "ollama serve & sleep 5 && ollama pull bge-m3 && wait"

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: ca_backend
    restart: unless-stopped
    depends_on:
      - ollama
    ports:
      - "8000:8000"
    environment:
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - DEV_GEMINI_API_KEY=${DEV_GEMINI_API_KEY}
      - OLLAMA_URL=http://ollama:11434
      - ENABLE_HYDE=false
      - ENABLE_METRICS=false
    volumes:
      - temp_data:/app/temp

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: ca_frontend
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "80:80"

volumes:
  ollama_storage:
  temp_data:"""
    ))

    # Page Break for Method 3 & Hardening
    story.append(PageBreak())

    story.append(Paragraph("4.4 Container Launch and Operations", subsection_heading))
    story.append(make_code_box(
"""# 1. Create .env with Gemini API keys
cat <<EOF > .env
GEMINI_API_KEY=your_actual_gemini_key
DEV_GEMINI_API_KEY=your_actual_dev_gemini_key
EOF

# 2. Build and launch all 3 microservices
docker compose up --build -d

# 3. Verify container health status
docker compose ps
docker compose logs -f backend"""
    ))
    story.append(Spacer(1, 6))

    # ─────────────────────────────────────────────────────────────────────────
    # SECTION 5: METHOD 3 - HYBRID CLOUD PAAS (VERCEL + RENDER)
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("5. Method 3: Hybrid Cloud PaaS (Vercel + Render / Railway)", section_heading))
    story.append(Paragraph(
        "For teams wanting managed infrastructure without server maintenance, deploy the React frontend on <b>Vercel</b> "
        "and the FastAPI backend on <b>Render</b> or <b>Railway</b>.",
        body_style
    ))

    story.append(Paragraph("5.1 Frontend Deployment on Vercel", subsection_heading))
    story.append(Paragraph(
        "1. Push your repository to GitHub.<br/>"
        "2. In Vercel, click <b>Add New &gt; Project</b> and import the repository.<br/>"
        "3. Configure Build Settings: Framework Preset <code>Vite</code>, Build Command <code>npm run build</code>, Output Directory <code>dist</code>.<br/>"
        "4. Set Environment Variable: <code>VITE_API_URL=https://ca-backend.onrender.com</code>.<br/>"
        "5. Include a <code>vercel.json</code> file in the repository root to handle SPA client-side route rewrites:",
        body_style
    ))
    story.append(make_code_box(
"""{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://ca-backend.onrender.com/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}"""
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("5.2 Backend Deployment on Render / Railway", subsection_heading))
    story.append(Paragraph(
        "1. In Render, create a new <b>Web Service</b> pointing to the repo.<br/>"
        "2. Runtime: <b>Docker</b> (uses <code>Dockerfile.backend</code>) or <b>Python 3.11</b>.<br/>"
        "3. Plan: Select an instance with at least <b>4 GB RAM</b> to accommodate the ICAI model embeddings.<br/>"
        "4. Set Environment Variables: <code>GEMINI_API_KEY</code>, <code>DEV_GEMINI_API_KEY</code>.<br/>"
        "5. <b>Ollama in Cloud PaaS</b>: Either connect to a persistent external Ollama instance by setting <code>OLLAMA_URL</code> "
        "or run Ollama on a lightweight cloud compute instance (AWS t3.medium / Hetzner CPX21).",
        body_style
    ))
    story.append(Spacer(1, 6))

    # ─────────────────────────────────────────────────────────────────────────
    # SECTION 6: CODE ADJUSTMENTS & PRODUCTION HARDENING
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("6. Critical Production Hardening &amp; Code Adjustments", section_heading))
    story.append(Paragraph(
        "During a comprehensive code audit of CA Agent 2.0, two critical deployment nuances were identified that must be addressed for cloud production:",
        body_style
    ))

    story.append(make_callout(
        "Code Audit Finding: Hardcoded Endpoints in ITR Pages",
        "While <code>ChatContext.tsx</code> properly honors <code>import.meta.env.VITE_API_URL</code>, two ITR pages contain hardcoded local URLs:<br/>"
        "• <code>src/pages/ITRFilingPage.tsx</code> (lines 35, 48): uses <code>http://localhost:8000/upload</code> and <code>/api/itr/analyze</code><br/>"
        "• <code>src/pages/ITRChatPage.tsx</code> (lines 166, 189): uses <code>http://localhost:8000/upload</code> and <code>/api/itr/chat</code><br/>"
        "<b>Remedy:</b> Update these fetch calls to prefix with <code>import.meta.env.VITE_API_URL || ''</code> so they work in cloud deployments.",
        "warning"
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("6.1 Production CORS Lockdown (api.py)", subsection_heading))
    story.append(Paragraph(
        "Replace the permissive wildcard origin in <code>api.py</code> with verified production domains:",
        body_style
    ))
    story.append(make_code_box(
"""# In api.py, replace lines 36-42 with:
ALLOWED_ORIGINS = [
    "https://ca.yourdomain.com",
    "https://ca-agent-frontend.vercel.app",
    "http://localhost:8080",  # Staging
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)"""
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("6.2 Automated Storage Cleanup (temp/ Directory)", subsection_heading))
    story.append(Paragraph(
        "Add a daily cron job to prevent disk exhaustion from uploaded bank statements in <code>temp/</code>:",
        body_style
    ))
    story.append(make_code_box(
"""# Run crontab -e and add:
0 2 * * * find /var/www/ca-agent/temp -type f -mtime +1 -delete"""
    ))

    # Page Break for Smoke Testing & Troubleshooting Matrix
    story.append(PageBreak())

    # ─────────────────────────────────────────────────────────────────────────
    # SECTION 7: SMOKE TESTING & VERIFICATION SUITE
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("7. Smoke Testing &amp; Verification Suite", section_heading))
    story.append(Paragraph(
        "Execute these five automated tests to verify that RAG retrieval, Gemini Vision, ML Anomaly Detection, and ITR state machine are operating properly:",
        body_style
    ))

    story.append(Paragraph("Test 1: Hybrid RAG Statutory Q&amp;A (/ask)", subsection_heading))
    story.append(make_code_box(
"""curl -s -X POST https://ca.yourdomain.com/ask \\
  -H "Content-Type: application/json" \\
  -d '{
    "question": "What is the tax rate under Section 115BAC for income up to 7 lakhs?",
    "history": [],
    "doc_data": []
  }' | jq .answer"""
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Test 2: Document Vision Extraction &amp; ML Anomaly Flagging (/upload)", subsection_heading))
    story.append(make_code_box(
"""curl -s -X POST https://ca.yourdomain.com/upload \\
  -F "file=@Statement.pdf" \\
  -F "context=FY 2024-25" | jq '{person: .doc_item.person_entity, anomalies: .doc_item.flagged_transactions}'"""
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Test 3: Guided ITR Conversational Agent (/api/itr/chat)", subsection_heading))
    story.append(make_code_box(
"""curl -s -X POST https://ca.yourdomain.com/api/itr/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "I am a salaried individual with capital gains from equity shares. Which ITR should I file?",
    "history": []
  }' | jq .reply"""
    ))
    story.append(Spacer(1, 4))

    story.append(Paragraph("Test 4: Tax Compliance Calendar Generator (/calendar)", subsection_heading))
    story.append(make_code_box(
"""curl -s -X POST https://ca.yourdomain.com/calendar \\
  -H "Content-Type: application/json" \\
  -d '{"doc_data": {}}' | jq .deadlines"""
    ))
    story.append(Spacer(1, 6))

    # ─────────────────────────────────────────────────────────────────────────
    # SECTION 8: TROUBLESHOOTING & RECOVERY MATRIX
    # ─────────────────────────────────────────────────────────────────────────
    story.append(Paragraph("8. Operational Troubleshooting Matrix", section_heading))
    story.append(Paragraph(
        "Quick reference guide for resolving common production issues:",
        body_style
    ))

    trouble_data = [
        [Paragraph("Symptom / Error", table_header), Paragraph("Root Cause", table_header), Paragraph("Corrective Action", table_header)],
        [
            Paragraph("<code>Embedding service (Ollama) is not running</code>", table_cell),
            Paragraph("Ollama process stopped or port 11434 unreachable.", table_cell),
            Paragraph("Run <code>sudo systemctl restart ollama</code> and confirm <code>ollama list</code> shows <code>bge-m3</code>.", table_cell)
        ],
        [
            Paragraph("<code>FileNotFoundError: embeddings_*.joblib</code>", table_cell),
            Paragraph("Git LFS pointers checked out instead of actual binaries.", table_cell),
            Paragraph("Execute <code>git lfs pull</code> in the root directory to download all 3 corpora files (~270 MB total).", table_cell)
        ],
        [
            Paragraph("<code>HTTP 413 Request Entity Too Large</code> on PDF upload", table_cell),
            Paragraph("Nginx default client body limit (1MB) exceeded.", table_cell),
            Paragraph("Add <code>client_max_body_size 50M;</code> inside the Nginx <code>server {}</code> block and run <code>nginx -s reload</code>.", table_cell)
        ],
        [
            Paragraph("<code>google.api_core.exceptions.ResourceExhausted: 429</code>", table_cell),
            Paragraph("Google Gemini API quota or rate limit exceeded.", table_cell),
            Paragraph("Ensure paid tier is active on Google AI Studio or configure exponential backoff in <code>ca_agent.py</code>.", table_cell)
        ],
        [
            Paragraph("<code>404 Not Found</code> when refreshing page on route /itr-hub", table_cell),
            Paragraph("Nginx missing SPA client route fallback.", table_cell),
            Paragraph("Ensure Nginx has <code>try_files $uri $uri/ /index.html;</code> inside the <code>location /</code> block.", table_cell)
        ],
        [
            Paragraph("<code>Ollama embedding timed out</code> (30s timeout)", table_cell),
            Paragraph("Model cold start on constrained CPU.", table_cell),
            Paragraph("Increase <code>timeout=60</code> in <code>search.py:122</code> and ensure server has at least 4 vCPUs.", table_cell)
        ],
    ]
    t_trouble = Table(trouble_data, colWidths=[140, 130, letter[0]-72-270])
    t_trouble.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), SECONDARY),
        ('BOX', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('INNERGRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_trouble)
    story.append(Spacer(1, 8))

    story.append(make_callout(
        "Deployment Complete &amp; Operational!",
        "Your CA Agent 2.0 platform is now fully deployed, hardened with TLS, and operational. "
        "For additional roadmap updates (Step 5 fine-tuned embeddings, Step 9 compliance calendar alerts, Step 10 voice interface), "
        "refer to <code>PROJECT_CONTEXT.md</code>.",
        "success"
    ))

    # Build Document
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"[SUCCESS] Enterprise PDF Generated at: {os.path.abspath(filename)}")


if __name__ == "__main__":
    out_pdf = "CA_Agent_2_0_Deployment_Guide.pdf"
    if len(sys.argv) > 1:
        out_pdf = sys.argv[1]
    build_pdf(out_pdf)
