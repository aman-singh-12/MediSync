# MediSync Engineering Git Workflow & Branching Strategy

This document outlines the professional Git workflow, branching conventions, commit standards, and pull request procedures enforced on the MediSync healthcare engineering platform.

---

## 1. Branching Strategy (GitFlow + Feature Branch Model)

We employ a structured **Feature-Branch Workflow** anchored by long-lived branches and task-specific short-lived branches.

```
       (feature/structured-outputs-ai)  o---o---o
                                       /         \  (PR #14)
(main) -------------------------------o-----------o----------------- (v1.2.0 Release)
                                       \         /  (PR #15)
       (feature/closures-architecture)  o---o---o
```

### 1.1 Long-Lived Branches
- **`main`**: Production-ready branch. Every commit on `main` is deployable to production and represents a tagged release.
- **`develop`**: Integration branch for ongoing feature convergence and staging automated test runs.

### 1.2 Short-Lived Supporting Branches
- **`feature/<feature-name>`**: Created off `develop` (or `main`) for developing new features.
  - *Examples*: `feature/structured-outputs-ai`, `feature/closures-architecture`, `feature/socket-realtime-notifications`
- **`bugfix/<issue-description>`**: Created to fix bugs identified in development or QA.
  - *Examples*: `bugfix/rate-limiter-tuning`, `bugfix/appointment-slot-overlap`
- **`hotfix/<critical-patch>`**: Created directly off `main` to address critical production issues, merged back to both `main` and `develop`.
- **`release/v<version>`**: Preparation branch for release testing and metadata finalization.

---

## 2. Commit Message Standards (Conventional Commits)

All commits must follow the **Conventional Commits v1.0.0** specification:

```
<type>(<scope>): <short imperative description>

[optional body explaining rationale and context]

[optional footer(s) like Closes #123]
```

### Allowed Types:
| Type | Purpose | Example |
| :--- | :--- | :--- |
| `feat` | A new user-facing or architectural feature | `feat(ai): implement Zod structured outputs for clinical triage` |
| `fix` | A bug fix | `fix(auth): resolve token refresh race condition on logout` |
| `refactor` | Code change that neither fixes a bug nor adds a feature | `refactor(system): encapsulate clinical calculations inside closures` |
| `test` | Adding or correcting unit/integration tests | `test(rubric): add comprehensive suite for Event Loop and Closures` |
| `docs` | Documentation only changes | `docs(git): add complete branching workflow guide` |
| `perf` | A code change that improves performance | `perf(sql): optimize inner joins indexing on doctor department ID` |
| `chore` | Build process or tooling changes | `chore(deps): update langchain dependencies` |

---

## 3. Pull Request (PR) & Code Review Lifecycle

### Step 1: Branch Creation
```bash
git checkout -b feature/clinical-triage-ai
```

### Step 2: Atomic Commits
Developers make focused, granular commits:
```bash
git commit -m "feat(ai): define Zod schema for clinical triage"
git commit -m "feat(ai): integrate StructuredOutputParser with fallback handler"
git commit -m "test(ai): add unit tests for structured output validation"
```

### Step 3: Pull Request Creation
Push branch to origin and open a Pull Request targeting `develop` (or `main`):
```bash
git push -u origin feature/clinical-triage-ai
```

### Step 4: Quality Gates & Merge Strategy
Before a PR can be merged into `main`:
1. **Automated CI Checks**: Jest test suite must pass (`npm test` exits code 0).
2. **Lint & Security Verification**: Zero unhandled exceptions or injection vulnerabilities.
3. **Merge Method**: **Merge Commit** (preserving complete branch history and context) or **Squash & Merge** (for small linear changes).

---

## 4. Git Command Cheat Sheet for MediSync Contributors

```bash
# 1. Update local repository
git checkout main
git pull origin main

# 2. Create feature branch
git checkout -b feature/my-new-feature

# 3. Work and stage changes
git add .
git commit -m "feat(module): descriptive action"

# 4. Rebase against latest main to avoid merge conflicts
git fetch origin
git rebase origin/main

# 5. Merge feature branch via explicit merge commit
git checkout main
git merge --no-ff feature/my-new-feature -m "Merge pull request #14 from feature/my-new-feature"

# 6. View clean topological history graph
git log --graph --oneline --all
```
