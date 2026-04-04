---
name: symbolic-memory
description: Stateless symbolic memory effect for LLM agents using SQL facts + canonical semantics, activated via symbols and JIT meaning (PostgreSQL + Ollama).
metadata: {"openclaw":{"emoji":"🧠","homepage":"https://github.com/Th3Hypn0tist/random/blob/main/LLM-symbolic-memory.md","requires":{"bins":["psql","python3"],"env":["PG_DSN","OLLAMA_HOST","OLLAMA_MODEL"],"config":[]}}}
user-invocable: true
version: 1.0
---

# symbolic-memory

## Purpose

Provide a stateless symbolic memory workflow:
- Store facts + canonical semantics in PostgreSQL
- Expose references as symbols
- Activate meaning just-in-time (budgeted)
- Send only activated facts to the LLM (Ollama)

Rule:
Store semantics. Compute meaning. Never confuse the two.
