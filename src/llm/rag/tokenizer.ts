// NOTE: The tokenize function and STOPWORDS constant are duplicated verbatim in
// scripts/build_corpus.js. Any changes here must be mirrored there.

const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
  'from','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall',
  'not','no','nor','so','yet','both','either','neither','each','few','more',
  'most','other','some','such','than','that','these','they','this','those',
  'as','its','it','he','she','we','you','i','me','him','her','us','them',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2 && !STOPWORDS.has(t));
}
