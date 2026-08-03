import React from "react";
import { AddCreditCardWizard } from "./AddCreditCardWizard";

interface AddCreditCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddCreditCardModal: React.FC<AddCreditCardModalProps> = ({ isOpen, onClose }) => {
  return <AddCreditCardWizard isOpen={isOpen} onClose={onClose} />;
};
