# Contributing to TravelMission AI

First off, thank you for considering contributing to TravelMission AI! We welcome contributions that improve multi-agent coordination, database structures, or UI components.

---

## 📖 Code of Conduct
By participating in this project, you agree to abide by our code of conduct, which aims to keep this workspace welcoming, safe, and respectful for all.

---

## 🛠️ How to Contribute

### 1. Report Bugs
* First, check the existing issues.
* If the bug is new, open an issue explaining the steps to reproduce, actual and expected behavior, and error trace logs.

### 2. Suggest Enhancements
* Describe the feature in detail.
* Explain why this is useful to the broader TravelMission AI community.

### 3. Code Submissions
1. **Fork the Repository** and clone your fork locally.
2. **Create a Feature Branch**:
   ```bash
   git checkout -b feature/your-awesome-feature
   ```
3. **Set Up Development Environment**:
   - Backend requires `uv` and Google's `agents-cli`.
   - Frontend requires Node.js v18+.
4. **Develop and Format**:
   - Backend linting must pass `agents-cli lint` (which runs `ruff check`, `ruff format --check`, `codespell`, and `ty check`).
   - Run tests to verify logic.
5. **Commit Changes**:
   Write clean, imperative commit messages:
   ```bash
   git commit -m "Add coordinate mapping tool to Maps Agent"
   ```
6. **Push and Open a Pull Request** to the `master` branch.

---

## 🐍 Backend Code Guidelines
* **Type Safety**: Use explicit typing unions and avoid bare `except:` statements. Ensure all models map precisely to SQLite and PostgreSQL structures.
* **Agent Context Limits**: Avoid polluting LLM prompts; keep specialists focused on single tasks and query details through MCP tools.
