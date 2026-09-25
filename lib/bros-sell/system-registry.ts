export type BrosStage = "TARGET" | "BUYER" | "OFFER" | "LEAD" | "QUALIFY" | "VALUE" | "CLOSE" | "FOLLOW-UP" | "MULTIPLY" | "OPERATE";

export const BROS_STAGES: BrosStage[] = ["TARGET", "BUYER", "OFFER", "LEAD", "QUALIFY", "VALUE", "CLOSE", "FOLLOW-UP", "MULTIPLY", "OPERATE"];

export const BROS_LEAD_STATES = ["Aware", "Engaged", "Qualified", "Active", "Decision"] as const;
export const BROS_LEAD_QUALITY = ["Relevance", "Need", "Readiness", "Fit", "Access", "Engagement"] as const;

export const BROS_CANONICAL_TERMS = {
  TARGET: { ms: "Sasaran", en: "Target" },
  BUYER: { ms: "Buyer", en: "Buyer" },
  OFFER: { ms: "Tawaran", en: "Offer" },
  LEAD: { ms: "Lead", en: "Lead" },
  QUALIFY: { ms: "Kelayakan", en: "Qualify" },
  VALUE: { ms: "Nilai", en: "Value" },
  CLOSE: { ms: "Tutup Jualan", en: "Close" },
  "FOLLOW-UP": { ms: "Susulan", en: "Follow-up" },
  MULTIPLY: { ms: "Gandakan", en: "Multiply" },
  OPERATE: { ms: "Operasi", en: "Operate" },
  "Decision Clarity": { ms: "Kejelasan Keputusan", en: "Decision Clarity" },
  "Lead State": { ms: "Status Lead", en: "Lead State" },
  "Sales Operating System": { ms: "Sistem Operasi Jualan", en: "Sales Operating System" }
} as const;

export const BROS_SALES_FUNNEL_FORMULAS = {
  requiredSales: "revenueTarget / averageDealSize",
  requiredOpportunities: "requiredSales / closeRate",
  requiredConversations: "requiredOpportunities / qualificationRate",
  requiredLeads: "requiredConversations / conversationRate"
} as const;

export const BROS_LEAD_STATE_RULES = {
  Aware: ["TARGET", "BUYER", "LEAD"],
  Engaged: ["BUYER", "LEAD", "QUALIFY"],
  Qualified: ["QUALIFY", "VALUE", "CLOSE"],
  Active: ["VALUE", "CLOSE", "FOLLOW-UP"],
  Decision: ["CLOSE", "FOLLOW-UP"]
} as const;

export const BROS_CORE_LOOP = ["SITUATION", "EVIDENCE", "DIAGNOSIS", "ACTION", "OUTCOME", "NEXT ACTION"] as const;
