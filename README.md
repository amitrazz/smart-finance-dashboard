# Smart Finance Dashboard

A production-ready web application for managing personal finances through intuitive visualizations, budgeting tools, investment tracking, and automated expense insights. The project demonstrates modern single-page application architecture, financial data modeling, and clean component-driven UI engineering.

---

## 🌐 Live Demo

[Smart Finance Dashboard](https://cashflow.amitrazz.in/)

---

# Overview

Smart Finance Dashboard (Cashflow) provides users with a comprehensive personal wealth management experience.

The application enables users to monitor balances across multiple financial accounts, record and categorize transactions, set and track monthly budgets, monitor investment portfolios and stock holdings, track loan EMI schedules, and receive AI-driven financial insights.

---

# Key Features

## 📊 Overview Dashboard

- Total net worth & cash balance overview
- Real-time income and expense breakdowns
- Monthly cash flow charts & spending heatmaps
- Quick transaction entry & account summary widgets

## 💸 Transaction & Account Management

- Multi-account management (Bank accounts, Credit Cards, Cash)
- Expense and income categorization with bulk tag actions
- Date range filtering and full-text transaction search
- Statement file import wizard (CSV/PDF statement parsing)

## 🎯 Budgeting & Financial Goals

- Category-level monthly budget targets with real-time utilization bars
- Overspending alerts and remaining balance forecasting
- Interactive savings goals with milestone progress indicators

## 📈 Investments & Portfolio Tracking

- Portfolio asset distribution and sector allocation charts
- Trade logging (Buy/Sell) and profit/loss calculation
- Holdings table with real-time market value indicators

## 🛡️ Loans & Credit Management

- Credit card statement cycle monitoring & utilization indicators
- Loan EMI schedules and payment tracking

## 💡 AI Financial Insights & Health Score

- Dynamic financial health score algorithm
- Automated alerts for high spending categories and recurring bill reminders

---

# Tech Stack

- **Core Framework**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (Global state & auth persistence)
- **Data Fetching & Caching**: [TanStack Query v5 (React Query)](https://tanstack.com/query/latest)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Charts & Data Visualization**: [Recharts](https://recharts.org/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/)
- **Animations**: [Framer Motion](https://framer.com/motion)
- **Icons**: [Lucide React](https://lucide.dev/)

---

# Architecture

```
                             Browser UI
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
       React 19 View Layer              Zustand UI & Auth Store
     (Pages & Components)                (Global App State)
                 │                               │
                 └───────────────┬───────────────┘
                                 ▼
                     TanStack Query Data Layer
                     (Query & Mutation Hooks)
                                 │
                                 ▼
                       Service Abstraction API
                     (Mock Data & API Adapters)
```

---

# Project Structure

```
smart-finance-dashboard/
├── public/
│   ├── favicon.svg          # Custom Finance App Icon
│   └── site.webmanifest     # PWA Manifest
├── src/
│   ├── components/          # Reusable UI layout & shared components
│   ├── features/            # Domain-driven feature modules
│   │   ├── accounts/
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── budgets/
│   │   ├── goals/
│   │   ├── imports/
│   │   ├── insights/
│   │   ├── investments/
│   │   ├── loans/
│   │   └── transactions/
│   ├── hooks/               # Custom TanStack Query & state hooks
│   ├── services/            # API client and data services
│   ├── store/               # Zustand state stores
│   ├── styles/              # Global CSS & Tailwind styles
│   ├── types/               # TypeScript type definitions
│   └── main.tsx             # Application entry point
├── index.html               # Main HTML document & SEO metadata
├── package.json             # Dependencies & script configurations
├── tailwind.config.js       # Tailwind CSS configuration
└── vite.config.ts           # Vite build & plugin settings
```

---

# Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/amitrazz/smart-finance-dashboard.git
cd smart-finance-dashboard
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The application will be accessible at `http://localhost:5173`.

### 4. Build for production

```bash
npm run build
```

### 5. Lint code

```bash
npm run lint
```

---

# License

Distributed under the [MIT License](LICENSE.md).

---

# Author

**Amit Kumar**
Portfolio: [amitrazz.in](https://amitrazz.in)
GitHub: [@amitrazz](https://github.com/amitrazz)
