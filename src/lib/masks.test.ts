import { describe, expect, it } from "vitest";
import {
  formatCep,
  formatCpfCnpj,
  formatPhoneBr,
  formatPhoneIntl,
  formatUf,
  toE164,
} from "@/lib/masks";

describe("masks", () => {
  it("formats brazilian phone", () => {
    expect(formatPhoneBr("11999998888")).toBe("(11) 99999-8888");
    expect(formatPhoneBr("1133334444")).toBe("(11) 3333-4444");
  });

  it("formats intl phone and e164", () => {
    expect(formatPhoneIntl("+5511999998888")).toBe("+55 11 99999-8888");
    expect(toE164("+55 11 99999-8888")).toBe("+5511999998888");
  });

  it("formats cep, tax id and uf", () => {
    expect(formatCep("01310100")).toBe("01310-100");
    expect(formatCpfCnpj("52998224725")).toBe("529.982.247-25");
    expect(formatCpfCnpj("11222333000181")).toBe("11.222.333/0001-81");
    expect(formatUf("sp1")).toBe("SP");
  });
});
