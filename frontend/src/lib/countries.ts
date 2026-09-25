export interface Country {
  /** ISO 3166-1 alpha-2 code. */
  iso: string;
  name: string;
  /** International dialling prefix without the "+". */
  dial: string;
}

/** Common countries for the phone picker (flag emoji are not rendered on Windows, so ISO is shown). */
export const COUNTRIES: Country[] = [
  { iso: "US", name: "United States", dial: "1" },
  { iso: "CA", name: "Canada", dial: "1" },
  { iso: "GB", name: "United Kingdom", dial: "44" },
  { iso: "IN", name: "India", dial: "91" },
  { iso: "AU", name: "Australia", dial: "61" },
  { iso: "NZ", name: "New Zealand", dial: "64" },
  { iso: "IE", name: "Ireland", dial: "353" },
  { iso: "DE", name: "Germany", dial: "49" },
  { iso: "FR", name: "France", dial: "33" },
  { iso: "ES", name: "Spain", dial: "34" },
  { iso: "IT", name: "Italy", dial: "39" },
  { iso: "NL", name: "Netherlands", dial: "31" },
  { iso: "SE", name: "Sweden", dial: "46" },
  { iso: "NO", name: "Norway", dial: "47" },
  { iso: "CH", name: "Switzerland", dial: "41" },
  { iso: "PL", name: "Poland", dial: "48" },
  { iso: "RU", name: "Russia", dial: "7" },
  { iso: "TR", name: "Türkiye", dial: "90" },
  { iso: "AE", name: "United Arab Emirates", dial: "971" },
  { iso: "SA", name: "Saudi Arabia", dial: "966" },
  { iso: "EG", name: "Egypt", dial: "20" },
  { iso: "NG", name: "Nigeria", dial: "234" },
  { iso: "KE", name: "Kenya", dial: "254" },
  { iso: "ZA", name: "South Africa", dial: "27" },
  { iso: "PK", name: "Pakistan", dial: "92" },
  { iso: "BD", name: "Bangladesh", dial: "880" },
  { iso: "LK", name: "Sri Lanka", dial: "94" },
  { iso: "NP", name: "Nepal", dial: "977" },
  { iso: "CN", name: "China", dial: "86" },
  { iso: "JP", name: "Japan", dial: "81" },
  { iso: "KR", name: "South Korea", dial: "82" },
  { iso: "SG", name: "Singapore", dial: "65" },
  { iso: "MY", name: "Malaysia", dial: "60" },
  { iso: "TH", name: "Thailand", dial: "66" },
  { iso: "VN", name: "Vietnam", dial: "84" },
  { iso: "ID", name: "Indonesia", dial: "62" },
  { iso: "PH", name: "Philippines", dial: "63" },
  { iso: "BR", name: "Brazil", dial: "55" },
  { iso: "MX", name: "Mexico", dial: "52" },
  { iso: "AR", name: "Argentina", dial: "54" },
  { iso: "CO", name: "Colombia", dial: "57" },
  { iso: "CL", name: "Chile", dial: "56" },
];

export const DEFAULT_COUNTRY = COUNTRIES.find((c) => c.iso === "IN") ?? COUNTRIES[0];

const MIN_TOTAL_DIGITS = 7;
const MAX_TOTAL_DIGITS = 15; // E.164

/** "+91" + "098765 43210" -> "+919876543210" (strips formatting and the national trunk zero). */
export function toE164(country: Country, national: string): string {
  const digits = national.replace(/\D/g, "").replace(/^0+/, "");
  return `+${country.dial}${digits}`;
}

export function isValidNumber(country: Country, national: string): boolean {
  const total = toE164(country, national).length - 1; // minus "+"
  return total >= MIN_TOTAL_DIGITS && total <= MAX_TOTAL_DIGITS;
}
