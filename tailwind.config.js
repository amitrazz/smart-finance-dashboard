/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "nav-tab": {
          "l1-bg":     "var(--nav-tab-l1-bg)",
          "l1-fg":     "var(--nav-tab-l1-fg)",
          "l1-shadow": "var(--nav-tab-l1-shadow)",
          "l2-bg":     "var(--nav-tab-l2-bg)",
          "l2-fg":     "var(--nav-tab-l2-fg)",
          "l2-border": "var(--nav-tab-l2-border)",
        },
        action: {
          primary: "var(--action-primary-bg)",
          "primary-hover": "var(--action-primary-hover)",
          success: "var(--action-success-bg)",
          "success-hover": "var(--action-success-hover)",
          warning: "var(--action-warning-bg)",
          "warning-hover": "var(--action-warning-hover)",
          danger: "var(--action-danger-bg)",
          "danger-hover": "var(--action-danger-hover)",
          neutral: "var(--action-neutral-bg)",
          "neutral-hover": "var(--action-neutral-hover)",
          info: "var(--action-info-bg)",
          "info-hover": "var(--action-info-hover)",
        },
        finance: {
          income: "var(--finance-income)",
          expense: "var(--finance-expense)",
          transfer: "var(--finance-transfer)",
          investment: "var(--finance-investment)",
          loan: "var(--finance-loan)",
          credit: "var(--finance-credit)",
          goal: "var(--finance-goal)",
          savings: "var(--finance-savings)",
          cash: "var(--finance-cash)",
          unknown: "var(--finance-unknown)",
        },
        status: {
          draft: "var(--status-draft)",
          processing: "var(--status-processing)",
          pending: "var(--status-pending)",
          completed: "var(--status-completed)",
          failed: "var(--status-failed)",
          "partially-complete": "var(--status-partially-complete)",
          cancelled: "var(--status-cancelled)",
          syncing: "var(--status-syncing)",
        },
      },
      transitionTimingFunction: {
        bounce: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
