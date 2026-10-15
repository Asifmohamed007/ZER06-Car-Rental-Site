import { randomInt } from "crypto";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I/L

export function generateReference(): string {
  let s = "";
  for (let i = 0; i < 7; i++) s += ALPHABET[randomInt(ALPHABET.length)];
  return `Z6-${s}`;
}
