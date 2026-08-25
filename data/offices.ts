export interface Office {
  city: string;
  address: string;
  note: string;
}

export const OFFICES: Office[] = [
  {
    city: "Bengaluru HQ",
    address:
      "541, 7th Main Rd, HAL 2nd Stage, Indiranagar, Bengaluru – 560008, India",
    note: "Where every trip starts on a whiteboard.",
  },
  {
    city: "Kochi",
    address: "LR Towers, S Janatha Road, Palavivatton, Kochi – 682025, India",
    note: "Closest to the backwaters we send you to.",
  },
  {
    city: "Nairobi",
    address:
      "Westpark Towers, Muthithi Road, P.O. Box 6950, Postal Code 00100, Nairobi, Kenya",
    note: "Ten minutes from where most of our Kenya routes begin.",
  },
];