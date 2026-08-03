import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUIStore } from "../../store/useUIStore";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import {
  useOnboardingState,
  useOnboardingStepsCatalog,
  useResetOnboarding,
} from "./hooks/useOnboarding";
import { OnboardingProgressHeader } from "./components/OnboardingProgressHeader";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { ProfileStep } from "./components/ProfileStep";
import { PreferencesStep } from "./components/PreferencesStep";
import { BankAccountStep } from "./components/BankAccountStep";
import { CreditCardStep } from "./components/CreditCardStep";
import { LoanStep } from "./components/LoanStep";
import { InvestmentStep } from "./components/InvestmentStep";
import { GoalStep } from "./components/GoalStep";
import { CompletionScreen } from "./components/CompletionScreen";
import { OnboardingSkeleton } from "./components/OnboardingSkeleton";

const STEP_ORDER = [
  "WELCOME",
  "PROFILE",
  "PREFERENCES",
  "ACCOUNT",
  "CREDIT_CARD",
  "LOAN",
  "INVESTMENT",
  "GOAL",
  "COMPLETE",
];

export const OnboardingView: React.FC = () => {
  const { activeSubTab } = useUIStore();
  const { data: onboardingState, isLoading } = useOnboardingState();
  const { data: stepsCatalog } = useOnboardingStepsCatalog();
  const resetOnboarding = useResetOnboarding();

  const [activeStepKey, setActiveStepKey] = useState<string>("WELCOME");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Sync active step key from backend or activeSubTab
  useEffect(() => {
    if (activeSubTab) {
      switch (activeSubTab) {
        case "connect-accounts":
        case "add-first-transaction":
        case "import-data":
          setActiveStepKey("ACCOUNT");
          break;
        case "create-budget":
        case "add-goal":
          setActiveStepKey("GOAL");
          break;
        case "finish-setup":
          setActiveStepKey("COMPLETE");
          break;
        case "setup-checklist":
        default:
          setActiveStepKey("WELCOME");
          break;
      }
    } else if (onboardingState?.currentStepKey) {
      if (STEP_ORDER.includes(onboardingState.currentStepKey)) {
        setActiveStepKey(onboardingState.currentStepKey);
      }
    }
  }, [activeSubTab, onboardingState?.currentStepKey]);

  if (isLoading) {
    return <OnboardingSkeleton />;
  }

  const steps = stepsCatalog || [
    { key: "WELCOME", title: "Welcome", isOptional: false },
    { key: "PROFILE", title: "Profile", isOptional: false },
    { key: "PREFERENCES", title: "Preferences", isOptional: false },
    { key: "ACCOUNT", title: "Bank Account", isOptional: false },
    { key: "CREDIT_CARD", title: "Credit Card", isOptional: true },
    { key: "LOAN", title: "Loans", isOptional: true },
    { key: "INVESTMENT", title: "Investments", isOptional: true },
    { key: "GOAL", title: "Goals", isOptional: true },
    { key: "COMPLETE", title: "Complete", isOptional: false },
  ];

  const currentIndex = STEP_ORDER.indexOf(activeStepKey);
  const canGoBack = currentIndex > 0 && activeStepKey !== "COMPLETE";

  const handleNextStep = (currentKey: string) => {
    const idx = STEP_ORDER.indexOf(currentKey);
    if (idx >= 0 && idx < STEP_ORDER.length - 1) {
      setActiveStepKey(STEP_ORDER[idx + 1]);
    }
  };

  const handleBackStep = () => {
    if (currentIndex > 0) {
      setActiveStepKey(STEP_ORDER[currentIndex - 1]);
    }
  };

  const handleConfirmReset = () => {
    resetOnboarding.mutate(undefined, {
      onSuccess: () => {
        setIsResetModalOpen(false);
        setActiveStepKey("WELCOME");
      },
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2">
      {/* Header Stepper Component */}
      <OnboardingProgressHeader
        steps={steps}
        currentStepKey={activeStepKey}
        completedStepKeys={onboardingState?.completedStepKeys || []}
        skippedStepKeys={onboardingState?.skippedStepKeys || []}
        onSelectStep={(key) => setActiveStepKey(key)}
        onBack={handleBackStep}
        onReset={() => setIsResetModalOpen(true)}
        canGoBack={canGoBack}
      />

      {/* Main Active Step Renderer with framer-motion transition */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeStepKey}
          initial={{ opacity: 0, y: 10, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.99 }}
          transition={{ duration: 0.2 }}
        >
          {activeStepKey === "WELCOME" && (
            <WelcomeScreen onStart={() => setActiveStepKey("PROFILE")} />
          )}

          {activeStepKey === "PROFILE" && (
            <ProfileStep
              initialData={onboardingState?.profile}
              onSuccess={() => handleNextStep("PROFILE")}
            />
          )}

          {activeStepKey === "PREFERENCES" && (
            <PreferencesStep
              initialData={onboardingState?.preferences}
              baseCurrency={onboardingState?.profile?.baseCurrency}
              onSuccess={() => handleNextStep("PREFERENCES")}
            />
          )}

          {activeStepKey === "ACCOUNT" && (
            <BankAccountStep
              initialData={onboardingState?.account}
              baseCurrency={onboardingState?.profile?.baseCurrency}
              onSuccess={() => handleNextStep("ACCOUNT")}
            />
          )}

          {activeStepKey === "CREDIT_CARD" && (
            <CreditCardStep
              initialData={onboardingState?.creditCards?.[0]}
              baseCurrency={onboardingState?.profile?.baseCurrency}
              onSuccess={() => handleNextStep("CREDIT_CARD")}
              onSkip={() => handleNextStep("CREDIT_CARD")}
            />
          )}

          {activeStepKey === "LOAN" && (
            <LoanStep
              initialData={onboardingState?.loans?.[0]}
              baseCurrency={onboardingState?.profile?.baseCurrency}
              onSuccess={() => handleNextStep("LOAN")}
              onSkip={() => handleNextStep("LOAN")}
            />
          )}

          {activeStepKey === "INVESTMENT" && (
            <InvestmentStep
              initialData={onboardingState?.investments?.[0]}
              baseCurrency={onboardingState?.profile?.baseCurrency}
              onSuccess={() => handleNextStep("INVESTMENT")}
              onSkip={() => handleNextStep("INVESTMENT")}
            />
          )}

          {activeStepKey === "GOAL" && (
            <GoalStep
              initialData={onboardingState?.goals?.[0]}
              baseCurrency={onboardingState?.profile?.baseCurrency}
              onSuccess={() => handleNextStep("GOAL")}
              onSkip={() => handleNextStep("GOAL")}
            />
          )}

          {activeStepKey === "COMPLETE" && (
            <CompletionScreen onboardingState={onboardingState} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Styled Confirmation Modal */}
      <ConfirmModal
        isOpen={isResetModalOpen}
        title="Reset Onboarding Progress?"
        message="Are you sure you want to reset your onboarding steps? All step progress will be cleared, returning you to the welcome screen."
        confirmText="Reset Progress"
        cancelText="Keep Progress"
        variant="warning"
        isLoading={resetOnboarding.isPending}
        onConfirm={handleConfirmReset}
        onClose={() => setIsResetModalOpen(false)}
      />
    </div>
  );
};
