import React, { useState } from "react";
import { Building2 } from "lucide-react";
import { useInstitutions } from "../../hooks/useFinanceQueries";
import { FinancialInstitution } from "../../types";
import { AsyncSearchSelect } from "./AsyncSearchSelect";

interface InstitutionPickerProps {
  value?: string;
  valueLabel?: string;
  onChange: (institutionId: string | undefined, institution?: FinancialInstitution) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Searchable institution combobox backed by GET /finance/institutions?search=&limit=100
 * (useInstitutions). Used everywhere an institution/lender/issuer needs to be
 * selected — account, credit card, and loan create/edit forms — instead of a
 * plain <select> (which silently truncates once there are more institutions
 * than fit inline) or a hardcoded quick-pick list.
 */
export const InstitutionPicker: React.FC<InstitutionPickerProps> = ({
  value,
  valueLabel,
  onChange,
  placeholder = "Search banks, brokers, institutions…",
  disabled,
  id,
}) => {
  const [search, setSearch] = useState("");
  const { data: institutions = [], isFetching } = useInstitutions({
    search: search || undefined,
    limit: 100,
  });

  return (
    <AsyncSearchSelect<FinancialInstitution>
      id={id}
      value={value}
      valueLabel={valueLabel}
      placeholder={placeholder}
      disabled={disabled}
      icon={<Building2 className="w-4 h-4 text-slate-500 shrink-0" />}
      items={institutions}
      isFetching={isFetching}
      onSearch={setSearch}
      onSelect={(inst) => onChange(inst.id, inst)}
      onClear={() => onChange(undefined, undefined)}
      getOptionKey={(inst) => inst.id}
      emptyMessage="No matching institutions"
      renderOption={(inst) => (
        <>
          {inst.logoUrl ? (
            <img src={inst.logoUrl} alt="" className="w-5 h-5 rounded object-contain shrink-0" />
          ) : (
            <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
          )}
          <span className="truncate">{inst.name}</span>
        </>
      )}
    />
  );
};

export default InstitutionPicker;
