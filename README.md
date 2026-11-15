# Orvix

**Build AI agents on a canvas.** Wire a Start node to an Agent node to an End node, attach tools, and test the whole graph in a chat panel — node wiring instead of YAML.

[Live app](https://orvix-bay.vercel.app) · [GitHub](https://github.com/neerajgir/Orvix) · [Report an issue](https://github.com/neerajgir/Orvix/issues)

![Orvix landing page](./ss/Heading.png)

---

## Table of contents

- [What Orvix is](#what-orvix-is)
- [Screenshots](#screenshots)
- [Features](#features)
- [How it works](#how-it-works)
  - [Architecture at a glance](#architecture-at-a-glance)
  - [The canvas model](#the-canvas-model)
  - [One chat turn, end to end](#one-chat-turn-end-to-end)
  - [Persistence and data model](#persistence-and-data-model)
- [The tool system](#the-tool-system)
- [Real-life usages](#real-life-usages)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database setup](#database-setup)
- [Deployment](#deployment)
- [Design notes and current limits](#design-notes-and-current-limits)
- [Roadmap](#roadmap)

---

## What Orvix is

Most agent frameworks ask you to describe an agent in code: a system prompt here, a tool list there, a graph builder somewhere else. Orvix puts the same ideas on a canvas so you can see the shape of the agent while you build it.

An agent in Orvix is:

1. **A graph** — `Start → Agent → End`, editable by dragging nodes and drawing edges.
2. **An Agent node** — system instructions, a Gemini model ID, attached tools, optional GitHub defaults.
3. **A test chat** — runs the exact graph you see, streams tool calls live, and stores the conversation.

The builder is a real persistence layer, not a mockup: the graph is saved to Postgres, migrated between schema versions, compiled to a LangGraph state machine, and executed server-side with per-user credentials.

---

## Screenshots

### Dashboard — every agent you own

![Dashboard](./ss/Dashboard.png)

### Canvas — Start, Agent, End

![Canvas](./ss/Canvas.png)

### Create Agent — blank or a template

![Create agent from template](./ss/Create%20Agents%20Templates.png)

### Tools drawer — built-ins, GitHub, custom HTTP

![Tools drawer](./ss/Tools.png)

---

## Features

- **Visual graph builder** — React Flow canvas with typed nodes (`start`, `agent`, `end`) and connection rules (Start → Agent → End only).
- **Agent node configuration** — instructions, model selection, tool badges, GitHub repository defaults.
- **Tool system** — calculator, weather, web search, webpage reader, four GitHub tools, plus user-defined HTTP tools.
- **Per-user credentials** — GitHub tools use the signed-in user's own OAuth token. No shared service token.
- **Test chat with live tool trace** — tool starts/completions and text arrive over Server-Sent Events while the run executes.
- **Persisted conversations** — every user and assistant message is stored with its tool event trace.
- **Templates** — Weather, Web Research, Travel, Writing, Coding, and PR Review assistants, plus a blank agent.
- **Schema migration** — older v1 agents and v1 canvases are upgraded to the current v2 builder definition automatically.
- **Dark/light/system themes** — `next-themes` with a toggle on the landing page.
- **GitHub OAuth** — Better Auth with the `user:email` and `repo` scopes.

---

## How it works

### Architecture at a glance

```mermaid
flowchart TB
  subgraph Browser
    L[Landing page]
    D[Dashboard /agents]
    B[Builder canvas<br/>React Flow + Zustand]
    C[Test chat panel]
  end

  subgraph Next["Next.js 16 app"]
    SA[Server actions<br/>agents, auth]
    API["POST /api/agents/:id/runs<br/>SSE stream"]
    RT[Runtime<br/>LangGraph + LangChain]
    TR[Tool registry]
  end

  subgraph Data
    PA[Better Auth<br/>GitHub OAuth]
    PR[Prisma 7<br/>driver adapter pg]
    DB[(Postgres<br/>Neon)]
  end

  subgraph External
    G[Google Gemini API]
    T[Tavily API]
    W[Open-Meteo API]
    GH[GitHub REST API]
  end

  L --> SA
  D --> SA
  B --> SA
  C --> API

  SA --> PA
  SA --> PR
  PA --> PR
  PR --> DB
  API --> PA
  API --> PR
  API --> RT
  RT --> TR
  RT --> G
  TR --> T
  TR --> W
  TR --> GH
```

The browser never talks to the model providers directly. It sends a graph definition and a message to the run endpoint; the server compiles the graph, resolves the user's tools, calls Gemini, executes tool calls, persists the results, and streams events back.

### The canvas model

Orvix keeps **two related representations** of the same agent and converts between them at well-defined boundaries:

```mermaid
flowchart LR
  subgraph UI["Canvas state (Zustand)"]
    N["nodes:<br/>start / agent / end"]
    E["edges"]
    M["memoryEnabled<br/>limits"]
  end

  subgraph Builder["BuilderDefinition (schema v2)"]
    BN["nodes with typed config"]
    BE["execution edges"]
    BL["limits:<br/>maxGraphSteps<br/>maxToolCalls<br/>timeoutMs"]
  end

  subgraph Agent["AgentDefinition (runtime, v1 shape)"]
    AI["instructions"]
    AM["model: google + modelId"]
    AT["tools"]
    AG["github defaults"]
  end

  subgraph Exec["LangGraph"]
    SG["StateGraph:<br/>START → start → agent → end → END"]
  end

  UI -->|canvasToBuilderDefinition| Builder
  Builder -->|builderToAgentDefinition| Agent
  Builder -->|compileWorkflow| Exec
  Agent -->|runAgentNode| Exec
  Exec -->|SSE events| UI
```

Why two shapes?

- **`BuilderDefinition` (schemaVersion 2)** is the durable, graph-shaped truth. It knows about node IDs, edges, graph limits, and memory. It is what gets saved in `Agent.draftDefinition`.
- **`AgentDefinition` (schemaVersion 1)** is the flat runtime contract the executor consumes: one set of instructions, one model, one tool list. `builderToAgentDefinition()` collapses the Agent node into that contract.

The canvas layout is saved separately in `Agent.canvas` as raw React Flow nodes and edges, so reopening an agent restores exact node positions without polluting the semantic definition.

**Connection rules** are enforced in the store, not just visually:

```mermaid
flowchart LR
  S((Start)) --> A((Agent))
  A --> E((End))
  S -. blocked .-> E
  A -. blocked .-> A
  E -. blocked .-> A
```

**Graph validation** runs before execution (`validateGraph`):

- exactly one Start node
- exactly one End node
- at least one Agent node
- every edge points at a known node
- a path exists from Start to End
- no cycles

**Schema migration** is handled by `loadBuilderDefinition()` and `loadCanvasFromDraft()`:

```mermaid
flowchart TD
  RAW[Saved draftDefinition / canvas] --> V{schemaVersion?}
  V -->|1| M1[migrateV1ToV2]
  V -->|2| OK[Use as-is]
  V -->|missing/unknown| DEF[defaultBuilderDefinition]
  M1 --> OK

  CANVAS[Saved canvas nodes] --> C1{has model/tool/memory<br/>but no start node?}
  C1 -->|yes, v1 canvas| M2[migrateV1CanvasToV2<br/>fold model/tool/memory<br/>nodes into Agent node]
  C1 -->|no| C2[Use saved nodes and edges]
```

This matters because early Orvix versions modeled the model, tools, and memory as separate canvas nodes. Those agents still open and run correctly after migration — the old model/tool/memory nodes are folded into the single Agent node.

### One chat turn, end to end

```mermaid
sequenceDiagram
  autonumber
  participant U as User
  participant CP as ChatPanel
  participant API as /api/agents/:id/runs
  participant DB as Postgres
  participant RT as Runtime
  participant LLM as Gemini
  participant TL as Tool

  U->>CP: Send message
  CP->>API: POST message + definition
  API->>DB: Verify agent ownership
  API->>DB: Load or create conversation
  API->>DB: Save user message
  API-->>CP: Open SSE stream

  API->>RT: runAgentStream(definition, history, message, userId)
  RT->>RT: Resolve tools for this user
  RT->>LLM: invoke(messages)
  LLM-->>RT: tool_calls

  loop each tool call
    RT-->>CP: tool_started
    RT->>TL: invoke(args)
    TL-->>RT: output
    RT-->>CP: tool_completed
    RT->>LLM: invoke(messages + tool result)
  end

  LLM-->>RT: final text
  RT-->>CP: text_delta
  RT->>DB: Save assistant message + toolEvents
  API-->>CP: run_completed (conversationId)
```

Important details:

- The run endpoint verifies that the agent belongs to the session user before doing anything.
- Conversation history is loaded from the database and passed into the model, so follow-up turns keep context.
- `maxToolCalls` and `maxGraphSteps` are enforced server-side, not in the UI.
- Tool outputs are truncated before being handed back to the model (8,000 characters) to keep prompts bounded.
- The SSE protocol is line-based `data: {json}\n\n`; the client reassembles partial lines from `TextDecoder`.

Event types:

| Event | Meaning |
| --- | --- |
| `text_delta` | Assistant text for the current turn |
| `tool_started` | A tool call began, with its input |
| `tool_completed` | A tool call finished, with its output |
| `run_completed` | Run finished; includes the conversation ID |
| `run_failed` | Run failed; includes an error message |

### Persistence and data model

```mermaid
erDiagram
  USER ||--o{ AGENT : owns
  USER ||--o{ SESSION : has
  USER ||--o{ ACCOUNT : links
  AGENT ||--o{ CONVERSATION : has
  CONVERSATION ||--o{ MESSAGE : contains

  USER {
    string id PK
    string name
    string email
    string image
  }

  AGENT {
    string id PK
    string userId FK
    string name
    string description
    string icon
    string welcomeMessage
    json starterPrompts
    json draftDefinition
    json canvas
    datetime updatedAt
  }

  CONVERSATION {
    string id PK
    string userId FK
    string agentId FK
    string title
  }

  MESSAGE {
    string id PK
    string conversationId FK
    string role
    string content
    json toolEvents
  }

  ACCOUNT {
    string id PK
    string userId FK
    string providerId
    string accessToken
    string scope
  }
```

`draftDefinition` holds the semantic graph. `canvas` holds layout. Splitting them means you can restructure the graph without losing node positions, and vice versa.

Better Auth owns `user`, `session`, `account`, and `verification`. The GitHub OAuth access token lives in `account.accessToken` and is read by the runtime when GitHub tools are attached.

---

## The tool system

Tools are resolved at run time from the Agent node's tool list:

```mermaid
flowchart TD
  DEF[AgentDefinition.tools] --> LOOP{for each tool}
  LOOP -->|custom config| CT[buildCustomTool<br/>Zod schema from params]
  LOOP -->|built-in id| BI[calculator / weather /<br/>web_search / read_webpage]
  LOOP -->|github id| GH[createGithubTools<br/>with user's OAuth token]
  LOOP -->|unknown| SKIP[skip]
  CT --> BIND[model.bindTools]
  BI --> BIND
  GH --> BIND
  BIND --> RUN[Agent loop]
```

| Tool | What it does | Credential |
| --- | --- | --- |
| `calculator` | Safe arithmetic on a numeric expression | none |
| `weather` | Geocoding + 3-day forecast via Open-Meteo | none |
| `web_search` | Top 5 web results via Tavily | `TAVILY_API_KEY` |
| `read_webpage` | Extracts readable text from a URL via Tavily, with advanced-extract fallback | `TAVILY_API_KEY` |
| `github_read_file` | Reads a file from a repo | GitHub OAuth token |
| `github_search_code` | Code search scoped to a repo | GitHub OAuth token |
| `github_get_pr` | PR title, body, state, stats | GitHub OAuth token |
| `github_get_diff` | Raw PR diff | GitHub OAuth token |

### Custom HTTP tools

The custom tool builder turns any HTTP endpoint into a structured LangChain tool:

```mermaid
flowchart LR
  FORM[Name, description,<br/>method, URL, headers,<br/>body, parameters] --> CFG[CustomToolConfig]
  CFG --> ZOD[Zod schema<br/>string / number / boolean<br/>required or optional]
  ZOD --> TOOL[LangChain tool]
  TOOL --> FILL["fillTemplate: {{param}}"]
  FILL --> FETCH[fetch with timeout]
  FETCH --> TRUNC[truncate to 8,000 chars]
```

Example configuration for an internal CRM lookup:

```json
{
  "type": "custom",
  "name": "Lookup customer",
  "description": "Find a customer record by email address",
  "method": "GET",
  "url": "https://crm.internal.example/api/customers?email={{email}}",
  "headers": [{ "key": "Authorization", "value": "Bearer ..." }],
  "parameters": [
    {
      "name": "email",
      "type": "string",
      "description": "Customer email address",
      "required": true
    }
  ],
  "timeoutMs": 10000
}
```

The model sees only the name, description, and parameter schema. It fills the parameters; the runtime interpolates them into the URL, headers, and body.

> **Security note:** custom tool headers are stored inside the agent definition. Anyone with database access can read them. For production secrets, prefer a server-side proxy endpoint that holds the credential and expose only that proxy as the custom tool.

---

## Real-life usages

### 1. Weather and travel planning

**Template:** Weather Assistant / Travel Assistant
**Tools:** `weather`, `web_search`, `calculator`

Ask "Plan a weekend in Paris" and the agent checks the forecast, searches for current events, and does simple budget math. The tool trace in the chat tells you which source produced which part of the answer.

### 2. PR review assistant

**Template:** PR Review Assistant
**Tools:** `github_get_pr`, `github_get_diff`, `read_webpage`
**GitHub defaults:** `owner`, `repo`, `defaultPrNumber`

Paste a PR URL or number. The agent pulls the diff and review metadata with your own GitHub token, then summarizes risk areas and suggests changes. Useful as a first-pass reviewer before a human looks at the PR.

### 3. Codebase explainer

**Template:** Coding Helper
**Tools:** `github_search_code`, `github_read_file`, `read_webpage`

Ask "Where do we handle auth callbacks?" The agent searches the repo, opens candidate files, and explains the flow. Because search is scoped to your configured repository, results stay relevant.

### 4. Internal API assistant with a custom tool

**Tools:** one custom HTTP tool per endpoint

Point the custom tool at an internal service — a CRM lookup, an inventory check, a feature-flag reader. Describing the endpoint in the tool description is enough for the model to know when to call it. This is the fastest way to give an agent access to a system that has no official LangChain integration.

### 5. Research and competitive monitoring

**Template:** Web Research Assistant
**Tools:** `web_search`, `read_webpage`

Search a topic, open the most relevant pages, and return a cited summary. Because each conversation is persisted, you can return to the same thread and continue the research with full context.

### 6. Support triage draft

**Tools:** custom HTTP tool to your helpdesk + `read_webpage` for docs

The agent classifies the request, looks up the customer, reads the relevant documentation page, and drafts a reply. It does not send anything — the output is a draft for a human agent.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, cache components, Turbopack) |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Base UI, Hugeicons |
| Canvas | React Flow (`@xyflow/react`) |
| Client state | Zustand (canvas store), TanStack Query (server state) |
| Auth | Better Auth + GitHub OAuth |
| Database | Postgres via Prisma 7 (`@prisma/adapter-pg`) |
| Agent runtime | LangGraph (`StateGraph`) + LangChain |
| Model | Google Gemini via `@langchain/google-genai` |
| Web data | Tavily |
| Hosting | Vercel |

---

## Project structure

```text
orvix/
├─ app/
│  ├─ page.tsx                       # public landing page
│  ├─ (auth)/login/                  # sign-in
│  ├─ (dashboard)/
│  │  ├─ layout.tsx                  # sidebar shell
│  │  └─ agents/
│  │     ├─ page.tsx                 # agent list
│  │     ├─ new/page.tsx             # blank or template
│  │     └─ [agentId]/builder/page.tsx
│  └─ api/
│     ├─ auth/[...all]/route.ts      # Better Auth handler
│     └─ agents/[agentId]/runs/route.ts  # SSE run endpoint
├─ components/
│  ├─ landing/                       # landing canvas mock
│  ├─ providers/                     # theme, query, tooltip
│  └─ ui/                            # shadcn-style primitives
├─ lib/
│  ├─ auth.ts                        # Better Auth config
│  ├─ db.ts                          # Prisma client + PG adapter
│  └─ generated/prisma/              # generated client
├─ modules/
│  ├─ agents/                        # definitions, templates, actions, hooks
│  ├─ auth/                          # sign-in/out, requireAuth
│  ├─ builder/                       # canvas, nodes, drawers, store, serialization
│  ├─ playground/                    # chat panel + SSE client
│  ├─ runtime/                       # graph validation, compile, agent loop
│  ├─ tools/                         # built-ins, GitHub, custom HTTP
│  └─ workflows/                     # builder schema, v1 migration
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ proxy.ts                          # cookie-based route protection
└─ docker-compose.yml                # local Postgres
```

**Conventions worth knowing:**

- `modules/<domain>` groups feature code (components, hooks, actions, lib). Shared UI stays in `components/ui`.
- Server actions are colocated with their domain in `modules/*/actions/index.ts`.
- Every module imports through the `@/` alias.
- The landing route is public; `proxy.ts` only guards `/agents*`, and `requireAuth()` is the real server-side check.

---

## Getting started

### Prerequisites

- Node.js 20+ and [Bun](https://bun.sh) (the repo pins `bun@1.4.4`)
- Postgres 15+ (local Docker or Neon)
- A GitHub OAuth app
- A Gemini API key
- A Tavily API key (optional, only for web tools)

### 1. Clone and install

```bash
git clone https://github.com/neerajgir/Orvix.git
cd Orvix
bun install
```

### 2. Start a database

Local Postgres with Docker:

```bash
docker compose up -d
```

This starts Postgres 17 on `localhost:5432` with database `orvix`. The default credentials in `docker-compose.yml` are for local development only — change them if the port is reachable from outside your machine.

Or use a hosted Postgres and put its connection string in `.env`.

### 3. Configure environment variables

Create `.env`:

```env
DATABASE_URL="postgresql://postgres:password123@localhost:5432/orvix?schema=public"

BETTER_AUTH_SECRET="generate-a-long-random-string"
BETTER_AUTH_URL="http://localhost:3000"

GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

GEMINI_API_KEY="..."
TAVILY_API_KEY="..."
```

Generate a secret with:

```bash
openssl rand -base64 32
```

### 4. Apply migrations

```bash
bunx prisma migrate deploy
```

For development with an evolving schema:

```bash
bunx prisma migrate dev
```

### 5. Run

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with GitHub, and create an agent.

### 6. GitHub OAuth app

Create an OAuth app at <https://github.com/settings/developers>:

- **Homepage URL:** `http://localhost:3000`
- **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`

For production, add the deployed domain as a second OAuth app (or update the callback URL):

```text
https://orvix-bay.vercel.app/api/auth/callback/github
```

A callback mismatch shows up as GitHub's `redirect_uri_mismatch` error before Orvix receives any request.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | Postgres connection string used by Prisma and Better Auth |
| `BETTER_AUTH_SECRET` | yes | Signing secret for sessions |
| `BETTER_AUTH_URL` | yes | Public base URL of the app (localhost in dev, production domain in prod) |
| `GITHUB_CLIENT_ID` | yes | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | yes | GitHub OAuth app client secret |
| `GEMINI_API_KEY` | yes | Google Gemini API key for the agent runtime |
| `TAVILY_API_KEY` | optional | Enables `web_search` and `read_webpage` |

Without `TAVILY_API_KEY`, the web tools return a configuration message instead of failing the run. Without `GEMINI_API_KEY`, runs fail fast with an explicit error.

---

## Database setup

Prisma 7 uses a driver adapter. `lib/db.ts` creates a single `PrismaPg` adapter from `DATABASE_URL` and reuses the client across hot reloads in development:

```ts
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });
```

The generated client lives in `lib/generated/prisma`, not `node_modules`, so `prisma generate` must run before type-checking or building. The build script already does this:

```json
{ "build": "prisma generate && next build" }
```

Migrations live in `prisma/migrations`. To inspect data:

```bash
bunx prisma studio
```

Hosted Postgres note: serverless functions need a pooler endpoint. With Neon, use the `-pooler` host in `DATABASE_URL` for the app and the direct host for migrations if your provider requires it.

---

## Deployment

Orvix deploys on Vercel with the Git integration: push to `main`, Vercel builds and promotes the deployment.

### Checklist

1. **Push the repository** to GitHub.
2. **Import the project** in Vercel.
3. **Add environment variables** for Production (and Preview if needed) — same names as `.env`.
4. **Set `BETTER_AUTH_URL`** to the stable production domain, for example `https://orvix-bay.vercel.app`.
5. **Update the GitHub OAuth callback** to `https://<your-domain>/api/auth/callback/github`.
6. **Run migrations against the production database**:

   ```bash
   DATABASE_URL="<production-url>" bunx prisma migrate deploy
   ```

7. **Verify** the landing page, sign-in, agent creation, and a test chat run.

Use the project's stable domain, not a per-deployment URL. Vercel keeps every deployment URL immutable — an old deployment keeps serving its old build forever, so a stale link can look like a bug that no new push fixes.

### Runtime notes

- The run endpoint streams SSE. Keep the route on the Node.js runtime; long tool loops need more than an edge function's budget.
- Model and tool calls happen server-side. API keys never reach the browser.
- Agent ownership is checked on every run request, not just when the page renders.

---

## Design notes and current limits

- **One Agent node per workflow.** The canvas enforces `Start → Agent → End`, and `validateGraph` rejects graphs without exactly one Agent. Multi-agent routing is not implemented yet.
- **The model is Google-only at runtime.** `AgentDefinition.model.provider` exists for forward compatibility, but `runAgentNode` always uses `ChatGoogleGenerativeAI`. The runtime guards against non-Gemini model IDs saved by older versions and falls back to `gemini-3.5-flash-lite`.
- **Model output is not token-streamed from Gemini.** The model is invoked once per turn; the resulting text is emitted as one `text_delta` over SSE. Tool events still stream as they happen.
- **`memory.enabled` is stored but conversation history is passed every turn.** The flag is carried through the schema and UI; history loading is currently unconditional.
- **Custom tool secrets are stored with the agent.** Use a proxy endpoint for real credentials.
- **No per-agent rate limiting.** `maxToolCalls` and `maxGraphSteps` bound a single run, but there is no workspace-level quota.

---

## Roadmap

- Multiple agent nodes with conditional routing and parallel branches
- Token-level streaming from Gemini
- More providers behind the existing `model.provider` field
- Run history UI with per-step inspection
- Tool-level retries and structured error surfaces
- Agent sharing and read-only preview links
- Per-user and per-agent usage limits

---

Built with Next.js, LangGraph, Prisma, and Better Auth. Live at [orvix-bay.vercel.app](https://orvix-bay.vercel.app).
