# Sales Target Formula Parity

The native Web OS Target Calculator uses the same calculation sequence as the BROS SELL Customer Package workbook:

1. Sales Required = ROUNDUP(Revenue Target / Average Deal Size, 0)
2. Qualified Opportunities Required = ROUNDUP(Sales Required / Close Rate, 0)
3. Conversations Required = ROUNDUP(Qualified Opportunities Required / Qualification Rate, 0)
4. Leads Required = ROUNDUP(Conversations Required / Conversation Rate, 0)

## Canonical parity cases

| Case | Inputs | Expected output |
|---|---|---|
| Customer Package example | RM15,000 / RM1,500 / 20% / 50% / 60% | 10 sales → 50 opportunities → 100 conversations → 167 leads |
| Fractional volume | RM10,000 / RM300 / 25% / 50% / 20% | 34 sales → 136 opportunities → 272 conversations → 1,360 leads |

Rates are represented as decimals in the calculation layer and as percentages in the customer UI.

The source workbook also states the operating interpretation: when actual performance is below target at a stage, diagnose that stage before simply increasing lead volume.

This document is a parity QA reference, not a replacement for the Customer Package source.