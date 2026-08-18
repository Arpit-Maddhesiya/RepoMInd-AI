# RepoMind AI 🧠

> **Turn any GitHub repository into an intelligent, conversational knowledge base.**
> Import a repo, ask questions in natural language, and get answers grounded in the actual source code — with clickable citations to exact files and line ranges.

![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20LangChain%20%2B%20FAISS%20%2B%20Gemini-7c3aed)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178c6)
![License](https://img.shields.io/badge/License-MIT-10b981)

---

## Table of Contents

- [Why RAG?](#why-rag)
- [Features](#features)
- [Architecture](#architecture)
- [RAG Pipeline](#rag-pipeline)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Future Improvements](#future-improvements)

---

## Why RAG?

Sending an entire repository to an LLM is impractical and wrong for several reasons:

1. **Context limits** — LLMs have a fixed token window. A real repository has hundreds of thousands of lines; only a tiny fraction can ever fit in a prompt.
2. **Cost** — Tokens cost money. Indexing once and retrieving a few relevant chunks per question is drastically cheaper than re-sending the whole repo.
3. **Hallucinations** — Without grounding, the model invents files, functions, and behaviors. RAG retrieves *actual code* and forces the answer to be grounded in it.
4. **Latency** — Retrieving 5 relevant chunks is milliseconds; generating a response from a huge prompt is slow.

**RepoMind AI indexes the repository once** (clone → filter → chunk → embed → vector index), then for each question it **retrieves only the most relevant code** and feeds that to the LLM. Every answer cites the exact source files and line ranges it came from.

---

## Features

- 🔗 **Import any public GitHub repository** — validated URL, metadata fetched from the GitHub API (stars, forks, language, branch).
- 🧠 **Smart code chunking** — AST-based extraction of functions/classes/methods for JavaScript & TypeScript (Babel), heuristic extraction for Python/Go/Rust/Java/C/C++/Ruby/PHP/Kotlin/Swift/C#, and line-block fallback for everything else. Every chunk carries `{ filePath, startLine, endLine, symbolName, chunkType }`.
- 🔍 **Semantic vector search** — Gemini `text-embedding-004` embeddings stored in a FAISS index on disk per repository.
- 💬 **Streaming AI chat** — Server-Sent Events (SSE) stream answers token-by-token with a grounded RAG prompt and conversation history.
- 📎 **Source citations** — every answer lists the retrieved chunks with file path, line range, language, and snippet. Click to open the file.
- 📂 **Repository explorer** — browse the full file tree, open any file with syntax highlighting, line numbers, and an AI toolbar.
- 🛠️ **AI developer tools** — Explain, Review, Security, Summarize, Architecture, and Documentation for any file or selected code.
- 📊 **Real-time indexing progress** — QUEUED → CLONING → ANALYZING → CHUNKING → EMBEDDING → INDEXING → COMPLETED with a live progress percentage.
- 🔐 **Production-grade auth** — JWT with bcrypt hashing, input validation (Zod), rate limiting, Helmet, and CORS.
- 🎨 **Premium dark UI** — GitHub/VS Code-inspired design system with Tailwind CSS v4, Inter + JetBrains Mono.

---

## Architecture

```
┌─────────────────────┐        ┌──────────────────────────────┐
│   React + Vite SPA  │        │        Express API           │
│  (TypeScript, TWS)  │        │   (TypeScript, MVC)          │
└──────────┬──────────┘        └──────┬───────────────────────┘
           │  REST + SSE (streaming)  │
           └──────────────────────────┤
                                      ▼
                          ┌───────────────────────┐
                          │   MongoDB (Mongoose)  │
                          │ Users · Repositories  │
                          │ Chunks · Conversations│
                          │ Messages · RepoFiles  │
                          └───────────┬───────────┘
                                      │
        ┌─────────────┬───────────────┼────────────────┬─────────────┐
        ▼             ▼               ▼                ▼             ▼
   GitHub API    Git clone       AI Provider      FAISS index   Storage/
   (metadata)    (shallow)       (Gemini)         (per repo)    repos + indexes
```

### Services breakdown

| Service | Responsibility |
|---|---|
| `services/github/` | URL parsing, metadata via Octokit, shallow cloning |
| `services/ingestion/` | In-process queue, pipeline orchestration, file filtering & walking |
| `services/chunking/` | Babel AST chunker, heuristic chunker, line-block fallback |
| `services/embeddings/` | Batched embedding generation (25/batch, rate-limit retry with backoff) |
| `services/rag/` | FAISS vector store, top-K retrieval, prompt construction, chat service |
| `services/ai/` | `AIProvider` abstraction — swap Gemini for any provider by implementing one interface |

---

## RAG Pipeline

```
GitHub URL
    │
    ▼
[1] Validate + fetch metadata (GitHub API)
    │
    ▼
[2] Clone (shallow, branch-aware)
    │
    ▼
[3] Walk & filter (skip node_modules/.git/dist/binaries, 500 KB cap)
    │
    ▼
[4] Chunk intelligently (AST / heuristics / fallback) ──► metadata + line ranges
    │
    ▼
[5] Embed (Gemini text-embedding-004, batched)
    │
    ▼
[6] Build FAISS index (stored on disk per repository)
    │
    ▼
────────────────────────────────────────────────────────────
User question
    │
    ▼
[7] Embed the question
    │
    ▼
[8] Similarity search → top-K chunks (deduped)
    │
    ▼
[9] Build grounded prompt (system prompt + context + history)
    │
    ▼
[10] Gemini LLM → streamed answer + source references
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite 6, TypeScript, Tailwind CSS v4, React Router 7, Zustand, Lucide icons, react-markdown + react-syntax-highlighter |
| **Backend** | Node.js, Express 4, TypeScript, Zod validation, Mongoose |
| **AI / RAG** | Google Gemini (`gemini-1.5-flash` + `text-embedding-004`), LangChain, FAISS (`faiss-node`) |
| **Vector Store** | FAISS on disk (`server/storage/indexes/<repoId>`) |
| **Database** | MongoDB (local or Atlas) |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Testing** | Vitest + Supertest |
| **Security** | Helmet, CORS, express-rate-limit, input validation |

---

## Project Structure

```
RepoMind AI/
├── client/                          # React + Vite frontend
│   └── src/
│       ├── api/                     # Axios clients + SSE streaming helper
│       ├── components/
│       │   ├── chat/                # ChatWindow, MessageBubble, ChatSidebar
│       │   ├── layout/              # AppLayout, AuthLayout, ProtectedRoute
│       │   ├── repo/                # RepoCard, FileTree, CodeViewer, ProgressBar
│       │   └── ui/                  # Button, Badge, Modal, Toast, CodeBlock...
│       ├── hooks/                   # useRepoStatus (polling), useChatStream (SSE)
│       ├── pages/                   # Landing, Login, Register, Dashboard, Repository, Settings
│       ├── store/                   # Zustand stores (auth, repos, toasts)
│       └── types/                   # Shared API types
│
├── server/                          # Express backend
│   └── src/
│       ├── config/                  # env.ts (Zod-validated), db.ts
│       ├── controllers/             # auth, repository, chat, aiTools
│       ├── middleware/              # protect (JWT), validate, errorHandler
│       ├── models/                  # User, Repository, RepoFile, Chunk, Conversation, Message
│       ├── routes/                  # Express routers
│       ├── services/
│       │   ├── github/              # urlParser, metadata, cloner
│       │   ├── ingestion/           # queue, pipeline, fileFilter, walker
│       │   ├── chunking/            # babelChunker, heuristicChunker, fallbackChunker
│       │   ├── embeddings/          # embeddingService
│       │   ├── rag/                 # vectorStore, retriever, promptBuilder, ragService
│       │   └── ai/                  # AIProvider, geminiProvider, prompts
│       ├── tests/                   # Vitest suites (auth, urlParser, fileFilter, chunking, RAG)
│       └── utils/                   # AppError, asyncHandler, logger, response
│
├── package.json                     # npm workspaces + root scripts
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v20+ (tested on v24)
- **MongoDB** running locally (`mongod`) or an Atlas URI
- **Git** (used by `simple-git` to clone repositories)
- **Gemini API key** — free at [https://aistudio.google.com/](https://aistudio.google.com/)

### Installation

```bash
# 1. Install all workspace dependencies
npm install --legacy-peer-deps

# 2. Configure environment
cp server/.env.example server/.env
#   → edit server/.env and set GOOGLE_API_KEY (required), MONGODB_URI, JWT_SECRET

# 3. Run both servers (Express :5000 + Vite :5174)
npm run dev
```

Open **http://localhost:5174** — register an account, import a repository, and start chatting.

> Use `npm run dev -w server` and `npm run dev -w client` to run them individually.

### Usage Flow

1. **Register / login** at the landing page.
2. Click **Import Repository**, paste a public GitHub URL (e.g. `https://github.com/expressjs/express`).
3. Watch the indexing progress: *QUEUED → CLONING → ANALYZING → CHUNKING → EMBEDDING → INDEXING → COMPLETED*.
4. **Ask questions** about the codebase — answers stream in with clickable source citations.
5. Open the **Files** tab to browse the repository, view code, select a snippet, and run AI tools (Explain / Review / Security / Docs...).

---

## Environment Variables

All variables live in `server/.env` (see `server/.env.example`):

| Variable | Required | Description |
|---|---|---|
| `PORT` | no | API port (default `5000`) |
| `NODE_ENV` | no | `development` / `production` / `test` |
| `CLIENT_URL` | no | CORS origin (default `http://localhost:5174`) |
| `MONGODB_URI` | **yes** | MongoDB connection string |
| `JWT_SECRET` | **yes** | JWT signing secret (min 16 chars) |
| `JWT_EXPIRES_IN` | no | Token lifetime (default `7d`) |
| `GOOGLE_API_KEY` | **yes** | Gemini API key (chat + embeddings) |
| `AI_MODEL` | no | Chat model (default `gemini-1.5-flash`) |
| `EMBEDDING_MODEL` | no | Embedding model (default `text-embedding-004`) |
| `GITHUB_TOKEN` | no | GitHub PAT — raises API rate limit from 60 to 5000 req/hr |

**Security:** secrets are only ever read server-side. Nothing is exposed to the frontend.

---

## API Documentation

All responses use `{ success: boolean, data?: any }` (or `{ success: false, message, errorCode }` on errors).

### Auth

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register (name, email, password) → token + user |
| POST | `/api/auth/login` | Login → token + user |
| POST | `/api/auth/logout` | Logout (stateless JWT) |
| GET | `/api/auth/me` | Current user (JWT required) |

### Repositories

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/repositories` | Import a GitHub repo (202, queues indexing) |
| GET | `/api/repositories` | List user's repositories |
| GET | `/api/repositories/:id` | Repository details |
| GET | `/api/repositories/:id/status` | Indexing status + progress |
| POST | `/api/repositories/:id/index` | Re-index |
| DELETE | `/api/repositories/:id` | Delete repo + chunks + conversations |
| GET | `/api/repositories/:id/tree` | Nested file tree for the explorer |
| GET | `/api/repositories/:id/files` | Paginated file list |
| GET | `/api/repositories/:id/files/:path` | Raw file content |

### Conversations & Chat

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/conversations/repository/:repoId` | List conversations |
| POST | `/api/conversations/repository/:repoId` | Create conversation |
| GET | `/api/conversations/:id/messages` | Get messages |
| POST | `/api/conversations/:id/messages` | Send message — **SSE stream** of the RAG answer |
| GET | `/api/conversations/:id` | Conversation details |
| DELETE | `/api/conversations/:id` | Delete conversation |

### AI Tools

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/explain` | Explain code/path |
| POST | `/api/ai/review` | Code review |
| POST | `/api/ai/security` | Security analysis |
| POST | `/api/ai/summarize` | Summarize file/repo |
| POST | `/api/ai/architecture` | Architecture explanation |
| POST | `/api/ai/documentation` | Generate docs |

---

## Testing

```bash
npm test                 # run the full server suite (Vitest)
npm run typecheck        # TypeScript type-checking (server + client)
```

Test coverage:
- **Authentication** — register/login/me, duplicate email, invalid payloads, password hashing, protected routes
- **GitHub URL parsing** — https/ssh/tree branches, malformed URLs
- **File filtering** — extensions, ignored dirs, lockfiles, size caps, config overrides
- **Chunking** — Babel AST extraction (functions/classes/methods, line ranges, JSX), heuristics (Python/Go/Rust), fallback, dispatch
- **RAG** — retrieval dedupe, prompt construction, sources, grounded answer generation (with a mocked AI provider)

The RAG tests mock the AI provider and vector store — no API keys or MongoDB needed for most suites.

---

## Future Improvements

- [ ] OpenAI / Anthropic provider adapters (the `AIProvider` interface already supports it)
- [ ] Repository code-select → "convert to TypeScript" / "write tests" actions
- [ ] Qdrant / Pinecone / Atlas vector search for serverless-scale deployments
- [ ] Incremental re-indexing (only changed files)
- [ ] Multi-user shared repository workspaces
- [ ] GitHub OAuth login
- [ ] Frontend unit tests (Vitest + Testing Library)

---

## License

MIT
