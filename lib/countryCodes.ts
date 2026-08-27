export type CountryCode = {
  name: string;
  iso2: string; // ISO 3166-1 alpha-2, used to derive the flag emoji
  dialCode: string; // e.g. "+91"
};

// Flag emojis are derived at render time from iso2 (see countryFlagEmoji),
// so this list only needs to carry name + dial code + iso2.
export const COUNTRY_CODES: CountryCode[] = [
  { name: "India", iso2: "IN", dialCode: "+91" },
  { name: "United States", iso2: "US", dialCode: "+1" },
  { name: "United Kingdom", iso2: "GB", dialCode: "+44" },
  { name: "United Arab Emirates", iso2: "AE", dialCode: "+971" },
  { name: "Kenya", iso2: "KE", dialCode: "+254" },
  { name: "Australia", iso2: "AU", dialCode: "+61" },
  { name: "Canada", iso2: "CA", dialCode: "+1" },
  { name: "Singapore", iso2: "SG", dialCode: "+65" },
  { name: "Germany", iso2: "DE", dialCode: "+49" },
  { name: "France", iso2: "FR", dialCode: "+33" },
  { name: "Nepal", iso2: "NP", dialCode: "+977" },
  { name: "Sri Lanka", iso2: "LK", dialCode: "+94" },
  { name: "Bangladesh", iso2: "BD", dialCode: "+880" },
  { name: "Saudi Arabia", iso2: "SA", dialCode: "+966" },
  { name: "Qatar", iso2: "QA", dialCode: "+974" },
  { name: "Oman", iso2: "OM", dialCode: "+968" },
  { name: "Malaysia", iso2: "MY", dialCode: "+60" },
  { name: "Thailand", iso2: "TH", dialCode: "+66" },
  { name: "Indonesia", iso2: "ID", dialCode: "+62" },
  { name: "Japan", iso2: "JP", dialCode: "+81" },
  { name: "South Korea", iso2: "KR", dialCode: "+82" },
  { name: "China", iso2: "CN", dialCode: "+86" },
  { name: "South Africa", iso2: "ZA", dialCode: "+27" },
  { name: "New Zealand", iso2: "NZ", dialCode: "+64" },
  { name: "Netherlands", iso2: "NL", dialCode: "+31" },
  { name: "Spain", iso2: "ES", dialCode: "+34" },
  { name: "Italy", iso2: "IT", dialCode: "+39" },
  { name: "Switzerland", iso2: "CH", dialCode: "+41" },
  { name: "Ireland", iso2: "IE", dialCode: "+353" },
  { name: "Brazil", iso2: "BR", dialCode: "+55" },
];

/**
 * Flag icon URL (flagcdn.com) for an ISO 3166-1 alpha-2 code, e.g. "IN".
 * Used instead of flag emoji so flags render identically across OS/browsers
 * (emoji flags are inconsistent on Windows and some Android builds).
 */
export function countryFlagUrl(iso2: string, width: 20 | 24 | 40 = 24): string {
  return `https://flagcdn.com/w${width}/${iso2.toLowerCase()}.png`;
}