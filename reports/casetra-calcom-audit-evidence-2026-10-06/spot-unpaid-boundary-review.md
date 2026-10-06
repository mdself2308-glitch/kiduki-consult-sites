# SPOT ordinary-ingest boundary: independent review

2026-10-06. Read-only source review in `/Users/dmmac/CodexWorktrees/kiduki-spot-api-20261006`, base HEAD `257d1e9` plus current dedicated-Cal/boundary working changes. Generated dist ignored. No source edits, live queries, provider operations or persistent data writes in this review.

## Findings and disposition

- P1 detected and closed: the first boundary implementation omitted Cal's `payload.type` / `booking.type`, while ordinary slug extraction accepts `type` (`src/domain/upsertFromNormalized.ts:1130-1139`). The independent in-memory reproduction made two RawEvents writes before repair. The implementation lane added both type fields (`src/shared/spotBookingBoundary.ts:11-15`), a shared type-only/wrapped regression (`test/spotBookingBoundary.test.ts:24-30`) and HTTP regression (`test/webhookBooking.signature.test.ts:86-89`). Re-running the original isolated fixture after repair returned `spot_paid_order_required` with zero repository reads/writes. No residual P1 found in the scoped change after that repair.
- Cal's official payload reference describes `type` as the event-type slug and uses it for CREATED/CANCELLED/RESCHEDULED. The 2026-07-27 version extends the earlier shape without changing these fields: https://cal.com/docs/developing/guides/automation/webhooks . This is provider-schema evidence, not a readback of the user's live webhook settings.

## Boundaries verified

- HTTP signature checking remains before parsing/dispatch. SPOT stored-order or metadata order references use `handleCalChange`; unlinked dedicated namespace/markers return409 before ordinary processRawEvent (`src/functions/webhookBooking.ts:112-150`). A client-supplied company/service does not override this rejection.
- Shared process rejects payload markers before extraction, and normalized values/existing Booking before RawEvents and draft claims (`src/domain/processRawEvent.ts:32-43`). Direct normalized imports guard raw payload, values and mapped Booking, then existing stored Booking before employee/Booking/Case writes (`src/domain/upsertFromNormalized.ts:240-264`).
- A signed notification is a trigger, not payment evidence. Recognized order changes reconcile/read Cal and check saved order/company/event/host/duration (`src/spot/orders.ts:125-128,233-260`). Paid fulfillment remains in the separate direct repository path; it does not call the newly guarded legacy upsert (`src/spot/fulfillment.ts:206-240`).
- Regular contract slugs remain accepted. No new bypass flag, broad external lookup, contract configuration modification or price/Case changes were added by the boundary fix.

## Accepted scope limitation / launch check

Parent decision: verify live webhook uses the standard Cal payload with no custom payload template that removes type/slug/metadata. If a new event carries neither a SPOT slug nor marker and no existing Booking is found at the supplied booking ID, the shared guard cannot classify it as SPOT. No dedicated event IDs were yet created at review time; no inferred IDs or catch-all rejection of legacy unknown events is introduced. Recovery/import must preserve the standard slug/marker and canonical Cal UID; an unrelated import booking ID cannot be treated as proof that payload.uid was checked against stored SPOT state. This is a bounded legacy-interface limitation, not a claim of universal inference from omitted identity data. Implementation owner was asked to record the standard-payload launch prerequisite in the provider runbook.

## Independent validation

`node --test --require ts-node/register test/spotBookingBoundary.test.ts test/webhookBooking.signature.test.ts`: 12/12 PASS, no failures. Additional in-memory fixture set global.fetch to a function that always throws, used synthetic IDs and counted mock repository writes; fixed type-only event had0 reads/0 writes. Full-suite/build/audit are owned by the implementation lane after the final edit.

Reviewed SHA256:

- `src/shared/spotBookingBoundary.ts`: `d511730b0c7ba587d22301f19be459af64917adeda51977cd9331cad305968b8`
- `src/domain/processRawEvent.ts`: `ea2de23e3934cf0974735ef7c2fec0d05529e5597977b373c23e5a54fdea0c83`
- `src/domain/upsertFromNormalized.ts`: `74cf3aeb73142b61b4c7791e9187199e7a5a761386190596b17fc401c9b5cf03`
- `src/functions/webhookBooking.ts`: `263b43412ce5cf1c6111c8594f805c9e541e1aae7ea003cd254862765ed3dfb1`
- `test/spotBookingBoundary.test.ts`: `55d0406e72e9b5c535acaaefc068fce9903488fd2ae47245092caf575c1e27d2`
- `test/webhookBooking.signature.test.ts`: `320879391ad2f1ba29872b6e6c17233e82a544ca743b63362601870d03632719`

## Final normalization follow-up

Read-only follow-up reviewed the helper's reuse of `normalizeEventTypeSlug` and the added URL/path/case/percent-encoding fixtures. Runtime import chain is `spotBookingBoundary -> eventTypeMapping -> templateCatalog -> taskSchemas -> loadSeeds`; no import back into this boundary/ingest was found. Normalization itself does not load the catalogs or seeds. A pure in-memory check tested every one of the48 current contract mapping slugs in raw, uppercase, URL and path form (192 checks): zero false positives. Five SPOT representations were rejected. The helper now applies the same canonical normalization used for legacy slug extraction/mapping. No new residual P1 found; source was not modified by this reviewer.

Provider runbook lines115-120 now records the standard-payload/custom-template constraint, eventTypeId-only limitation and the separate Cal occupancy/invitation acceptance boundary. Full suite is running in the implementation lane; this follow-up did not repeat it. The two updated SHA256 values above supersede the earlier helper/test hashes.

## Final fixture migration review

Read-only review of the last two test diffs found no lost expectation. `test/bookingConnectionRegression.test.ts:88-104` still verifies no same-Case reschedule lookup, a new booking chain, FB SKU, no inherited workspace folder and no old-booking reschedule link. Only paid-SPOT data incorrectly fed into the now-rejecting legacy upsert was removed. The actual `fulfillSpotOrder` test retains Case type/plan, Case/Booking link, company contact email, absence of employee-email fallback and included billing assertions (`test/spotFulfillment.test.ts:64-99`); Booking order-ID persistence was added at line80. No source guard was weakened. This reviewer did not rerun the full suite; implementation lane owns the final execution.

- `test/bookingConnectionRegression.test.ts`: `d372f5c3a5657a689895492b1c1cd68d047433684021374af51cb542527cdd82`
- `test/spotFulfillment.test.ts`: `c28744038cfbc92b3f3b1a953d8f5e00e78f7a1d8cedcc1fba0a5d7bd14ce1c8`
