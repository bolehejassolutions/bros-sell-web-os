# BROS SELL - first 10 paying customers

Production: https://brossell.bolehejas.com. Released source: `913ea4c668f4176da2cd03925dd6613eecd75164`. PR #11 is merged. Feature expansion stops at this reviewed P0; use customer behaviour to decide P1.

## Validation objective

Acquire and support the first **10 paying customers organically**. Count distinct real customers with verified successful payment/reference; test identities, free grants and agent verification do not count. The current count has not been asserted by this release task.

Use the existing funnel: problem/system-awareness content -> bros.bolehejas.com -> HitPay -> customer delivery and manually verified Web OS access. Retain the current approved published offer and commercial settings. This handoff does not set a new price, deadline, ad budget or delivery SLA.

Public messaging uses BROS SELL as a practical Sales Operating System and the doctrine **Menjelaskan, bukan Memujuk**. Do not make every content item a direct pitch or describe customers publicly as beta/founding/validation users. Focus on real selling problems of Malaysian micro-business sellers.

## Per-customer operating sequence

1. Verify successful HitPay payment/reference and match purchase email to customer account email.
2. Follow [manual-fulfilment-access-recovery.md](manual-fulfilment-access-recovery.md). New manual grants use BROS_SELL_CORE/core with source manual. Preserve existing valid access and use the existing secure admin process.
3. Confirm /app plus one protected resource after the actual grant/recovery; record the result privately. HitPay's downloadable package is delivered separately; Web OS is the maintained online companion.
4. Invite the customer to use one real selling conversation as a Sales Case. Let their actual offer/value drive the case; RM500 was the verification example, not a required customer price.
5. Follow the existing loop: create/select case -> Situation Analyzer and evidence -> WHAT/WHY/NEXT -> relevant native tool -> record action -> record outcome -> review recomputed next action and dashboard priority.
6. After they use it, collect the obstacle they met, what they did next and the observed result. Recovery/support uses brossell@bolehejas.com from the purchase email, optional HitPay reference; never passwords, OTPs or card information.
7. Keep follow-up/support in the existing private operator record. Do not publish customer names, emails, receipts, account IDs or Sales Case contents in this repository.

This document does not authorise a new entitlement or commercial change itself. Perform real per-customer fulfilment through the established authorised workflow.

## Evidence to collect

| Question | Existing evidence to record privately | Why it matters |
| --- | --- | --- |
| Did the customer reach the product? | Payment/email match, /app and protected-resource result, delivery/recovery friction | Separates fulfilment failure from product difficulty |
| Did a real case begin? | First case date and stage reached; stopping point | Identifies onboarding friction |
| Did diagnosis help a decision? | Evidence entered, next action understood, actual chosen action | Tests decision clarity |
| Did the customer complete the loop? | Action, recorded outcome, recomputed next action, later return | Tests practical repeated use |
| Where did progress break? | Screen/step, expected versus observed behaviour, workaround | Gives a concrete repair target |
| What happened in the sale? | Customer-reported outcome and context | Avoids treating activity or a sale as proof of causation |

Separate observed behaviour, customer statements and operator inference. Do not invent usage metrics or claim automatic analytics exist. Use existing case/action/outcome data with appropriate authorised customer access and the existing support record; no new tracking platform or features are needed.

## P1 decision after validation

Review patterns across the first 10 paying customers. Prioritise a problem by how many customers encounter it, how strongly it blocks useful selling activity, whether an existing workaround works and the smallest change that addresses it. Record the concrete examples before proposing work.

A reproducible release regression gets an application fix/rollback assessment immediately. A single feature request remains evidence to investigate; it is not an automatic build instruction. Do not broaden into AI, CRM, team, webinar, community or membership features during this phase.

Next operational action: start the next organic customer conversation, fulfil the next verified purchase through the existing manual path, and observe that customer's first real Sales Case.
