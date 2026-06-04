import type { LeadInput } from '../types/lead';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  leads: LeadInput[];
}

export function validateLeadJson(raw: string): ValidationResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { valid: false, errors: ['Invalid JSON — cannot parse.'], leads: [] };
  }

  // Accept a single object or an array of objects
  const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed];

  if (items.length === 0) {
    return { valid: false, errors: ['Array is empty — add at least one lead.'], leads: [] };
  }

  return { valid: true, errors: [], leads: items as LeadInput[] };
}
