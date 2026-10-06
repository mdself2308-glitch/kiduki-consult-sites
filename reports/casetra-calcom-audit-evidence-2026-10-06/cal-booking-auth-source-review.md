# Cal booking authentication boundary — primary-source review

Checked 2026-10-06. Read-only. No Cal account writes, bookings, notifications or credentials were used. Only public official documentation and a small set of source files were fetched; no repository clone.

## Conclusion

`bookingRequiresAuthentication: true` is **not sufficient evidence of paid/server-only booking through Cal.com's public booking page**.

The official API documentation describes an authenticated owner/admin restriction **via API**. The inspected public source enforces the property on the API v2 entry path, but the separate web booking entry path calls the common booking service without that check. Therefore the inspected public implementation does not block the web route on this flag.

**Cloud boundary remains unverified.** The requested official repository URL `https://github.com/calcom/cal.com` now redirects to `https://github.com/calcom/cal.diy`. Its README calls this a community edition/fork with commercial code removed. The audited snapshot is `54343aa685ae8f33159d2f485ec4a57bad5c574a`; it cannot be asserted identical to the signed-in Cal.com Cloud `v6.9.11-h` deployment. A Cloud test was not run.

## Exact code paths

All source permalinks below are pinned to the same public commit.

1. **API v2 rejection exists.**
   `apps/api/v2/src/platform/bookings/2024-08-13/controllers/bookings.controller.ts`, lines 104–108 and 149–155, uses optional API authentication and passes the optional user to the booking service.
   https://github.com/calcom/cal.diy/blob/54343aa685ae8f33159d2f485ec4a57bad5c574a/apps/api/v2/src/platform/bookings/2024-08-13/controllers/bookings.controller.ts#L104-L155

2. **API v2 checks the flag before creating.**
   `.../services/bookings.service.ts`, lines 112–125, calls `checkBookingRequiresAuthenticationSetting`. Lines 169–185 implement: flag false → return; no authenticated user → Unauthorized; authenticated user without event owner/admin access → Forbidden.
   https://github.com/calcom/cal.diy/blob/54343aa685ae8f33159d2f485ec4a57bad5c574a/apps/api/v2/src/platform/bookings/2024-08-13/services/bookings.service.ts#L112-L185

3. **The web client uses a different route.**
   `packages/features/bookings/lib/create-booking.ts`, lines 5–14, sends the web booking body to `/api/book/event`, not `/v2/bookings`.
   https://github.com/calcom/cal.diy/blob/54343aa685ae8f33159d2f485ec4a57bad5c574a/packages/features/bookings/lib/create-booking.ts#L5-L14

4. **The web route does not invoke the API v2 check.**
   `apps/web/pages/api/book/event.ts`, lines 42–58, reads an optional session, labels the request `WEBAPP`, and calls `RegularBookingService.createBooking`. An absent session is passed as `userId: -1`; it is not rejected there. The earlier checks are CAPTCHA (when configured), bot detection and rate limiting.
   https://github.com/calcom/cal.diy/blob/54343aa685ae8f33159d2f485ec4a57bad5c574a/apps/web/pages/api/book/event.ts#L17-L63

5. **The shared web booking service does not load/check this flag.**
   `RegularBookingService.ts`, lines 487–628, loads the event, validates booking fields and applies booker-email verification when enabled; it contains no `bookingRequiresAuthentication` reference. Its `createBooking` method at 2653–2661 calls this handler directly.
   https://github.com/calcom/cal.diy/blob/54343aa685ae8f33159d2f485ec4a57bad5c574a/packages/features/bookings/lib/service/RegularBookingService.ts#L487-L628
   https://github.com/calcom/cal.diy/blob/54343aa685ae8f33159d2f485ec4a57bad5c574a/packages/features/bookings/lib/service/RegularBookingService.ts#L2653-L2661

   The event database select in `getEventTypesFromDB.ts` (lines 17 onward) includes requiresConfirmation and requiresBookerEmailVerification but not bookingRequiresAuthentication. Thus this inspected common web path does not even retrieve the flag used by the API-specific service.
   https://github.com/calcom/cal.diy/blob/54343aa685ae8f33159d2f485ec4a57bad5c574a/packages/features/bookings/lib/handleNewBooking/getEventTypesFromDB.ts#L17-L86

## Official documentation and repository status

- API setting: https://cal.com/docs/api-reference/v2/event-types/create-an-event-type#body-booking-requires-authentication — owner/admin authentication is described for API booking. It does not promise blocking the separate web route.
- Repository redirect and README: https://github.com/calcom/cal.com → https://github.com/calcom/cal.diy — public community edition is not authoritative proof of the running Cloud implementation.
- Original official feature issue: https://github.com/calcom/cal.diy/issues/23208 — requested and designed as an API authentication check. This issue corroborates intent, not Cloud acceptance.
- Hidden/private links: https://cal.com/blog/mastering-cal-com-hidden-events-and-private-links-explained — hidden affects profile listing and private links do not disable the normal event link. These are not authorization gates.

## One alternative examined: required confirmation + owner confirmation API

Cal documents `confirmationPolicy` for holding a booking pending until confirmed; its `POST /v2/bookings/{bookingUid}/confirm` endpoint requires the booking owner's authorization. This is a documented **owner-controlled acceptance** mechanism, not an owner-only creation mechanism.

- https://cal.com/docs/api-reference/v2/event-types/create-an-event-type#body-confirmation-policy
- https://cal.com/docs/api-reference/v2/bookings/confirm-a-booking

It does not fully solve this task's restriction: a public visitor may still submit a pending request, and the public implementation sends request emails when confirmation is required (unless email suppression applies). That behavior appears in `RegularBookingService.ts` lines 2189–2202. Slot blocking, pending-request email behavior, subsequent confirmation timing and failure handling would all require explicit design and acceptance. No Cloud behavior was tested.

https://github.com/calcom/cal.diy/blob/54343aa685ae8f33159d2f485ec4a57bad5c574a/packages/features/bookings/lib/service/RegularBookingService.ts#L2189-L2202

Current KIDUKI gateway intentionally requires confirmation disabled. Enabling this candidate now would fail that guard and alter the paid reservation state machine. Do not simply loosen the guard. A complete supported owner-API-only **creation** setting that also blocks public-web booking was not established in this bounded review.

## Launch consequence

Keep public intake closed until the direct-web path is shown to be safe by Cal Cloud-specific documentation/support evidence or an explicitly authorized synthetic acceptance test. Continue requiring a verified paid order before Casetra ingestion/Case/provisioning/notifications. That application guard protects fulfillment, but cannot by itself prevent an unpaid direct Cal booking from occupying a slot or triggering Cal-owned integrations/notifications.

No claim of a live exploit or live rejection is made: this is a public-source code-path finding plus a separately stated Cloud evidence gap.
