import { callingCodeCountries, defaultCallingCode, type CallingCodeCountry } from "./countries";

const sortedCountries = [...callingCodeCountries].sort(
  (left, right) => right.callingCode.length - left.callingCode.length
);

export function normalizePhoneNumber(callingCode: string, localNumber: string) {
  const code = callingCode.startsWith("+") ? callingCode : `+${callingCode.replace(/\D/g, "")}`;
  let digits = localNumber.trim();

  if (digits.startsWith("+")) {
    digits = digits.replace(/\D/g, "");
    const codeDigits = code.replace(/\D/g, "");
    if (digits.startsWith(codeDigits)) {
      digits = digits.slice(codeDigits.length);
    }
  } else {
    digits = digits.replace(/\D/g, "");
    const codeDigits = code.replace(/\D/g, "");
    if (digits.startsWith(`00${codeDigits}`)) {
      digits = digits.slice(codeDigits.length + 2);
    }
  }

  digits = digits.replace(/^0+/, "");

  return digits ? `${code}${digits}` : "";
}

export function normalizeInternationalPhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith("+")) {
    return `+${trimmed.replace(/\D/g, "")}`;
  }

  if (trimmed.startsWith("00")) {
    return `+${trimmed.replace(/\D/g, "").replace(/^00/, "")}`;
  }

  return normalizePhoneNumber(defaultCallingCode, trimmed);
}

export function isValidInternationalPhone(value: string) {
  return /^\+\d{6,15}$/.test(value.trim());
}

export function splitInternationalPhone(value: string): {
  country: CallingCodeCountry;
  localNumber: string;
} {
  const normalized = normalizeInternationalPhone(value);
  const country =
    sortedCountries.find((entry) => normalized.startsWith(entry.callingCode)) ??
    callingCodeCountries[0];

  const localNumber = normalized.startsWith(country.callingCode)
    ? normalized.slice(country.callingCode.length)
    : normalized.replace(/^\+/, "");

  return { country, localNumber };
}
