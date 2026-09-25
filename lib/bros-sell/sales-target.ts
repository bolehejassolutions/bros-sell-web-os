export type SalesTargetInputs = {
  revenueTarget: number;
  averageDealSize: number;
  closeRate: number;
  qualificationRate: number;
  conversationRate: number;
};

export type SalesTargetResult = {
  requiredSales: number;
  requiredOpportunities: number;
  requiredConversations: number;
  requiredLeads: number;
};

/** Canonical BROS SELL sales-target calculation. Rates are decimals. */
export function calculateSalesTarget(input: SalesTargetInputs): SalesTargetResult | null {
  const { revenueTarget, averageDealSize, closeRate, qualificationRate, conversationRate } = input;
  if (
    !Number.isFinite(revenueTarget) || revenueTarget <= 0 ||
    !Number.isFinite(averageDealSize) || averageDealSize <= 0 ||
    !Number.isFinite(closeRate) || closeRate <= 0 ||
    !Number.isFinite(qualificationRate) || qualificationRate <= 0 ||
    !Number.isFinite(conversationRate) || conversationRate <= 0
  ) return null;
  const requiredSales = Math.ceil(revenueTarget / averageDealSize);
  const requiredOpportunities = Math.ceil(requiredSales / closeRate);
  const requiredConversations = Math.ceil(requiredOpportunities / qualificationRate);
  const requiredLeads = Math.ceil(requiredConversations / conversationRate);
  return { requiredSales, requiredOpportunities, requiredConversations, requiredLeads };
};

export const SALES_TARGET_PARITY_CASES = [
  { name: "Customer Package example", input: { revenueTarget: 15000, averageDealSize: 1500, closeRate: 0.2, qualificationRate: 0.5, conversationRate: 0.6 }, expected: { requiredSales: 10, requiredOpportunities: 50, requiredConversations: 100, requiredLeads: 167 } },
  { name: "Fractional sales volume rounds up at every stage", input: { revenueTarget: 10000, averageDealSize: 300, closeRate: 0.25, qualificationRate: 0.5, conversationRate: 0.2 }, expected: { requiredSales: 34, requiredOpportunities: 136, requiredConversations: 272, requiredLeads: 1360 } },
] as const;