/**
 * Robust JSON parser for LLM responses.
 *
 * LLMs frequently return JSON wrapped in markdown code fences, with trailing
 * commas, comments, unescaped control characters, or other formatting issues.
 * This helper uses `jsonrepair` to automatically fix all common LLM JSON
 * problems before parsing, and falls back to the provided default value if
 * parsing still fails.
 */

import { jsonrepair } from 'jsonrepair';

/**
 * Attempt to extract and parse a JSON object from raw LLM output.
 *
 * Steps applied in order:
 * 1. Strip markdown code fences (```json … ``` or ``` … ```)
 * 2. Extract the outermost { … } block
 * 3. Run jsonrepair to fix trailing commas, comments, bad escapes, etc.
 * 4. Parse with JSON.parse
 */
export function parseJSONFromLLM<T>(response: string, fallback: T): T {
  try {
    // 1. Strip markdown code fences
    let cleaned = response
      .replace(/```(?:json)?\s*/gi, '')
      .replace(/```/g, '')
      .trim();

    // 2. Extract the outermost JSON object
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end === -1 || end < start) return fallback;
    const jsonStr = cleaned.slice(start, end + 1);

    // 3. Repair and parse
    return JSON.parse(jsonrepair(jsonStr)) as T;
  } catch (error) {
    console.error('Failed to parse LLM response:', error);
    return fallback;
  }
}
