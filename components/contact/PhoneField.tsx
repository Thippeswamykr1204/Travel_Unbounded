import { type UseFormRegister, type FieldErrors } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { EnquiryFormValues } from "@/lib/validations";

const COUNTRY_CODES = [
  { code: "+91", label: "India (+91)" },
  { code: "+1", label: "United States (+1)" },
  { code: "+44", label: "United Kingdom (+44)" },
  { code: "+971", label: "UAE (+971)" },
  { code: "+254", label: "Kenya (+254)" },
  { code: "+61", label: "Australia (+61)" },
];

const fieldStyles =
  "w-full rounded-md border border-ink/15 bg-paper px-4 py-3 font-sans text-sm text-ink placeholder:text-ink/40 focus:border-terra focus:outline-none";

type PhoneFieldProps = {
  register: UseFormRegister<EnquiryFormValues>;
  errors: FieldErrors<EnquiryFormValues>;
};

export default function PhoneField({ register, errors }: PhoneFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="contactNumber"
        className="font-sans text-sm font-medium text-ink"
      >
        Contact Number
      </label>
      <div className="flex gap-3">
        <select
          id="countryCode"
          aria-label="Country code"
          className={cn(fieldStyles, "w-32 flex-none")}
          defaultValue=""
          {...register("countryCode")}
        >
          <option value="" disabled>
            Code
          </option>
          {COUNTRY_CODES.map(({ code, label }) => (
            <option key={code} value={code}>
              {label}
            </option>
          ))}
        </select>
        <input
          id="contactNumber"
          type="tel"
          inputMode="numeric"
          placeholder="9876543210"
          className={cn(fieldStyles, "flex-1")}
          {...register("contactNumber")}
        />
      </div>
      {(errors.countryCode || errors.contactNumber) && (
        <p className="font-sans text-xs text-terra">
          {errors.countryCode?.message || errors.contactNumber?.message}
        </p>
      )}
    </div>
  );
}