# ⚙️ Agent Team — Project Configuration

Edit the values below to configure the default settings for your AI dev team.

---

## 📁 Output Directory

This is where ALL generated code files will be written when you run a user story.
Set this to the absolute path of your project folder.

```
OUTPUT_DIR: /Users/dio.pratama/Documents/ForFun-Project/my-saas-app
```

> **Tip:** You can also override this per-request by adding `→ output: ./my-folder`
> to the end of your user story.

---

## 🛠️ Tech Stack Overrides

Uncomment and edit any of the following to override the defaults:

```
# FRONTEND: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
# BACKEND:  Next.js API Routes
# DATABASE: PostgreSQL with Prisma ORM
# AUTH:     NextAuth.js
# TESTING:  Vitest + Playwright
```

---

## 🌍 Project Context (Optional)

Provide any context about your project so agents can make better decisions:

```
PROJECT_NAME: My SaaS App
PROJECT_DESCRIPTION: A multi-tenant SaaS platform for project management
EXISTING_TECH: Next.js 14, PostgreSQL, Stripe
```

---

## 📋 Example Usage

```
# Default run (uses OUTPUT_DIR above):
As a user I want to register with email and password

# One-off override (ignores OUTPUT_DIR for this run):
As a user I want a dashboard page → output: /Users/dio/projects/other-app
```
