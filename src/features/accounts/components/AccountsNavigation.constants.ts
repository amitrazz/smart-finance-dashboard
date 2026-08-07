import { ActiveRoute, PrimarySection } from "./AccountsNavigation";

export const ROUTE_TO_SECTION: Record<ActiveRoute, PrimarySection> = {
  overview: "overview",
  bank: "accounts",
  wallets: "accounts",
  "cash-accounts": "accounts",
  "credit-cards": "accounts",
  "fixed-deposits": "accounts",
  "investments-cash": "accounts",
  "cash-position": "cash",
  transfers: "operations",
  reconciliation: "operations",
  institutions: "operations",
  "statements-overview": "statements",
  "statements-bank": "statements",
  "statements-card": "statements",
  "statements-imports": "statements",
  "statements-history": "statements",
  details: "accounts",
};
