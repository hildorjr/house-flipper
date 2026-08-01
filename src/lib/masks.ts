export type InputMask = "phone" | "phoneIntl" | "cep" | "zip" | "cpfCnpj" | "uf";

export function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCep(value: string) {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatZip(value: string) {
  const digits = digitsOnly(value).slice(0, 9);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function formatPhoneBr(value: string) {
  const digits = digitsOnly(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatPhoneIntl(value: string) {
  const hasPlus = value.trim().startsWith("+");
  const digits = digitsOnly(value).slice(0, 15);
  if (!digits) return hasPlus ? "+" : "";

  if (digits.startsWith("55")) {
    const national = digits.slice(2);
    const area = national.slice(0, 2);
    const number = national.slice(2);
    let result = "+55";
    if (area) result += ` ${area}`;
    if (!number) return result;
    if (number.length <= 4) return `${result} ${number}`;
    if (number.length <= 8) {
      return `${result} ${number.slice(0, 4)}-${number.slice(4)}`;
    }
    return `${result} ${number.slice(0, 5)}-${number.slice(5, 9)}`;
  }

  return `+${digits}`;
}

export function formatCpfCnpj(value: string) {
  const digits = digitsOnly(value).slice(0, 14);
  if (digits.length <= 11) {
    const part = digits;
    if (part.length <= 3) return part;
    if (part.length <= 6) return `${part.slice(0, 3)}.${part.slice(3)}`;
    if (part.length <= 9) {
      return `${part.slice(0, 3)}.${part.slice(3, 6)}.${part.slice(6)}`;
    }
    return `${part.slice(0, 3)}.${part.slice(3, 6)}.${part.slice(6, 9)}-${part.slice(9)}`;
  }

  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  }
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function formatUf(value: string) {
  return value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
}

export function applyMask(mask: InputMask, value: string) {
  switch (mask) {
    case "phone":
      return formatPhoneBr(value);
    case "phoneIntl":
      return formatPhoneIntl(value);
    case "cep":
      return formatCep(value);
    case "zip":
      return formatZip(value);
    case "cpfCnpj":
      return formatCpfCnpj(value);
    case "uf":
      return formatUf(value);
  }
}

export function toE164(value: string) {
  const digits = digitsOnly(value);
  return digits ? `+${digits}` : "";
}
