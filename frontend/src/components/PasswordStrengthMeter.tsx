import { Check, Minus } from "lucide-react";
import { checkPasswordStrength } from "@/utils/password-strength";

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
  guidanceLabel?: string;
}

const PASSWORD_REQUIREMENTS = [
  {
    label: "8+ karakter",
    test: (value: string) => value.length >= 8,
  },
  {
    label: "Huruf besar & kecil",
    test: (value: string) => /[A-Z]/.test(value) && /[a-z]/.test(value),
  },
  {
    label: "Minimal 1 angka",
    test: (value: string) => /\d/.test(value),
  },
  {
    label: "Simbol (!@#$)",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
] as const;

const METER_SEGMENTS = [25, 50, 75, 100] as const;

function getStrengthTone(percentage: number): {
  barClass: string;
  labelClass: string;
} {
  if (percentage <= 25) {
    return { barClass: "bg-neutral-400", labelClass: "text-neutral-700" };
  }
  if (percentage <= 50) {
    return { barClass: "bg-neutral-600", labelClass: "text-neutral-800" };
  }
  if (percentage <= 75) {
    return { barClass: "bg-neutral-800", labelClass: "text-neutral-900" };
  }
  return { barClass: "bg-black", labelClass: "text-black" };
}

/** Sharp monochrome password strength meter and optional complexity checklist. */
export default function PasswordStrengthMeter({
  password,
  showRequirements = true,
  guidanceLabel = "Rekomendasi keamanan (opsional)",
}: PasswordStrengthMeterProps) {
  if (!password) {
    return null;
  }

  const strength = checkPasswordStrength(password);
  const { barClass, labelClass } = getStrengthTone(strength.percentage);

  return (
    <div
      className="mt-2.5 border border-neutral-200 bg-neutral-50 p-3 space-y-2.5"
      aria-live="polite"
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-700">
            Kekuatan Password
          </span>
          <span className={`text-xs font-bold tabular-nums ${labelClass}`}>
            {strength.label}
          </span>
        </div>

        <div
          className="grid grid-cols-4 gap-1 h-1.5 w-full"
          role="progressbar"
          aria-valuenow={strength.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Kekuatan password"
        >
          {METER_SEGMENTS.map((threshold) => (
            <div
              key={threshold}
              className={`h-full transition-colors duration-200 ${
                strength.percentage >= threshold ? barClass : "bg-neutral-200"
              }`}
            />
          ))}
        </div>
      </div>

      {showRequirements && (
        <div className="space-y-1.5 pt-0.5">
          <p className="text-[11px] font-medium text-neutral-600">
            {guidanceLabel}
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {PASSWORD_REQUIREMENTS.map((requirement) => {
              const met = requirement.test(password);
              return (
                <li
                  key={requirement.label}
                  className={`flex items-center gap-1.5 ${
                    met ? "text-neutral-950 font-semibold" : "text-neutral-600"
                  }`}
                >
                  {met ? (
                    <Check
                      className="w-3.5 h-3.5 text-black shrink-0"
                      aria-hidden="true"
                    />
                  ) : (
                    <Minus
                      className="w-3.5 h-3.5 text-neutral-500 shrink-0"
                      aria-hidden="true"
                    />
                  )}
                  <span>{requirement.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
