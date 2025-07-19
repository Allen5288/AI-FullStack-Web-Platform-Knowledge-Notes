# Basic Coding Principles and Best Practices (For Full-Stack & DevOps)

## 📌 Purpose of the Document

As a full-stack or DevOps engineer, mastering good coding habits is not just about “making code run,” but about writing **high-quality, maintainable, and scalable** code. This document aims to provide you with a set of basic coding principles, covering key dimensions such as **comment management, code structure, and design principles**, to help you gradually establish professional-level coding standards.

---

## 🧼 1. Keep Code Clean: Always Remove Useless Information Before Committing

### ✅ Prohibited Behaviors

- ❌ Leaving debugging statements like `console.log()`, `print()`, or `debugger` in PRs.
- ❌ Committing commented-out code blocks (e.g., `// const x = foo();`) to the main branch.
- ❌ Leaving obvious development notes or questions (e.g., `// TODO: fix this later`, `// WTF is this doing?`) without addressing them.

### ✅ Recommended Practices

- Use **code linting tools** (such as ESLint, Prettier, Black) to standardize formatting.
- Check changes with git diff before committing.
- Set up pre-commit hooks (e.g., Husky) to automatically detect code issues.

---

## 🧱 2. Build Clear Components and Modules

### ✅ Requirements

- Each component/module should have a **single responsibility** (Single Responsibility Principle).
- Modules should be **loosely coupled and highly cohesive**.
- Avoid redundant or duplicate code (DRY Principle: Don’t Repeat Yourself).

### Example

- UI components should remain generic, logic components should be testable.
- DevOps scripts should be modular; do not put deployment, build, and cleanup all in one `.sh` script.

---

## 🧠 3. Follow Classic Design Principles (SOLID, KISS, YAGNI)

### 🔸 SOLID Principles (Object-Oriented)

- **S**ingle Responsibility
- **O**pen-Closed (Open for extension, closed for modification)
- **L**iskov Substitution
- **I**nterface Segregation
- **D**ependency Inversion

### 🔹 KISS Principle

> Keep It Simple, Stupid
>
>
> Keep designs simple and straightforward; do not “over-engineer” or optimize prematurely.
>

### 🔹 YAGNI Principle

> You Aren’t Gonna Need It
>
>
> Don’t implement features you don’t need now; focus on current requirements.
>

---

## 🛠 4. Write Testable Code

### ✅ Requirements

- Functions should return explicit results, not modify global state.
- Use **dependency injection** where possible to improve testability.
- Keep code **pure** (Pure Functions where possible).

---

## 📦 5. Git Commit and Pull Request Standards

### Git Commit

- Use a unified format, for example:

    ```
    feat: add user login feature
    fix: fix token validation error
    refactor: refactor deployment script
    
    ```

- Each commit should be **atomic**: focus on a single feature or fix.

### Pull Request

- Each PR should contain readable and explainable changes.
- PR descriptions should include: background of the change, main logic, impact scope, and how to test.
- Do not merge PRs containing debugging information or draft code.

### 🌱 1. Git Branch Naming Convention

Use a unified naming format:

```bash
bash
<type>/<issue-number>-<feature-short-description>

```

### 🔖 Type Classification Suggestions

| Type | Description |
| --- | --- |
| `feature/` | New feature development |
| `bugfix/` | Bug fix |
| `hotfix/` | Emergency fix |
| `chore/` | Miscellaneous updates (scripts, dependencies, etc.) |
| `refactor/` | Non-functional code refactoring |
| `test/` | Add or update test code |
| `doc/` | Documentation updates |
|  |  |

### ✅ Example

```bash

feature/123-user-login
bugfix/98-email-validation
refactor/201-cleanup-auth-flow
```

📌 If you are not using an issue tracking tool, you can omit the number, but keep the description clear.

### 🔀 3. Pull Request Process and Standards

PR is a core step in collaborative development; it is not just “submitting code,” but a team consensus process for changes.

### ✅ PR Submission Requirements

- Unified title format:

```

[type] Brief description (both English and Chinese are recommended)
```

- Recommended PR description structure:

```

🧩 Feature/Issue Background
🔨 Brief Implementation Plan
🧪 How to Test (screenshots or commands)
📌 Notes / Edge Cases
```

- Tags / Reviewer should be complete (recommend using GitHub/GitLab automation rules)

### ✅ Example PR Titles

```markdown
[feat] Support user registration via email and send verification code
[fix] Fix login API not returning token correctly
```

### ❌ Prohibited Items

- Incomplete code (unfinished, in debugging state)
- Redundant files, temporary test files, uncleared console prints
- No test instructions or not self-tested

---

### ✅ 4. Recommended Pull Request Review Process (Code Review)

### 👀 Review Checklist

| Dimension | Checklist |
| --- | --- |
| Functional Correctness | Does it meet requirements? Any missing logic? |
| Code Readability | Are names clear? Is logic concise? |
| Security | Are exceptions handled? Is permission control appropriate? |
| Maintainability | Is it well encapsulated? Any duplicate code? |
| Structural Standards | Is the file structure reasonable? Is it componentized as agreed? |
| Test Coverage | Are there tests? Are edge cases considered? |

---

## 📦 Terraform Project Structure Template (Basic Version)

```
terraform/
├── main.tf               # Main resource definition entry
├── variables.tf          # Input variable definitions
├── outputs.tf            # Output variable definitions
├── terraform.tfvars      # Actual variable values
├── backend.tf            # Remote state storage configuration (e.g., S3)
├── provider.tf           # Cloud provider configuration (e.g., AWS)
├── modules/              # Custom modules (e.g., Lambda, VPC, S3)
│   └── lambda/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    └── dev/
        └── terraform.tfvars

```

**Medium-size infrastructure using Terraform**

<https://github.com/antonbabenko/terraform-best-practices/tree/master/examples/medium-terraform>

**Large-size infrastructure using Terraform**

<https://github.com/antonbabenko/terraform-best-practices/tree/master/examples/large-terraform>

[**terraform-best-practices**](https://github.com/antonbabenko/terraform-best-practices)

<https://github.com/antonbabenko/terraform-best-practices/tree/master>

<https://docs.aws.amazon.com/prescriptive-guidance/latest/terraform-aws-provider-best-practices/structure.html>

### ✅ Tips

- Each resource module (e.g., lambda, db, s3) is recommended to be encapsulated as a separate module
- Do not write all resources in a single main.tf file!

---

## ⚙️ AWS Lambda + Node.js Project Structure Template

```
lambda-app/
├── src/
│   ├── handlers/             # Lambda function entry files
│   │   └── registerUser.js
│   ├── services/             # Core business logic (e.g., database, validation)
│   │   └── userService.js
│   ├── utils/                # Common utility methods
│   └── constants/            # Constant definitions, such as error codes, config items
│
├── tests/                    # 单元测试
│   └── registerUser.test.js
│
├── terraform/                # Infrastructure deployment files (e.g., lambda definitions)
├── package.json              # Project dependencies
├── .env                      # Local environment variables (do not upload to Git)
├── .eslintrc.js              # Code style check configuration
└── README.md                 # Project documentation

```

### ✅ Tips

- Handler files only handle event reception and forwarding; business logic should be placed in the service layer
- Keep each file single-responsibility and well-structured

---

## 💻 TypeScript Project Structure Template (Suitable for API Projects or Serverless Applications)

```
ts-app/
├── src/
│   ├── handlers/             # Lambda or API entry functions
│   │   └── createUser.ts
│   ├── controllers/          # Receive requests, call services
│   │   └── userController.ts
│   ├── services/             # Core business logic
│   │   └── userService.ts
│   ├── models/               # Data models (e.g., define User type, interfaces, etc.)
│   │   └── User.ts
│   ├── utils/                # Utility functions
│   └── config/               # Config files (e.g., db connection info)
│
├── tests/                    # Jest / Vitest 测试
│   └── userService.test.ts
│
├── tsconfig.json             # TypeScript compilation config
├── .env                      # Local environment variables
├── .eslintrc.js              # Code style config
├── package.json              # Project dependencies
└── README.md

```

### ✅ Tips

- `models/` can define interface types, e.g., `interface User { ... }`
- Use `tsconfig` to configure module path aliases (e.g., `@/services`)

---
