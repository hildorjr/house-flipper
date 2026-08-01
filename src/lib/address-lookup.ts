import { digitsOnly } from "@/lib/masks";

export type AddressCountry = "BR" | "US";

export type AddressLookupResult = {
  street: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: AddressCountry;
};

type ViaCepResponse = {
  erro?: boolean | string;
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

type ZippopotamResponse = {
  "post code"?: string;
  places?: Array<{
    "place name"?: string;
    "state abbreviation"?: string;
    state?: string;
  }>;
};

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function lookupBrazilCep(cep: string): Promise<AddressLookupResult | null> {
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!response.ok) return null;

  const data = (await response.json()) as ViaCepResponse;
  if (data.erro === true || data.erro === "true") return null;

  return {
    street: emptyToNull(data.logradouro),
    complement: emptyToNull(data.complemento),
    district: emptyToNull(data.bairro),
    city: emptyToNull(data.localidade),
    state: emptyToNull(data.uf),
    postalCode: emptyToNull(data.cep) ?? `${cep.slice(0, 5)}-${cep.slice(5)}`,
    country: "BR",
  };
}

async function lookupUsZip(zip: string): Promise<AddressLookupResult | null> {
  const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
  if (!response.ok) return null;

  const data = (await response.json()) as ZippopotamResponse;
  const place = data.places?.[0];
  if (!place) return null;

  return {
    street: null,
    complement: null,
    district: null,
    city: emptyToNull(place["place name"]),
    state: emptyToNull(place["state abbreviation"]),
    postalCode: emptyToNull(data["post code"]) ?? zip,
    country: "US",
  };
}

export function isPostalCodeComplete(country: string, postalCode: string) {
  const digits = digitsOnly(postalCode);
  if (country === "BR") return digits.length === 8;
  if (country === "US") return digits.length >= 5;
  return false;
}

export async function lookupAddress(
  country: string,
  postalCode: string,
): Promise<AddressLookupResult | null> {
  const digits = digitsOnly(postalCode);
  if (country === "BR" && digits.length === 8) {
    return lookupBrazilCep(digits);
  }
  if (country === "US" && digits.length >= 5) {
    return lookupUsZip(digits.slice(0, 5));
  }
  return null;
}
