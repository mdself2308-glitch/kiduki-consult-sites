# Cal.com SPOT event audit — 2026-10-06

Scope: signed-in Chrome UI, read-only inspection of the 9 personal event types selected by the current SPOT catalog. No booking, mail, payment, or shared-event change occurred. New SPOT event creation was attempted only after root's scoped instruction and blocked before any input/write by automatic approval review. All 6 proposed SPOT events remain uncreated.

## Verified current event types

All rows belong to the personal `kdk-k6whio` path and are managed child events. Title, description, duration, location, form and limit controls are locked by the shared parent. IDs below are the observed **child** event IDs, not inferred team-parent IDs.

| Slug | Child ID | Duration | Current title |
| --- | --- | ---: | --- |
| `consult-online-20` | 4747552 | 20 min | 長時間労働・健診事後措置オンライン |
| `consult-online-35` | 4747568 | 35 min | 長時間労働面談・健康診断事後措置面談（オンライン）フィードバックあり |
| `stress-check-online-30` | 4747583 | 30 min | ストレスチェック後面談（オンライン） |
| `stress-check-online-45` | 4747554 | 45 min | ストレスチェック後面談（オンライン）フィードバックあり |
| `health-consult-online-30` | 4747570 | 30 min | 健康相談（オンライン） |
| `health-consult-online-45` | 4747585 | 45 min | 健康相談（オンライン）フィードバックあり |
| `consult-online-70` | 4747572 | 70 min | 復職判定面談（オンライン）フィードバックあり |
| `hr-feedback-15` | 4747663 | 15 min | HR報告・協議（オンライン15分） |
| `hr-consult-30` | 4747562 | 30 min | HR相談・協議（オンライン30分） |

Common settings verified on all 9:

- Required form fields: name and email only. Phone and meeting-content short question hidden. Notes, guests and reschedule reason optional. No additional required custom field was shown.
- Conferencing: MS Teams selected.
- Minimum notice: 2 days (48 hours).
- Cal native paid booking: off. Seats: off.
- All titles/descriptions convey the service category; they do not satisfy the SPOT runbook's generic nonclinical-content release gate.

Additional evidence:

- HR feedback 15 confirmation page has no explicit custom calendar-event name. Its default placeholder includes the event title and scheduler. This establishes that generic metadata alone does not sanitize the resulting default invitation name; no actual invitation was generated.
- HR consultation 30 availability page uses **account** conflict settings. The primary business Google calendar is enabled for conflict checks and is the event destination; the two other listed calendars are off. This is UI configuration evidence, not proof of active OAuth validity, fresh free/busy, or successful event creation.
- Eight stored limits-page snapshots (all except the earlier FB15 summary) show zero before/after buffer. FB15 buffer was not separately retained/verified.
- `stress-check-online-30` has a pre-existing wrong description referring to long-hours/checkup follow-up, despite its stress-check title. Do not repair the shared parent as part of this isolated SPOT rollout.

## Request-body conclusion

Current `src/spot/gateways.ts:createBooking` sends eventTypeId, start, attendee name/email/timeZone/language, opaque metadata and conflict protections. The live form configuration does **not** substantiate a missing-required-`bookingFieldsResponses` defect: the only required fields are already in attendee. There was no real API booking request, so end-to-end acceptance and generated Teams URL remain unverified.

The create-booking body has no title/description override. A dedicated generic source event is needed to meet the present privacy release gate. Keep the owner/slug/duration/payment/confirmation checks in `resolveEventType`; do not loosen them merely to force acceptance.

## Proposed isolated SPOT configuration

Create personal events owned by `kdk-k6whio`, leaving existing managed/shared events unchanged:

| Proposed slug | Duration | SPOT catalog routing |
| --- | ---: | --- |
| `spot-online-15` | 15 min | feedback15 |
| `spot-online-20` | 20 min | longhours/checkup without oral FB |
| `spot-online-30` | 30 min | stress/health without oral FB; feedback30 |
| `spot-online-35` | 35 min | longhours/checkup with 15-min oral FB |
| `spot-online-45` | 45 min | stress/health with 15-min oral FB |
| `spot-online-70` | 70 min | returnToWork (40+30) |

Proposed title: `オンライン面談` for every duration. Proposed description: `ご予約の日時にオンラインで実施します。接続先は予約確定後のご案内をご確認ください。` No health category, employer notes or clinical detail in title, description, slug, fields, workflow, custom calendar name or notification templates.

Use MS Teams, the physician's intended existing schedule and account conflict/destination calendar, minimum notice 48h, Cal native payment off, seats/recurrence/instant/approval off. Hide from the public profile if supported, while checking that the authenticated API can still resolve and book the type. Do not create a test booking or send invitations during configuration.

New event schedule/timezone inheritance, direct-link exposure behavior, Google connection validity, Teams connection validity, custom workflow inheritance and availability still require readback after creation. UI creation is not yet authorized by the automatic approval reviewer; nothing has been created.

Code handoff: update only SPOT `config/spotCatalog.v1.json` calSlug/calFeedbackSlug routing to the 6 new slugs. Ordinary contract catalog stays unchanged. `SPOT_CAL_EVENT_IDS`, if present, must be reviewed for the new slug/ID pairs; ID mapping does not override the exact fetched slug/duration guard. New IDs must be read after creation, never guessed. Current gateway does not validate generic title/description automatically, so the human/provider audit remains a release gate.

## Explicit boundaries and remaining evidence

- All 9 current titles, descriptions, required fields, duration, conference choice, 48-hour notice and native paid-booking state inspected.
- Calendar event-name fallback inspected on FB15 only.
- Account conflict/destination setting inspected on HR30 only.
- Each event's confirmation policy, recurrence, custom workflows, templates, schedule/timezone and provider API response were not individually re-audited. The runtime checks confirmation/payment/regular-event shape and must remain fail closed.
- No health content, keys, personal booking records or secret-bearing webhook URLs were read or exported.
- No Cal setting was changed. No test booking, notification, email or external payment occurred.

## Creation approval blocker

The attempted action was: personal owner `kdk-k6whio`, title `オンライン面談`, slug `spot-online-15`, duration 15 minutes, then Continue in the new-event dialog. The automatic approval reviewer rejected the action because the exact event/title/slug/ownership had not been explicitly approved immediately before the external write. Readback shows blank title and URL fields: the tool call did not type or create the event.

The local Cal skill also says: “Keep read operations convenient and place an explicit human confirmation immediately before every external write.” Source: `/Users/dmmac/.codex/skills/calcom-safe-scheduling/SKILL.md`.

Ask one grouped confirmation covering the six exact durations/slugs, common owner/title/description, 48-hour notice, Teams, payment off, intended schedule/calendar inheritance, hidden public profile, preservation of all existing events, and no booking/notification. Then resume from the still-open personal new-event dialog at `https://app.cal.com/event-types?dialog=new&eventPage=kdk-k6whio` (Chrome tab 679421171, retained for handoff). If the proposed values change, re-evaluate approval requirements before the external write.

## Direct free-booking boundary (additional read-only review)

Hidden is not access control. Cal's official explanation says it removes an event from the profile but retains link-based booking; private links do not disable the normal link. Consequently predictable `spot-online-N` URLs plus Cal payment off must not be described as private or paid-only access. Source: https://cal.com/blog/mastering-cal-com-hidden-events-and-private-links-explained (2025-01-29, checked 2026-10-06).

The current official event-type API has `bookingRequiresAuthentication` (default false). When true, API booking is limited to authenticated event owner or organization/team admin/owner. The documentation explicitly describes **via API**; it alone does not establish that the public Cal.com booking UI is disabled. Source: https://cal.com/docs/api-reference/v2/event-types/create-an-event-type#body-booking-requires-authentication . Treat it as a promising setting requiring separate authorization/readback and acceptance, not a verified complete solution.

UI observation: the existing HR30 privacy page shows manual confirmation OFF, booker email verification OFF, hide calendar notes OFF, hide shared calendar details OFF, private links OFF and hide organizer email OFF (all managed/locked). It does not expose an API-only or authenticated-owner-only booking switch. No switch was touched. The new personal type's UI has not been reached because creation was blocked.

Release requirements:

1. Root has independently identified that unpaid SPOT events without order metadata can fall through to legacy ingestion; root authorized a separate code fix. Require a verified paid order before saving a SPOT booking, creating a Case, provisioning workspaces or sending service notifications. This report does not claim that unreviewed fix is already merged/deployed.
2. That application guard does not itself stop Cal from occupying a calendar slot, creating its own calendar event/Teams link, or sending Cal notifications when someone books the direct URL. These effects must be prevented/verified at Cal's boundary or operationally handled before public intake.
3. Before launch, establish through official behavior and an authorized synthetic acceptance test that unauthorized public-web and unauthenticated API booking cannot create a SPOT appointment, while the authorized server path works. Do not use a real booking or real customer to test it. Do not weaken the current fail-closed gateway to accommodate an unverified setting.
4. If public-web blocking cannot be proven, do not claim API-only/paid-only appointment access. Retain the launch gate; escalate the exact unresolved route and slot-occupancy risk to the owner.

The returned handoff tab is again the untouched new-event dialog. A screenshot of the blank dialog was emitted through the browser tool. There was no setting mutation, so no completed-settings screenshot exists.
