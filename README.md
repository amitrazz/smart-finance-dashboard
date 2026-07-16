# Smart Finance Dashboard

A production-inspired dashboard application for managing personal finances through intuitive visualizations, budgeting tools, and expense tracking. The project demonstrates modern full-stack application architecture, financial data modeling, and dashboard engineering using contemporary web technologies.

---

## 🌐 Live Demo

https://[smart-finance-dashboard.amitrazz.in](https://cashflow.amitrazz.in/)

---

# Overview

Smart Finance Dashboard demonstrates how modern financial applications can be architected using a scalable full-stack approach.

The application enables users to record income and expenses, monitor budgets, visualize spending trends, and track savings goals through an interactive dashboard. Rather than being a complete banking product, the project focuses on engineering best practices, clean architecture, reusable UI components, and production-ready application patterns.

---

# Features

## Dashboard

- Financial overview
- Current balance
- Income and expense summary
- Monthly cash flow
- Recent transactions
- Interactive charts
- Spending insights

## Transaction Management

- Add income
- Add expenses
- Edit transactions
- Delete transactions
- Category management
- Transaction history
- Date filtering
- Search transactions

## Budget Management

- Monthly budgets
- Category-based budgeting
- Budget utilization
- Overspending indicators
- Remaining budget calculations

## Savings Goals

- Create savings goals
- Progress tracking
- Goal completion status
- Contribution monitoring

## Analytics

- Monthly financial reports
- Income vs Expense analysis
- Spending by category
- Expense trends
- Budget analysis

## User Management

- Secure authentication
- Protected routes
- User dashboard
- Profile management

---

# Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Shadcn UI
- React Hook Form
- Zod
- Recharts

## Backend

- Node.js
- Next.js Server Actions
- REST API

## Database

- PostgreSQL
- Prisma ORM

## Authentication

- Clerk
- NextAuth

## Deployment

- Vercel
- Docker

---

# Architecture

```
                       Browser
                           │
                           ▼
                  Next.js Application
                           │
                  Server Actions / API
                           │
                  Authentication Layer
                           │
          ┌────────────────┼────────────────┐
          │                │                │
 Transaction Service  Budget Service  Analytics Service
          │                │                │
          └────────────────┼────────────────┘
                           │
                      Prisma ORM
                           │
                           ▼
                     PostgreSQL
```

The application follows a layered architecture where presentation, business logic, and persistence remain decoupled.

Financial transactions are normalized within PostgreSQL, while analytics are generated dynamically from transactional data.

Authentication protects user-specific financial information, and the frontend leverages Server Components and optimized rendering for improved performance.

---

# Data Flow

```
User Creates Transaction
         │
         ▼
Form Validation
         │
         ▼
Server Action / API
         │
         ▼
Business Logic
         │
         ▼
Database Transaction
         │
         ▼
Analytics Update
         │
         ▼
Dashboard Refresh
```

---

# Engineering Decisions

## Why Next.js?

Next.js provides an integrated framework for server-side rendering, routing, Server Actions, and API development while maintaining excellent developer experience.

---

## Why PostgreSQL?

Financial data requires strong consistency, relational integrity, and transactional guarantees. PostgreSQL provides ACID compliance, making it an ideal choice for financial record management.

---

## Why Prisma?

Prisma offers a type-safe ORM that improves developer productivity while reducing runtime database errors and simplifying schema evolution.

---

## Why Server Actions?

Server Actions reduce API boilerplate while enabling secure server-side execution and simplified data mutations within the App Router architecture.

---

## Why Separate Services?

Organizing business logic into independent services improves maintainability, testing, and future scalability as additional financial modules are introduced.

---

# Project Structure

```
src/
├── app/
├── components/
├── features/
├── hooks/
├── services/
├── lib/
├── prisma/
├── types/
├── utils/
└── styles/
```

---

# Performance Optimizations

Current optimizations include:

- Server Components
- Lazy loading
- Dynamic imports
- Optimized rendering
- Component memoization
- Efficient database queries
- Type-safe APIs
- Responsive dashboard rendering

Planned improvements:

- Redis caching
- Materialized views
- Background analytics generation
- Edge caching
- Incremental data aggregation
- Scheduled financial reports

---

# Scalability

The current architecture is designed as a monolithic full-stack application suitable for small-to-medium workloads.

Future improvements include:

- Microservice architecture
- Event-driven transaction processing
- CQRS for analytics
- Redis caching
- Message queues
- Background workers
- Horizontal API scaling
- Read replicas
- Distributed analytics pipeline

---

# Security

The application incorporates several security best practices:

- Secure authentication
- Protected routes
- Server-side authorization
- Input validation
- Type-safe database access
- CSRF protection
- Environment variable isolation
- Secure session management

---

# Roadmap

## Phase 1

- ✅ Dashboard
- ✅ Authentication
- ✅ Transaction Management
- ✅ Budget Tracking
- ✅ Savings Goals

## Phase 2

- Recurring transactions
- Bill reminders
- Export reports
- CSV import
- Dark mode

## Phase 3

- AI financial insights
- Investment tracking
- OCR receipt scanning
- Multi-currency support
- Notifications

## Phase 4

- Bank API integration
- Financial forecasting
- Shared family accounts
- Mobile application
- Offline support

---

# Local Development

Clone the repository:

```bash
git clone https://github.com/amitrazz/smart-finance-dashboard.git
```

Install dependencies:

```bash
npm install
```

Configure environment variables:

```bash
cp .env.example .env
```

Run database migrations:

```bash
npx prisma migrate dev
```

Start the development server:

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

# Contributing

Contributions, issues, and feature requests are welcome.

Please open an issue before submitting significant changes.

---

# License

MIT License

---

# Author

**Amit Raj**

Principal Software Engineer

Portfolio: https://amitrazz.in

GitHub: https://github.com/amitrazz

LinkedIn: https://linkedin.com/in/amitrazz
