# Peblo TV Mini — Full-Stack Miniature Streaming Platform

> **Take-Home Challenge Submission for Full-Stack Platform Engineer (Python/FastAPI + React)**  
> **Candidate**: Rafia Minhaj  
> **Global Rank #29 GSSoC 2026** | **Google Cloud & Azure Certified**  
> 🌐 **Live Vercel Deployment:** [https://peblo-tv-mini.vercel.app](https://peblo-tv-mini.vercel.app)  
> 🎥 **Live Video Demonstration & Walkthrough:** [Watch Peblo TV Mini Video Walkthrough (Google Drive)](https://drive.google.com/file/d/1I8HT0hnHkU3jeGkAkLI5BfdWAtIcSgzn/view?usp=sharing)

---

## 🚀 Quick Start (One Command Launch)

```bash
# Clone the repository
git clone https://github.com/Rafiaminhaj/peblo-tv-mini.git
cd peblo-tv-mini

# Spin up all 4 containers (Database, Backend API, CMS UI, Viewer UI)
docker-compose up --build
```

- **CMS Editor Portal**: `http://localhost:3001` (Admin/Editor CMS interface)
- **Viewer Netflix-Style UI**: `http://localhost:3002` (Pre-published streaming catalogue reader)
- **FastAPI OpenAPI Docs**: `http://localhost:8000/docs`
- **Health Endpoint**: `http://localhost:8000/health`

---

## 🛠️ Architecture & System Design

```
[CMS React UI]  ───────►  [FastAPI Backend]  ◄───────  [Viewer React UI]
 (Port 3001)           │   (Port 8000)                   (Port 3002)
                       ▼
                 [PostgreSQL / SQLite]
                       │
                       ▼ (Atomic Temp Swap)
               [catalogue.json in Storage]
```

### Key Engineering Features
1. **Pillow Image Validator**: Enforces strict aspect ratios (`poster`: 2:3, `banner`: 16:9, `thumbnail`: 16:9) and a **200 KB max size ceiling** with non-technical, human-readable editor errors.
2. **Atomic Catalogue Publisher**: Writes to a temporary file (`catalogue.json.tmp`) and executes POSIX atomic `os.replace` to guarantee readers never see half-written or corrupt data.
3. **Language Variant Collapse**: Merges episodes sharing a `content_group` into a single catalogue entry with a `languages` list (e.g. `["en", "hi"]`).
4. **Storage Abstraction**: Swappable `StorageProvider` interface (`LocalStorageProvider` vs `CloudflareR2StorageProvider`).
5. **RBAC Security**: Enforces `editor` vs `admin` roles via header verification middleware.

---

## 📝 Part E — Written Reasoning & Trade-offs

### 1. How Atomic Publishing Works & Handling Mid-Publish Failures
Publishing writes the rendered JSON to a temporary file `catalogue.json.tmp` on disk, flushes OS buffers via `os.fsync()`, and performs `os.replace()` to swap `catalogue.json.tmp` -> `catalogue.json`. On POSIX filesystems (and NTFS), `os.replace()` is an atomic operation.
- **If the process dies mid-publish**: The temporary `.tmp` file remains on disk or is cleaned up on reboot. The active `catalogue.json` file is never corrupted or partially written, ensuring zero downtime for viewers.

### 2. Storage Abstraction (Local Disk to Cloudflare R2)
All file reads/writes pass through `app/storage.py`'s `StorageProvider` abstract class. Switching from local disk to Cloudflare R2 involves changing one environment variable (`STORAGE_PROVIDER=r2`). The application code remains completely untouched because `CloudflareR2StorageProvider` implements the same interface methods using `boto3`.

### 3. Search Implementation, Scaling Limits & Future Roadmap
Current search (`GET /catalog/search`) filters the published in-memory/JSON catalogue.
- **Scale Limit**: In-memory JSON filtering works smoothly up to ~50,000 shows/episodes (<50MB memory). At 100,000+ items, JSON deserialization and linear iteration will cause CPU bottlenecks.
- **Next Step at Scale**: Index published catalogues into **Meilisearch** or **Elasticsearch** with trigram fuzzy matching, or use PostgreSQL `pg_trgm` full-text search with GIN indexes.

### 4. Why Serve a Pre-Published Catalogue File Instead of Querying DB Per Request?
- **Pros**: Offloads 99% of read traffic away from the PostgreSQL database directly to static CDN cache edge nodes (Cloudflare R2 / AWS CloudFront), achieving <10ms global latency and infinite horizontal viewer scalability.
- **Where it bites**: Instant updates are not immediate; editors must trigger a publish job for changes to go live.

### 5. What Was Left Out, Trade-offs & AI Usage
- **Left out**: Real OAuth2 JWT login flow (simulated via `X-User-Role` headers for fast evaluation).
- **AI Tool Usage**: Used Claude 3.5 & Cursor for boilerplate generation. Accepted Pydantic v2 schemas and image validation math; rejected overly complex multi-file database locking mechanisms in favor of clean POSIX file-replace atomicity.

---

## 🧪 Running Unit Tests

```bash
cd backend
pip install -r requirements.txt
pytest
```

---

## 📄 License
MIT License — Created for Peblo TV Full-Stack Challenge.
