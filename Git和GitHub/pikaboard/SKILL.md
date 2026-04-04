---
name: pikaboard
description: "Interact with PikaBoard task management API. Use when creating, updating, listing, or managing tasks. Agent-first kanban for AI teams. Triggers on: tasks, kanban, board, todo, backlog, sprint."
metadata:
  openclaw:
    emoji: "📋"
    requires:
      bins: ["node", "npm"]
    install:
      - id: clone
        kind: git
        repo: https://github.com/angelstreet/pikaboard
        branch: main
        label: "Clone PikaBoard repository"
      - id: backend
        kind: script
        cwd: "pikaboard/backend"
        run: "npm install && npm run build"
        label: "Install backend dependencies"
      - id: frontend
        kind: script
        cwd: "pikaboard/frontend"
        run: "npm install && npm run build"
        label: "Build frontend"
      - id: env
        kind: prompt
        message: "Create .env with DATABASE_PATH and API_TOKEN"
        label: "Configure environment"
---

# PikaBoard

Agent-first task/kanban dashboard. **PikaBoard is the source of truth for tasks.**

## Quick Start

After install, start the server:
```bash
cd pikaboard/backend && npm start
```

Access dashboard at `http://localhost:3001`

## Configuration

Create `backend/.env`:
```env
DATABASE_PATH=./pikaboard.db
API_TOKEN=your-secret-token
PORT=3001
```

Add to your TOOLS.md:
```markdown
## PikaBoard
- **API:** http://localhost:3001/api/
- **Token:** your-secret-token
```

## Task Commands

Reference tasks by ID:
- `task 12` or `#12` → view task
- `move #12 to done` → status change
- `create task "Fix bug"` → new task

## API Reference

See `references/api.md` for full endpoint documentation.

### Common Operations

**List tasks:**
```bash
curl -H "Authorization: Bearer $TOKEN" $API/tasks
```

**Create task:**
```bash
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Fix bug","status":"inbox","priority":"high"}' \
  $API/tasks
```

**Update status:**
```bash
curl -X PATCH -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}' \
  $API/tasks/123
```

## Enums

| Field | Values |
|-------|--------|
| status | `inbox`, `up_next`, `in_progress`, `in_review`, `done` |
| priority | `low`, `medium`, `high`, `urgent` |

## Multi-Agent Setup

Each agent can have their own board. Use `board_id` parameter:
```bash
curl "$API/tasks?board_id=6" -H "Authorization: Bearer $TOKEN"
```

Board assignments:
- Board 1: Pika (main)
- Board 2: Tortoise (personal)
- Board 3: Sala (work)
- Board 4: Evoli (VirtualPyTest)
- Board 5: Psykokwak (EZPlanning)
- Board 6: Bulbi (PikaBoard)
- Board 7: Mew (Ideas)
