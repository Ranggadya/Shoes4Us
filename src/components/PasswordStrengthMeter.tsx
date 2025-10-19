"use client";

import { useEffect, useState } from "react";
import { checkPasswordStrength, type PasswordStrength } from "@/lib/password-strength";
import { Check, X } from "lucide-react";

interface PasswordStrengthMeterProps {
  password: string;
  showRequirements?: boolean;
}

export default function PasswordStrengthMeter({
  password,
  showRequirements = true,
}: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState<PasswordStrength | null>(null);

  useEffect(() => {
    if (password) {
      const result = checkPasswordStrength(password);
      setStrength(result);
    } else {
      setStrength(null);
    }
  }, [password]);

  if (!password || !strength) {
    return null;
  }

  const requirements = [
    {
      label: "Minimal 8 karakter",
      met: password.length >= 8,
    },
    {
      label: "Huruf besar (A-Z)",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Huruf kecil (a-z)",
      met: /[a-z]/.test(password),
    },
    {
      label: "Angka (0-9)",
      met: /[0-9]/.test(password),
    },
    {
      label: "Karakter spesial (!@#$%)",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300 ease-in-out"
            style={{
              width: `${strength.percentage}%`,
              backgroundColor: strength.color,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-xs">
          <span
            className="font-medium"
            style={{ color: strength.color }}
          >
            {strength.label}
          </span>
          <span className="text-gray-500">
            {Math.round(strength.percentage)}%
          </span>
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-1">
          {requirements.map((req, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-xs"
            >
              {req.met ? (
                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
              <span
                className={
                  req.met ? "text-green-700" : "text-gray-600"
                }
              >
                {req.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Feedback Messages */}
      {strength.feedback.length > 0 && (
        <div className="text-xs text-amber-600 space-y-1">
          {strength.feedback.map((msg, index) => (
            <div key={index} className="flex items-start gap-1">
              <span>•</span>
              <span>{msg}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
