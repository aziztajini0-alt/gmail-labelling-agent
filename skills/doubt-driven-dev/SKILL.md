---
name: doubt-drive-dev
description: Développement guidé par le doute (Doubt-Driven Development). Remet en question de manière méthodique les hypothèses, l'architecture, le code et les choix techniques avant implémentation. À utiliser avant d'écrire du code ou de valider une architecture.
version: 1.0.0
---

# Doubt-Driven Development (DDD) Skill

## Overview
Apply systematic skepticism to technical decisions, architecture designs, and software requirements to prevent bugs, edge-case failures, and architectural drift before writing code.

## Core Principles
- **Question Every Assumption:** Never accept technical assumptions at face value without validating boundary conditions.
- **Analyze Failure Modes:** Actively ask "How will this break under load, network failure, or bad input?"
- **Defensive Design:** Prioritize error resilience, resource limits, and fallbacks over quick implementations.

## Socratic Audit Checklist

### 1. Explicit Assumption Extraction
- Identify all implicit assumptions (e.g., API latency, payload sizes, database locks, concurrency limits).

### 2. Failure Mode Analysis
- Evaluate behavior under:
  - High traffic / Rate limit exhaustion.
  - Partial service outages / Timeout handling.
  - Malformed or malicious payloads.
  - Data race conditions.

### 3. Risk Mitigation Plan
- Propose defensive measures (circuit breakers, fallbacks, input validation, transaction boundaries).

### 4. Final Verdict
- Authorize code implementation only when all critical risks are addressed or explicitly accepted.