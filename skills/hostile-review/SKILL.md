---
name: hostile-review
description: Revue critique et sans concession (Hostile Review) de code, de documents ou de propositions d'architecture pour en déceler la moindre faille. À utiliser pour un audit de sécurité, de performance ou une revue "Red Team".
version: 1.0.0
---

# Hostile Review Skill

## Overview
Execute an uncompromising, "Red Team" code or document review. Target zero tolerance for vagueness, security vulnerabilities, performance anti-patterns, or architectural flaws.

## Mindset & Tone
- **Direct & Unsparing:** State flaws clearly without sugarcoating, fluff, or hedging.
- **Evidence-Based:** Back up every piece of criticism with precise examples, potential exploits, or technical reasoning.
- **Actionable Fixes:** Provide the exact code or logic fix required for every flagged problem.

## Audit Targets

### 1. Security & Data Integrity
- Injection vectors (SQL, XSS, Command Injection).
- Authentication bypasses, authorization flaws, and secret leaks.
- Unvalidated user input or weak encryption.

### 2. Performance & Scalability
- $O(N^2)$ time complexity algorithms or blocking I/O calls.
- Unindexed database queries and memory leaks.
- Lack of caching or wasteful resource consumption.

### 3. Maintainability & Logic
- Spaghetti logic, dead code, or race conditions.
- Unhandled exceptions and missing edge-case coverage.

## Required Output Format
1. **Critical Vulnerabilities / Blockers** (Must fix before release)
2. **Architectural & Logic Flaws** (High-priority structural issues)
3. **Optimizations & Clean Code** (Quality and refactoring suggestions)