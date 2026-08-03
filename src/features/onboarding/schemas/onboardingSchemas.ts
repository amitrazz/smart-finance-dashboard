import { z } from "zod";

export const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters"),
  country: z.string().min(2, "Please select a valid country"),
  timezone: z.string().min(1, "Please select a timezone"),
  locale: z.string().min(1),
  baseCurrency: z.string().min(3, "Please select a base currency"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const preferencesSchema = z.object({
  fiscalYearStartMonth: z.number().min(1).max(12),
  primaryIncomeSourceName: z.string().min(1, "Please specify an income source"),
  payFrequency: z.enum(["MONTHLY", "WEEKLY", "BI_WEEKLY", "CUSTOM"]),
  payDay: z.number().min(1).max(31),
  monthlyAmount: z.string().min(1, "Please specify an income amount"),
  currency: z.string().min(3),
});

export type PreferencesFormValues = z.infer<typeof preferencesSchema>;

export const accountSchema = z.object({
  name: z.string().min(2, "Account name must be at least 2 characters"),
  type: z.enum(["SAVINGS", "CURRENT", "CASH", "WALLET", "CHECKING"]),
  currency: z.string().min(3),
  openingBalance: z.string().min(1, "Please specify opening balance"),
  institutionId: z.string().optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;

export const creditCardSchema = z.object({
  name: z.string().min(2, "Card name must be at least 2 characters"),
  currency: z.string().min(3),
  creditLimit: z.string().min(1, "Please specify a credit limit"),
  currentBalance: z.string().min(1, "Please specify current balance"),
  statementDay: z.number().min(1).max(31),
  dueDay: z.number().min(1).max(31),
  institutionId: z.string().optional(),
});

export type CreditCardFormValues = z.infer<typeof creditCardSchema>;

export const loanSchema = z.object({
  name: z.string().min(2, "Loan name must be at least 2 characters"),
  type: z.enum(["HOME", "VEHICLE", "EDUCATION", "PERSONAL", "GOLD", "OTHER"]),
  currency: z.string().min(3),
  principalAmount: z.string().min(1, "Please specify loan principal amount"),
  interestRate: z.string().min(1, "Please specify annual interest rate"),
  tenureMonths: z.number().min(1, "Tenure must be at least 1 month"),
  startDate: z.string().min(1, "Please select start date"),
});

export type LoanFormValues = z.infer<typeof loanSchema>;

export const investmentSchema = z.object({
  symbol: z.string().optional(),
  securityName: z.string().min(2, "Investment name must be at least 2 characters"),
  assetClass: z.enum(["MUTUAL_FUND", "STOCK", "ETF", "PPF", "NPS", "EPF", "FD", "GOLD", "CRYPTO"]),
  currency: z.string().min(3),
  units: z.string().optional(),
  costBasis: z.string().min(1, "Please specify cost basis"),
  currentValue: z.string().min(1, "Please specify current estimated value"),
  purchaseDate: z.string().optional(),
});

export type InvestmentFormValues = z.infer<typeof investmentSchema>;

export const goalSchema = z.object({
  name: z.string().min(2, "Goal name must be at least 2 characters"),
  type: z.enum(["EMERGENCY_FUND", "VACATION", "HOUSE", "RETIREMENT", "EDUCATION", "CAR", "CUSTOM"]),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
  targetAmount: z.string().min(1, "Please specify target amount"),
  currency: z.string().min(3),
  targetDate: z.string().min(1, "Please select target completion date"),
});

export type GoalFormValues = z.infer<typeof goalSchema>;
