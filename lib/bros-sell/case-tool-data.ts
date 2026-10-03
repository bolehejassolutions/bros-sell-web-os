import { diagnoseCase, type CaseDocument, type FactKey, type JsonValue } from './sales-case.ts';

const FACT_MAPS: Record<string, Record<string, FactKey>> = {
  'buyer-intelligence.answers': { WHO: 'buyer', 'CURRENT STATE': 'currentSituation', PROBLEM: 'problem', IMPACT: 'impact', TRIGGER: 'trigger', 'DESIRED RESULT': 'desiredOutcome', 'DECISION CRITERIA': 'criteria', BARRIER: 'barrier', AUTHORITY: 'authority', 'Q1 - SITUATION': 'currentSituation', 'Q2 - PROBLEM': 'problem', 'Q3 - IMPACT': 'impact', 'Q4 - DESIRED RESULT': 'desiredOutcome', 'Q5 - DECISION': 'criteria' },
  'offer-stack.values': { PROBLEM: 'problem', OUTCOME: 'desiredOutcome', MECHANISM: 'mechanism', PROOF: 'proof', 'RISK REDUCTION': 'assurance', INVESTMENT: 'investment', 'REASON TO ACT': 'reasonToAct' },
  'value-bridge.v': { PROBLEM: 'problem', IMPACT: 'impact', 'DESIRED OUTCOME': 'desiredOutcome', 'SOLUTION FIT': 'mechanism', 'PROOF / ASSURANCE': 'proof', INVESTMENT: 'investment' },
  'lead-state.v': { need: 'problem' },
};
export function readToolValue<T extends JsonValue>(doc: CaseDocument, tool: string, key: string, fallback: T): T {
  const stored = doc.tools[tool]?.[key];
  const defaults: Record<string, JsonValue> = {
    'whatsapp-scripts.context': `${doc.situation}\n${doc.evidence}`,
    'follow-up.leadContext': `${doc.situation}\n${doc.evidence}`,
    'follow-up.event': doc.history.at(-1)?.note ?? doc.evidence,
    'follow-up.level': ['REMIND', 'CLARIFY', 'REINFORCE', 'DIAGNOSE', 'DECIDE', 'RE-ENTER'].indexOf(diagnoseCase(doc).followUpLevel),
    'follow-up.purpose': diagnoseCase(doc).followUpLevel,
    'objection-playbook.statement': doc.facts.barrier || doc.evidence,
    'customer-multiplication.customer': doc.facts.buyer ?? '',
    'customer-multiplication.purchase': doc.facts.offer ?? '',
    'customer-multiplication.expected': doc.facts.desiredOutcome ?? '',
  };
  let value = (stored ?? defaults[`${tool}.${key}`] ?? fallback) as T;
  const mapping = FACT_MAPS[`${tool}.${key}`];
  if (mapping) value = { ...(typeof value === 'object' ? value : {}), ...Object.fromEntries(Object.entries(mapping).map(([field, fact]) => [field, doc.facts[fact] ?? ''])) } as T;
  return value;
}
export function writeToolValue<T extends JsonValue>(doc: CaseDocument, tool: string, key: string, next: T, previous: T): CaseDocument {
  const facts = { ...doc.facts };
  const mapping = FACT_MAPS[`${tool}.${key}`];
  if (mapping && next && typeof next === 'object' && !Array.isArray(next)) {
    for (const [field, fact] of Object.entries(mapping)) {
      const text = (next as Record<string, JsonValue>)[field];
      if (typeof text === 'string' && text !== (previous as Record<string, JsonValue>)[field]) facts[fact] = text;
    }
  }
  return { ...doc, facts, tools: { ...doc.tools, [tool]: { ...doc.tools[tool], [key]: next } } };
}
