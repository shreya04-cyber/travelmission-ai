# Security Policy

This document outlines the security policies, disclosure process, and mitigation practices for TravelMission AI.

---

## 🔒 Reporting a Vulnerability

If you discover a security vulnerability in this project (such as a database leak, remote code execution vector, or prompt injection bypass), **do not report it publicly via GitHub issues**. 

Instead, please send a detailed report to the maintainer's security contact. Include:
* A description of the vulnerability.
* Detailed steps or scripts to reproduce (Proof of Concept).
* Potential impacts.

We aim to reply within 48 hours and resolve any verified critical exploits within 14 days.

---

## 🚫 Prompt Injection Mitigation

TravelMission AI implements active input sanitizers to protect the Gemini agent orchestration framework from prompt injection:
* All text inputs parsed by backend routers are vetted by a signature-checking utility.
* Inputs containing directive overrides (e.g. `ignore previous instructions`, `system override`) are immediately rejected with a `400 Bad Request` status code.
* Specialist agents utilize strict JSON schema validation when returning tool calls, preventing malicious command execution.

---

## 🔑 Credential Safety

* **Never commit API Keys**: All credentials (such as `GEMINI_API_KEY`) must be stored in local `.env` files (which are ignored by version control).
* **Sandboxed MCP Filesystem**: The Filesystem MCP server is strictly sandboxed to the `/uploads` subfolder. It is forbidden from traversing system directories or reading host operating system configurations.
