const strings: Record<string, string[]> = {
  'close-path': ['decision', 'barrier', 'nextStep'],
  'customer-multiplication': ['customer', 'purchase', 'expected', 'actual', 'proof', 'permission', 'referral', 'repeat', 'expansion', 'next'],
  'follow-up': ['leadContext', 'event', 'purpose', 'draft', 'decision', 'nextStep', 'stop'],
  'implementation-tracker': ['filter', 'baseline', 'biggestChange', 'improved', 'notImproved', 'keep', 'change', 'remove', 'nextTarget'],
  'objection-playbook': ['statement', 'meaning', 'question', 'answer', 'barrier', 'response', 'confirmation', 'nextStep'],
  'operator-dashboard': ['bottleneck', 'nextMove'],
  'target-calculator': ['revenueTarget', 'averageDealSize', 'closeRate', 'qualificationRate', 'conversationRate'],
  'whatsapp-scripts': ['context', 'custom'],
};
const records: Record<string, string[]> = {
  'buyer-intelligence': ['answers', 'synthesis'], 'close-path': ['answers'],
  'implementation-tracker': ['status', 'evidence', 'notes'], 'lead-state': ['v'],
  'offer-stack': ['values'], 'value-bridge': ['v'],
};
const arrays: Record<string, string> = { 'customer-multiplication': 'checksState', 'follow-up': 'checks', 'whatsapp-scripts': 'qaState' };
const selected: Record<string, [string, number]> = { 'follow-up': ['level', 5], 'objection-playbook': ['selected', 7], 'whatsapp-scripts': ['selected', 22] };
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown) => typeof v === 'string' && v.length <= 12000;
export function validToolData(tools: unknown): boolean {
  if (!object(tools)) return false;
  return Object.entries(tools).every(([tool, data]) => object(data) && Object.entries(data).every(([key, value]) => {
    if (strings[tool]?.includes(key)) return text(value);
    if (records[tool]?.includes(key)) return object(value) && Object.values(value).every(text);
    if (arrays[tool] === key) return Array.isArray(value) && value.length <= 50 && value.every(v => typeof v === 'boolean');
    if (selected[tool]?.[0] === key) return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= selected[tool][1];
    if (tool === 'operator-dashboard' && key === 'values') return object(value) && Object.values(value).every(v => object(v) && text(v.target) && text(v.actual));
    return false;
  }));
}
