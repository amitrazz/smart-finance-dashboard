import React from "react";
import { CreateLoanWizardModal } from "./CreateLoanWizardModal";

interface AddLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = (props) => {
  return <CreateLoanWizardModal {...props} />;
};
