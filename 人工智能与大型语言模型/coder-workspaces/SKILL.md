---
name: coder-workspaces
description: Manage Coder workspaces and AI coding agent tasks via CLI. List, create, start, stop, and delete workspaces. SSH into workspaces to run commands. Create and monitor AI coding tasks with Claude Code, Aider, or other agents.
metadata:
  openclaw:
    emoji: "🏗️"
    requires:
      bins: ["coder"]
      env: ["CODER_URL", "CODER_SESSION_TOKEN"]
    install:
      - id: brew
        kind: brew
        formula: coder
        bins: ["coder"]
        label: "Install Coder CLI (brew)"
---

# Coder Workspaces

Manage Coder workspaces and AI coding agent tasks via the coder CLI.

## Setup

1. Install the CLI from your Coder instance (ensures version match):
   - See: `https://your-coder-instance.com/cli` or [Coder CLI docs](https://coder.com/docs/install/cli)

2. Set environment variables:
   ```bash
   export CODER_URL="https://your-coder-instance.com"
   export CODER_SESSION_TOKEN="your-token"  # Get from /cli-auth
   ```

3. Authenticate:
   ```bash
   coder login --token "$CODER_SESSION_TOKEN" "$CODER_URL"
   ```

4. Verify:
   ```bash
   coder whoami
   ```

## Workspace Commands

### List Workspaces

```bash
coder list
coder list --all
coder list --search "status:running"
coder list -o json
```

### Start, Stop, Restart, Delete

```bash
coder start <workspace>
coder stop <workspace>
coder restart <workspace> -y
coder delete <workspace> -y
```

### SSH and Run Commands

```bash
coder ssh <workspace>
coder ssh <workspace> -- ls -la
coder ssh <workspace> -- "cd /app && npm test"
```

### View Logs

```bash
coder logs <workspace>
coder logs <workspace> -f
```

## AI Coding Tasks

Coder Tasks runs AI agents (Claude Code, Aider, etc.) in isolated workspaces.

### Task Creation Workflow

Creating a task requires a **template** and usually a **preset**.

#### Step 1: List Available Templates

```bash
coder templates list
```

#### Step 2: Find Presets for a Template

Check available presets in your Coder web UI when creating a task, or ask your Coder admin.

#### Step 3: Create the Task

```bash
coder tasks create \
  --template <template-name> \
  --preset "<preset-name>" \
  "Your prompt describing what the agent should do"
```

### Task Commands

```bash
coder tasks list                           # List all tasks
coder tasks                                # Same as list
coder tasks logs <task-name>               # View task output
coder tasks connect <task-name>            # Interactive session
```

### Task States

- **Initializing**: Workspace provisioning (timing varies by template)
- **Working**: Setup script running
- **Active**: Agent processing your prompt
- **Idle**: Agent waiting for input

Startup time depends on the template — simple templates may take ~10-15 seconds, complex ones with setup scripts take longer.

## Troubleshooting

- **CLI not installed**: Install from your Coder instance or `brew install coder`
- **Version mismatch**: Reinstall CLI from your instance URL
- **Auth failed**: Run `coder login --token "$CODER_SESSION_TOKEN" "$CODER_URL"`

## More Info

- [Coder Docs](https://coder.com/docs)
- [Coder CLI](https://coder.com/docs/install/cli)
- [Coder Tasks](https://coder.com/docs/ai-coder)
