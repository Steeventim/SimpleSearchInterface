# CENADI Document Search Engine

A full-text document search engine with role-based access control (RBAC), built for CENADI's divisional document management. Users can search, preview, and manage PDF/Office/text documents organized by organizational division.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Requirements](#system-requirements)
3. [Quick Start (Docker Compose)](#quick-start-docker-compose)
4. [Configuration Reference](#configuration-reference)
5. [Document Directory Structure](#document-directory-structure)
6. [FSCrawler Setup (Document Indexing)](#fscrawler-setup-document-indexing)
7. [Elasticsearch Connection & Index](#elasticsearch-connection--index)
8. [Database & Migrations](#database--migrations)
9. [Authentication & RBAC](#authentication--rbac)
10. [Nginx Reverse Proxy (Production)](#nginx-reverse-proxy-production)
11. [Maintenance & Operations](#maintenance--operations)
12. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Browser   │────▶│  Nginx (proxy)   │────▶│  Next.js App (:3000)│
└─────────────┘     └──────────────────┘     │  cenadi-app         │
                                              └────────┬────────────┘
                                                       │
                              ┌─────────────────────────┼─────────────────┐
                              │                         │                 │
                    ┌─────────▼──────────┐   ┌─────────▼──────┐   ┌─────▼──────┐
                    │  Elasticsearch     │   │  PostgreSQL    │   │  Documents  │
                    │  (:9200)           │   │  (:5432)       │   │  /data/docs │
                    │  cenadi-elasticsearch│  │  cenadi-db     │   └─────┬──────┘
                    └─────────▲──────────┘   └────────────────┘         │
                              │                                         │
                    ┌─────────┴──────────┐                              │
                    │  FSCrawler         │◀─────────────────────────────┘
                    │  cenadi-fscrawler  │   (scans & indexes documents)
                    └────────────────────┘
```

**5 Docker containers:**

| Container              | Image                              | Purpose                                       | Port |
| ---------------------- | ---------------------------------- | --------------------------------------------- | ---- |
| `cenadi-app`           | Built from `Dockerfile`            | Next.js web application                       | 3000 |
| `cenadi-elasticsearch` | `elasticsearch:8.17.0`             | Full-text search engine                       | 9200 |
| `cenadi-db`            | `postgres:16-alpine`               | User accounts, search history, activity logs  | 5432 |
| `cenadi-fscrawler`     | `dadoonet/fscrawler:2.10-SNAPSHOT` | Automatic document crawling & indexing        | —    |
| `cenadi-kibana`        | `kibana:8.17.0`                    | Elasticsearch monitoring dashboard (optional) | 5601 |

---

## System Requirements

### Minimum Hardware

| Resource      | Minimum          | Recommended                                |
| ------------- | ---------------- | ------------------------------------------ |
| **CPU**       | 2 cores          | 4+ cores                                   |
| **RAM**       | 4 GB             | 8 GB+                                      |
| **Disk**      | 20 GB (OS + app) | 50 GB+ (depends on document volume)        |
| **Disk type** | —                | SSD strongly recommended for Elasticsearch |

> **Memory breakdown:** Elasticsearch uses ~1 GB heap (configured via `ES_JAVA_OPTS`), FSCrawler uses ~2 GB heap, PostgreSQL uses ~256 MB, the Next.js app uses ~512 MB. Plan for at least 4 GB total for the services alone.

### Software Prerequisites

| Software           | Version                              | Purpose               |
| ------------------ | ------------------------------------ | --------------------- |
| **Ubuntu/Debian**  | 20.04+ / Debian 11+                  | Host operating system |
| **Docker Engine**  | 24.0+                                | Container runtime     |
| **Docker Compose** | v2.20+ (included with Docker Engine) | Service orchestration |
| **Git**            | any                                  | Clone the repository  |

### Network Ports

| Port   | Service       | Required                               |
| ------ | ------------- | -------------------------------------- |
| `3000` | Next.js app   | Yes (or proxied via 80/443)            |
| `9200` | Elasticsearch | Internal only (do not expose publicly) |
| `5432` | PostgreSQL    | Internal only (do not expose publicly) |
| `5601` | Kibana        | Optional, admin monitoring only        |

### Docker Installation (Ubuntu/Debian)

```bash
# Install Docker Engine
curl -fsSL https://get.docker.com | sh

# Enable Docker to start on boot
sudo systemctl enable docker
sudo systemctl start docker

# Add your user to the docker group (log out and back in after)
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose version
```

### vm.max_map_count (Required for Elasticsearch)

Elasticsearch requires the `vm.max_map_count` kernel setting to be at least `262144`. Without this, Elasticsearch will fail to start.

```bash
# Apply immediately
sudo sysctl -w vm.max_map_count=262144

# Make permanent across reboots
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

---

## Quick Start (Docker Compose)

### 1. Clone the Repository

```bash
git clone <your-repo-url> cenadi-search
cd cenadi-search
```

### 2. Create the `.env` File

```bash
cp .env.example .env   # or create manually
```

Edit `.env` with the following values:

```env
# === Authentication ===
NEXTAUTH_SECRET=<generate-a-random-secret>
NEXTAUTH_URL=http://localhost:3000

# === Elasticsearch ===
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=cenadi_document1

# === Documents Root Directory ===
# This is the absolute path on the HOST machine where your division folders are stored.
# It must contain subdirectories named: DEP, DEL, DTB, DIRE, DAAF
UPLOAD_DIRECTORY=/data/cenadi/documents

# === File Upload Settings ===
ALLOWED_FILE_TYPES=image/*,application/pdf,text/*,application/msword
MAX_FILE_SIZE=10485760

# === Database (used by Prisma locally — Docker Compose overrides this internally) ===
DATABASE_URL=postgresql://postgres:mkounga10@localhost:5432/cenadi_search
```

**Generate a secure `NEXTAUTH_SECRET`:**

```bash
openssl rand -base64 32
```

### 3. Prepare the Document Directory

```bash
# Create the root directory
sudo mkdir -p /data/cenadi/documents

# Create one subdirectory per division
sudo mkdir -p /data/cenadi/documents/{DEP,DEL,DTB,DIRE,DAAF}

# Set ownership so Docker can read
sudo chown -R 1000:1000 /data/cenadi/documents
```

Copy your documents into the appropriate division folder. The RBAC system filters search results by matching the division name in the file path.

### 4. Set the Elasticsearch Kernel Parameter

```bash
sudo sysctl -w vm.max_map_count=262144
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
```

### 5. Build and Start All Services

```bash
docker compose up -d --build
```

This will:

- Pull Elasticsearch 8.17.0, PostgreSQL 16, FSCrawler, and Kibana images
- Build the Next.js application image
- Start all 5 containers on the `cenadi-net` Docker network
- Run Prisma database migrations automatically on first start

### 6. Verify Everything Is Running

```bash
# Check container status
docker compose ps

# Expected output: all 5 containers "Up" / "healthy"
# Note: Elasticsearch can take 60-90 seconds to become healthy on first start.

# Test Elasticsearch manually
curl http://localhost:9200/_cluster/health?pretty

# Test the application
curl -s http://localhost:3000/api/suggestions?q=test
# Should return JSON: {"suggestions":[],"enhanced":[]}
```

### 7. Create the First User

Open `http://localhost:3000/signup` in your browser and create an account:

| Field        | Description                                                                          |
| ------------ | ------------------------------------------------------------------------------------ |
| **Name**     | Full name                                                                            |
| **Email**    | Login email (unique)                                                                 |
| **Password** | Minimum recommended: 8 characters                                                    |
| **Role**     | `CENADI_DIRECTOR` (sees all divisions), `DIVISION_DIRECTOR`, or `DIVISION_SECRETARY` |
| **Division** | `DEP`, `DEL`, `DTB`, `DIRE`, or `DAAF` (not required for `CENADI_DIRECTOR`)          |

Then log in at `http://localhost:3000/login`.

---

## Configuration Reference

### Environment Variables

| Variable              | Default                                             | Description                                                                        |
| --------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `NEXTAUTH_SECRET`     | _(required)_                                        | Random string used to encrypt JWT tokens. Generate with `openssl rand -base64 32`. |
| `NEXTAUTH_URL`        | `http://localhost:3000`                             | The public URL of the application. Set to your domain in production.               |
| `ELASTICSEARCH_URL`   | `http://localhost:9200`                             | Elasticsearch endpoint (use `http://elasticsearch:9200` inside Docker).            |
| `ELASTICSEARCH_INDEX` | `cenadi_document1`                                  | Name of the Elasticsearch index where documents are stored.                        |
| `UPLOAD_DIRECTORY`    | _(required)_                                        | Absolute path on the **host** to the documents root folder.                        |
| `ALLOWED_FILE_TYPES`  | `image/*,application/pdf,text/*,application/msword` | MIME types accepted for upload.                                                    |
| `MAX_FILE_SIZE`       | `10485760` (10 MB)                                  | Maximum upload file size in bytes.                                                 |
| `DATABASE_URL`        | _(set in docker-compose)_                           | PostgreSQL connection string. Docker Compose sets this automatically.              |

### Docker Compose Overrides

The `docker-compose.yml` hardcodes certain values for inter-container communication:

- `DATABASE_URL=postgresql://postgres:mkounga10@db:5432/cenadi_search` (uses service name `db`)
- `ELASTICSEARCH_URL=http://elasticsearch:9200` (uses service name `elasticsearch`)

**To change the database password**, update it in both the `db` service environment and the `app` service `DATABASE_URL`.

---

## Document Directory Structure

Documents MUST be organized in division subdirectories. The RBAC system uses the file path to determine which division a document belongs to.

```
/data/cenadi/documents/          ← UPLOAD_DIRECTORY
├── DEP/                         ← Division des Études et Projets
│   ├── rapport-2024.pdf
│   ├── fc56180c-...-budget.pdf
│   └── notes/
│       └── meeting.pdf
├── DEL/                         ← Division de l'Exploitation et des Logiciels
│   └── technical-spec.pdf
├── DTB/                         ← Division Téléinformatique et Bureautique
│   └── network-plan.docx
├── DIRE/                        ← Division Informatique Recherche et Enseignement
│   └── research-paper.pdf
└── DAAF/                        ← Division Affaires Administratives et Financières
    └── invoice-2024.pdf
```

**How RBAC filtering works:**

- A user with `role=CENADI_DIRECTOR` sees **all** documents across all divisions
- A user with `division=DIRE` only sees documents whose Elasticsearch `path.real` field contains `*/DIRE/*`
- Subdirectories within a division folder are included (e.g., `DIRE/subfolder/file.pdf` will match)

---

## FSCrawler Setup (Document Indexing)

FSCrawler automatically scans the document directory, extracts text content (including OCR for scanned PDFs), and indexes everything into Elasticsearch.

### How It Works

1. FSCrawler container mounts your `UPLOAD_DIRECTORY` as a read-only volume
2. It scans the directory every 5 minutes (configurable via `update_rate`)
3. For each file, it extracts text, metadata, and file properties
4. The extracted data is indexed into Elasticsearch under the `cenadi_document1` index
5. The `path.real` field in the index stores the full file path — this is what RBAC uses

### Configuration File

The FSCrawler job configuration is at `docker/fscrawler/config/cenadi_job/_settings.yaml`:

```yaml
name: "cenadi_job"
fs:
  url: "/Users/laure/Desktop/Doc1" # Path INSIDE the container (mapped from UPLOAD_DIRECTORY)
  update_rate: "5m" # Scan interval
  filename_as_id: true # Use filename as document ID
  index_content: true # Extract and index text content
  store_source: true # Store the original source
  lang_detect: true # Detect document language
  continue_on_error: true # Don't stop on individual file errors
  pdf_ocr: true # Enable OCR for scanned PDFs
  indexed_chars: -1 # Index ALL text (no character limit)
  ocr:
    enabled: true
    pdf_strategy: "ocr_and_text" # Extract both OCR and embedded text
elasticsearch:
  urls:
    - "http://elasticsearch:9200" # Elasticsearch service name in Docker network
  index: "cenadi_document1" # Target index name
  bulk_size: 100
  flush_interval: "5s"
```

### Adapting for Your Server

You **must** update the `fs.url` path in `_settings.yaml` to match the mount point inside the container. In the `docker-compose.yml`, the volume mapping is:

```yaml
volumes:
  - "${UPLOAD_DIRECTORY}:/Users/laure/Desktop/Doc1:ro"
```

**For a clean production deployment, change both:**

1. In `docker-compose.yml`, update the fscrawler volume:

   ```yaml
   volumes:
     - "${UPLOAD_DIRECTORY}:/data/documents:ro"
   ```

2. In `docker/fscrawler/config/cenadi_job/_settings.yaml`, update:
   ```yaml
   fs:
     url: "/data/documents"
   ```

Both the volume mount target and `fs.url` must match exactly.

### Verify Indexing

```bash
# Check how many documents are indexed
curl -s "http://localhost:9200/cenadi_document1/_count" | python3 -m json.tool

# Search for a document
curl -s "http://localhost:9200/cenadi_document1/_search?q=*&size=1" | python3 -m json.tool

# Check FSCrawler logs
docker logs cenadi-fscrawler --tail 50
```

### Force Re-Index

To force FSCrawler to re-index all documents:

```bash
# Delete the existing index (WARNING: removes all indexed data)
curl -X DELETE "http://localhost:9200/cenadi_document1"

# Restart FSCrawler
docker restart cenadi-fscrawler

# FSCrawler will re-scan and re-index everything on the next cycle (within 5 minutes)
```

---

## Elasticsearch Connection & Index

### Connection Details

| Setting      | Value (inside Docker network)             | Value (from host)       |
| ------------ | ----------------------------------------- | ----------------------- |
| URL          | `http://elasticsearch:9200`               | `http://localhost:9200` |
| Index name   | `cenadi_document1`                        | `cenadi_document1`      |
| Security     | Disabled (`xpack.security.enabled=false`) | —                       |
| Cluster name | `cenadi-search-cluster`                   | —                       |
| Heap size    | 1 GB (`-Xms1g -Xmx1g`)                    | —                       |

### Index Schema (Created Automatically by FSCrawler)

FSCrawler creates the index and mappings automatically. Key fields used by the application:

| Field                | Type    | Description                                           |
| -------------------- | ------- | ----------------------------------------------------- |
| `content`            | text    | Extracted document text content                       |
| `file.filename`      | keyword | Original filename                                     |
| `file.content_type`  | keyword | MIME type of the document                             |
| `file.filesize`      | long    | File size in bytes                                    |
| `file.indexing_date` | date    | When the document was indexed                         |
| `path.real`          | keyword | **Full file path** — used for RBAC division filtering |
| `path.virtual`       | keyword | Virtual path within the crawled directory             |

### Tuning Elasticsearch Memory

In `docker-compose.yml`, adjust the heap size based on your available RAM:

```yaml
environment:
  - "ES_JAVA_OPTS=-Xms1g -Xmx1g" # Set both to the same value
```

| Server RAM | Recommended ES Heap |
| ---------- | ------------------- |
| 4 GB       | `-Xms512m -Xmx512m` |
| 8 GB       | `-Xms1g -Xmx1g`     |
| 16 GB+     | `-Xms2g -Xmx2g`     |

> **Rule:** Never allocate more than 50% of total RAM to Elasticsearch. The OS needs the rest for filesystem caching.

---

## Database & Migrations

PostgreSQL stores user accounts, search history, and activity logs. The schema is managed by Prisma ORM.

### Automatic Migrations

The `docker-entrypoint.sh` script runs `prisma migrate deploy` automatically every time the app container starts. This applies any pending migrations.

### Manual Database Access

```bash
# Connect to the database
docker exec -it cenadi-db psql -U postgres -d cenadi_search

# List tables
\dt

# View users
SELECT id, name, email, role, division FROM "User";

# Exit
\q
```

### Reset the Database

```bash
# Stop the app
docker stop cenadi-app

# Drop and recreate
docker exec -it cenadi-db psql -U postgres -c "DROP DATABASE cenadi_search;"
docker exec -it cenadi-db psql -U postgres -c "CREATE DATABASE cenadi_search;"

# Restart (migrations will re-run)
docker start cenadi-app
```

---

## Authentication & RBAC

### Roles

| Role                 | Access Level                                                             |
| -------------------- | ------------------------------------------------------------------------ |
| `CENADI_DIRECTOR`    | Sees documents from **all divisions**. Full admin access.                |
| `DIVISION_DIRECTOR`  | Sees documents from **their division only**.                             |
| `DIVISION_SECRETARY` | Sees documents from **their division only**. Default role for new users. |

### Divisions

| Code   | Full Name                                                               |
| ------ | ----------------------------------------------------------------------- |
| `DEP`  | Division des Études et Projets                                          |
| `DEL`  | Division de l'Exploitation et des Logiciels                             |
| `DTB`  | Division de la Téléinformatique et de la Bureautique                    |
| `DIRE` | Division de l'Informatique appliquée à la Recherche et à l'Enseignement |
| `DAAF` | Division des Affaires Administratives et Financières                    |

### Session Configuration

Sessions use JWT tokens with a default expiry of **30 minutes**. This can be changed by setting `NEXTAUTH_MAX_AGE` (in seconds) in your `.env`:

```env
NEXTAUTH_MAX_AGE=3600   # 1 hour
```

---

## Nginx Reverse Proxy (Production)

For production, place Nginx in front of the Next.js app to handle SSL, caching, and proper domain routing.

### Install Nginx

```bash
sudo apt update && sudo apt install -y nginx
```

### Configuration

Create `/etc/nginx/sites-available/cenadi`:

```nginx
server {
    listen 80;
    server_name your-domain.cm;

    # Redirect HTTP to HTTPS (enable after setting up SSL)
    # return 301 https://$server_name$request_uri;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeout for large document searches
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }

    # Block external access to Elasticsearch and DB ports
    # (Only the Docker internal network should access them)

    client_max_body_size 20M;  # Match MAX_FILE_SIZE
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/cenadi /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default   # Remove default site

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
```

### SSL with Let's Encrypt (Recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.cm
```

After SSL is configured, update your `.env`:

```env
NEXTAUTH_URL=https://your-domain.cm
```

Then rebuild the app container:

```bash
docker compose up -d --build app
```

---

## Maintenance & Operations

### Common Commands

```bash
# View logs for all services
docker compose logs -f

# View logs for a specific service
docker compose logs -f app
docker compose logs -f fscrawler
docker compose logs -f elasticsearch

# Restart a single service
docker restart cenadi-app

# Stop everything
docker compose down

# Stop everything AND remove volumes (DELETES ALL DATA)
# docker compose down -v   # USE WITH EXTREME CAUTION

# Rebuild the app after code changes
docker compose up -d --build app

# Check disk usage
docker system df
```

### Backup

```bash
# Backup PostgreSQL
docker exec cenadi-db pg_dump -U postgres cenadi_search > backup_$(date +%Y%m%d).sql

# Backup Elasticsearch (snapshot API or just ensure documents folder is backed up)
# Since FSCrawler can re-index from the document folder, backing up the folder is sufficient.

# Backup document folder
rsync -av /data/cenadi/documents/ /backup/documents/
```

### Restore PostgreSQL

```bash
cat backup_20260414.sql | docker exec -i cenadi-db psql -U postgres -d cenadi_search
```

### Update the Application

```bash
cd cenadi-search
git pull origin main
docker compose up -d --build app
```

---

## Troubleshooting

### Elasticsearch won't start

**Symptom:** `cenadi-elasticsearch` shows `unhealthy` or exits immediately.

```bash
# Check logs
docker logs cenadi-elasticsearch --tail 50

# Most common cause: vm.max_map_count too low
sudo sysctl -w vm.max_map_count=262144
docker restart cenadi-elasticsearch
```

### FSCrawler not indexing documents

```bash
# Check FSCrawler logs
docker logs cenadi-fscrawler --tail 100

# Verify the volume mount — check what FSCrawler sees
docker exec cenadi-fscrawler ls -la /Users/laure/Desktop/Doc1/
# (or /data/documents/ if you changed the mount point)

# Verify document count in Elasticsearch
curl -s "http://localhost:9200/cenadi_document1/_count"
```

**Common causes:**

- The `fs.url` in `_settings.yaml` does not match the Docker volume mount target
- The document folder is empty or has wrong permissions
- FSCrawler is still on its first scan (wait for the `update_rate` interval, default 5 min)

### Search returns 0 results for a division

**Symptom:** User with `division=DIRE` sees no results even though DIRE folder has files.

```bash
# Check if documents from that division are indexed
curl -s "http://localhost:9200/cenadi_document1/_search" \
  -H "Content-Type: application/json" \
  -d '{"query":{"wildcard":{"path.real":"*/DIRE/*"}},"size":1}'
```

If the result count is 0, the DIRE folder documents have not been indexed yet. Restart FSCrawler and wait:

```bash
docker restart cenadi-fscrawler
# Wait 5 minutes, then check again
```

### API returns HTML instead of JSON

**Symptom:** Frontend shows `SyntaxError: Unexpected token '<'`.

This means the API route is returning an HTML page (usually the login page) instead of JSON. Verify the middleware file `middleware.ts` excludes API routes:

```ts
export const config = {
  matcher: ["/((?!api|login|signup|_next/static|_next/image|favicon.ico).*)"],
};
```

The key is `api` (not `api/auth`) — this excludes **all** API routes from the middleware redirect.

### Container names conflict

If you get "container name already in use" errors:

```bash
docker compose down
docker compose up -d
```

### Check all services health at once

```bash
echo "=== Containers ===" && docker compose ps && \
echo "=== Elasticsearch ===" && curl -s http://localhost:9200/_cluster/health | python3 -m json.tool && \
echo "=== Document Count ===" && curl -s http://localhost:9200/cenadi_document1/_count && \
echo "=== App ===" && curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/suggestions?q=test
```

---

## Technology Stack

| Layer            | Technology                       | Version       |
| ---------------- | -------------------------------- | ------------- |
| Frontend         | Next.js (App Router)             | 15.2.4        |
| UI               | React + Tailwind CSS + shadcn/ui | React 19      |
| Language         | TypeScript                       | 5.x           |
| Authentication   | NextAuth.js (Credentials + JWT)  | 4.x           |
| Search Engine    | Elasticsearch                    | 8.17.0        |
| Document Indexer | FSCrawler                        | 2.10-SNAPSHOT |
| Database         | PostgreSQL                       | 16            |
| ORM              | Prisma                           | 7.2.0         |
| Monitoring       | Kibana                           | 8.17.0        |
| Containerization | Docker + Docker Compose          | 28.x          |

3. **Configurer l'environnement**
   Créez un fichier `.env` à la racine :

   ```env
   # Authentification NextAuth
   NEXTAUTH_SECRET=your-secret-key-here
   NEXTAUTH_URL=http://localhost:3000

   # Configuration Elasticsearch
   ELASTICSEARCH_URL=http://localhost:9200
   ELASTICSEARCH_INDEX=search_index

   # Configuration des fichiers
   UPLOAD_DIRECTORY=/path/to/your/documents
   ALLOWED_FILE_TYPES=image/*,application/pdf,text/*,application/msword
   MAX_FILE_SIZE=10485760
   ```

4. **Démarrer en développement**

   ```bash
   pnpm dev
   ```

5. **Accéder à l'application**
   - Interface principale: `http://localhost:3000`
   - Administration: `http://localhost:3000/admin`

## Structure du Projet

```
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── analytics/           # Statistiques Elasticsearch
│   │   ├── auth/               # NextAuth endpoints
│   │   ├── search/             # Moteur de recherche
│   │   ├── suggestions/        # Suggestions intelligentes
│   │   ├── search-library/     # Bibliothèque auto-apprenante
│   │   ├── upload/             # Gestion des fichiers
│   │   └── pdf/               # Visualisation PDF
│   ├── admin/                  # Interface d'administration
│   │   ├── logs/              # Visualiseur de logs
│   │   └── search-library/    # Gestion bibliothèque
│   └── auth/                  # Pages d'authentification
├── components/                # Composants React
│   ├── ui/                   # Composants shadcn/ui
│   ├── admin/               # Composants d'administration
│   ├── enhanced-search-suggestions.tsx  # Suggestions avancées
│   ├── search-interface.tsx # Interface de recherche principale
│   └── ...
├── lib/                     # Services et utilitaires
│   ├── elasticsearch.ts    # Client Elasticsearch
│   ├── pdf-utils.ts        # Traitement PDF
│   ├── access-control.ts   # Contrôle d'accès
│   └── ...
├── hooks/                   # Hooks React personnalisés
│   ├── use-suggestions.ts   # Gestion des suggestions
│   ├── use-search-tracking.ts # Suivi des recherches
│   └── ...
├── data/                    # Données persistantes
│   ├── search-stats.json    # Statistiques de recherche
│   └── search-library.json  # Bibliothèque de termes
├── public/                  # Fichiers statiques
├── Dockerfile              # Configuration Docker
├── docker-compose.yml      # Orchestration des services
└── ecosystem.config.js     # Configuration PM2
```

## Fonctionnalités Détaillées

### Système de Suggestions Intelligent

Le système de suggestions utilise plusieurs sources pour fournir des résultats pertinents :

1. **Suggestions Elasticsearch** - Recherche sémantique dans l'index
2. **Termes populaires** - Basés sur l'historique des recherches
3. **Suggestions contextuelles** - Adaptées au contexte utilisateur
4. **Corrections orthographiques** - Détection et correction automatique
5. **Bibliothèque dynamique** - Apprentissage continu des patterns utilisateur

### Visualiseur de Documents PDF

Le visualiseur PDF intelligent affiche stratégiquement :

- **Première page** - Aperçu du document
- **Pages avec termes recherchés** - Contexte des résultats
- **Dernière page** - Vue d'ensemble du contenu
- **Navigation fluide** - Entre les pages pertinentes
- **Mise en surbrillance** - Des termes recherchés

### Bibliothèque de Recherche Auto-Apprenante

Système innovant qui :

- **Collecte automatiquement** les termes de recherche
- **Analyse les patterns** de recherche utilisateur
- **Améliore les suggestions** en temps réel
- **Fournit des insights** via l'interface d'administration
- **S'adapte aux domaines** spécifiques des documents

### Administration Avancée

L'interface d'administration offre :

- **Dashboard temps réel** avec métriques clés
- **Gestion des fichiers** avec aperçu et métadonnées
- **Analyse des recherches** avec graphiques interactifs
- **Bibliothèque de termes** avec filtres et tri
- **Logs système** pour le debugging
- **Tests d'intégrité** des services connectés

## Déploiement

### Option 1: Déploiement Docker (Recommandé)

1. **Build de l'image**

   ```bash
   NODE_ENV=production pnpm build
   docker build -t search-engine .
   ```

2. **Déploiement avec Docker Compose**

   ```bash
   docker-compose up -d
   ```

   Services inclus :
   - Application Next.js (port 3000)
   - Elasticsearch (port 9200)
   - Volumes persistants pour les données

### Option 2: Déploiement PM2

1. **Build de production**

   ```bash
   NODE_ENV=production pnpm build
   ```

2. **Lancement avec PM2**
   ```bash
   pm2 start ecosystem.config.js
   ```

### Option 3: Déploiement Vercel/Netlify

1. **Configuration des variables d'environnement**
2. **Push sur votre repository Git**
3. **Connexion automatique** avec la plateforme

### Variables d'Environnement de Production

```env
NODE_ENV=production
NEXTAUTH_SECRET=<strong-secret-key>
NEXTAUTH_URL=https://votre-domaine.com
ELASTICSEARCH_URL=http://elasticsearch:9200
ELASTICSEARCH_INDEX=production_index
UPLOAD_DIRECTORY=/app/uploads
```

## Développement et Contribution

### Architecture du Code

- **Composants modulaires** avec responsabilités séparées
- **Hooks personnalisés** pour la logique métier
- **Services centralisés** pour les API externes
- **Types TypeScript** stricts pour la sécurité
- **Tests** unitaires et d'intégration

### Ajout de Nouvelles Fonctionnalités

1. **Créer le composant** dans `components/`
2. **Ajouter les API routes** dans `app/api/`
3. **Configurer les types** TypeScript
4. **Tester** en mode développement
5. **Documenter** les changements

### Standards de Code

- **ESLint + Prettier** pour la cohérence
- **Commits conventionnels** pour l'historique
- **Tests** obligatoires pour les nouvelles features
- **Documentation** des API et composants

## Performance et Optimisations

### Optimisations Techniques

- **Lazy loading** des composants lourds
- **Cache intelligent** des résultats de recherche
- **Compression** des réponses API
- **Optimisation des images** automatique
- **Bundle splitting** pour des temps de chargement optimaux

### Métriques de Performance

- **Time to First Byte** < 200ms
- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Search Response Time** < 300ms

## Sécurité

### Mesures de Sécurité Implémentées

- **Authentification** NextAuth avec sessions sécurisées
- **Validation** stricte des inputs utilisateur
- **Sanitisation** des données avant indexation
- **Contrôle d'accès** par rôles utilisateur
- **Upload sécurisé** avec validation des types de fichiers
- **Rate limiting** sur les API endpoints

## Monitoring et Logs

### Système de Logs

- **Logs structurés** au format JSON
- **Niveaux de logs** configurables
- **Rotation automatique** des fichiers de logs
- **Monitoring** des erreurs en temps réel

### Métriques Surveillées

- **Utilisation des ressources** (CPU, mémoire)
- **Temps de réponse** des API
- **Taux d'erreur** par endpoint
- **Satisfaction utilisateur** via les statistiques d'usage

## Contribution

Les contributions sont les bienvenues ! Voici comment participer :

1. **Fork** le projet
2. **Créer une branche** pour votre feature (`git checkout -b feature/AmazingFeature`)
3. **Commiter** vos changements (`git commit -m 'Add some AmazingFeature'`)
4. **Pusher** vers la branche (`git push origin feature/AmazingFeature`)
5. **Ouvrir une Pull Request**

### Guidelines de Contribution

- Respecter les standards de code existants
- Ajouter des tests pour les nouvelles fonctionnalités
- Documenter les changements dans le README
- Vérifier que tous les tests passent avant de soumettre

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

---

## Support et Contact

Pour toute question ou support :

- **Issues GitHub** : Pour les bugs et demandes de fonctionnalités
- **Discussions** : Pour les questions générales
- **Documentation** : Wiki du projet pour des guides détaillés

**Développé avec ❤️ par l'équipe de développement**
