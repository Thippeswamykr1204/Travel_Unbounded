import { Controller, type Control, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { cn } from "@/lib/utils";
import type { EnquiryFormValues } from "@/lib/validations";
import CountryCodeSelect from "@/components/contact/CountryCodeSelect";

const fieldStyles =
  "w-full appearance-none rounded-md border border-ink/15 bg-paper px-4 py-3 font-sans text-sm text-ink placeholder:text-ink/40 outline-none focus-visible:outline-none focus:border-2 focus:border-terra focus:px-[15px] focus:py-[11px] hover:border-ink/15";

type PhoneFieldProps = {
  register: UseFormRegister<EnquiryFormValues>;
  control: Control<EnquiryFormValues>;
  errors: FieldErrors<EnquiryFormValues>;
};

export default function PhoneField({ register, control, errors }: PhoneFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor="contactNumber"
        className="font-sans text-sm font-medium text-ink"
      >
        Contact Number
      </label>
      <div className="flex gap-3">
        <Controller
          name="countryCode"
          control={control}
          render={({ field }) => (
            <CountryCodeSelect
              id="countryCode"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              hasError={!!errors.countryCode}
            />
          )}
        />
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