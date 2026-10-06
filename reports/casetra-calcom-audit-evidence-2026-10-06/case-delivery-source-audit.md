# Casetra Case / delivery read-only audit — 2026-10-06 JST

## Scope and evidence boundary

- Canonical root: `/Users/dmmac/casetra_active` (iCloud symlink).
- API: `kiduki-consult-api-deploy`, HEAD `c5c8af0a8ccf65de43b9da0137e822a87cf984b7`.
- Portal: `portal-ops`, HEAD `bcbe12d799e39e6d2daf6c640d5c4261600fde46`.
- Both `git status --short` empty when rechecked in this audit.
- Root README/AGENTS and component AGENTS read. Archived trees excluded.
- No production/customer records, environment secrets or capability URLs read. No registration, booking, generation, send, setting update or deployment executed. This note contains source references and synthetic test descriptions only.
- Paths below starting `API/` mean `/Users/dmmac/casetra_active/kiduki-consult-api-deploy/`; `Portal/` means `/Users/dmmac/casetra_active/portal-ops/`.
- Source connectivity is distinguished from past recorded live evidence. The root agent is independently inspecting current Cal/live configuration; this note does not claim current end-to-end operation.

## Existing end-to-end implementation

| Stage | Existing implementation / actual trigger | Source |
|---|---|---|
| Company commercial/onboarding setup | Canonical monthly flow starts with completed consultation, OPS SEND decision, application, manually handled CloudSign contract and signed PDF registration, assigned physician Cal READY, contract activation, Box provisioning, welcome mail. ACTIVE alone is not onboarding-ready. This is pre-existing workflow, not a new requirement invented for this discussion. | API/docs/runbooks/company_onboarding_canonical_flow.md:9-29 |
| Company contact registration | An existing company-specific registration code is resolved against Companies; inactive/disabled/expired codes are rejected. This registers a contact into an existing company, not open creation of a new company. | API/src/shared/companyRegistration.ts:222-251 |
| Contact authentication | UI supports Microsoft and email OTP. Email path requests 6-digit code, verifies challenge/email/company code, persists contact and sends completion mail. Name/email are required; phone/department optional. | Portal/app/company/register/page.tsx:90-141,172-231; API/src/functions/portalCompanyRegistration.ts:69-176 |
| Contact role and limited invitation | Same-email cross-company registration is rejected. First contact defaults company_admin, later company_member. PACK/SPOT companies without ACTIVE monthly subscription require pre-existing invitation; access tier, assigned Case IDs and expiry are preserved. | API/src/shared/companyRegistration.ts:360-436; API/src/functions/portalCompanyRegistration.ts:46-63 |
| Employee | FULL Company can select an existing employee or upsert a new employee during Case creation. employee_no is required; deterministic employee identity uses company+number. Backend enforces company and FULL access, writes audit. | Portal/app/company/cases/new/page.tsx:415-469; API/src/functions/portalEmployees.ts:18-122; Portal/lib/apiAccess.ts:182-192 |
| Case | Company UI creates DRAFT, selects template/variant through type endpoint, checks possible duplicates, then explicitly activates. It does not silently make every entered employee an active Case. | Portal/app/company/cases/new/page.tsx:457-528 |
| Booking ↔ Case | Booking sync updates Case booking_summary, ensures schedule task DONE where applicable, and writes booking.case_id for later intake/PDF linkage. The booking worker/Cal event chain is owned by the parallel booking audit. | API/src/caseos/integrations/bookingSync.ts:257-279 |
| Intake receipt | Booking workspace supplies a Box intake folder/upload route. 15-minute monitor detects at least one file, records intake_received_at, syncs active Case TK-IN-01 to RECEIVED/PENDING_REVIEW. It intentionally does not mark required-document review complete. | API/src/functions/bookingReminderAndMonitorTimer.ts:178-293,480-514,693-694 |
| Intake type differences | EMPLOYEE_INTERVIEW requires materials with 3-day/1-day reminders. HEALTHCHECK_REVIEW requires materials without pre-material reminders. HR_CONSULT/SAFETY_COMMITTEE/TRAINING materials are optional and nonblocking. | API/src/shared/bookingIntakePolicy.ts:12-55 |
| Doctor material access | Current UI retrieves session-gated file lists and proxied downloads for intake and past sessions, not raw Box URLs. Assigned Doctor/OPS role and Case scope apply; viewing window is 24h before to 12h after meeting. | Portal/app/cases/[caseId]/page.tsx:1199-1239,1285-1307,5397-5414; API/src/functions/portalBoxEvidenceLinks.ts:592-725; Portal/lib/apiAccess.ts:65-69 |
| Interview record | Doctor appointment list links to the unified Case page with doctor mode. TK-IV-01 records meeting date/method/minimum record and completion. This alone does not trigger opinion generation. | Portal/app/doctor/today/page.tsx:513,661; Portal/app/cases/[caseId]/page.tsx:2482-2542 |
| Private clinical notes | Separate Doctor-only note is displayed as excluded from Company, opinion letter, DecisionPack and Monthly Pack. Company projection removes non-company tasks/fields. | Portal/app/cases/[caseId]/page.tsx:3283-3285; API/src/caseos/services/companyCaseProjection.ts:73-119 |
| Doctor opinion | TK-DO-01 uses physician role and structured fields. One-time save uses IN_PROGRESS; completion sends DONE. API checks schema done requirements then generates opinion PDF immediately in the same request. | Portal/app/cases/[caseId]/page.tsx:5342-5356; API/src/functions/caseos/todos.ts:420-492,521-568; API/seeds/v3/task_form_schema_seed_masterdriven_v3.json:1727-1800 |
| PDF | Combines TK-IV-01 and TK-DO-01 with Company, Employee, booking provider metadata into the common opinion-letter PDF. Provider name is printed as physician name. Stable file name produces new Box file versions on regeneration. | API/src/caseos/services/opinionLetterGenerator.ts:616-713,844-864 |
| Automatic company notification | After successful PDF/Box generation, a booking ID triggers sendDeliverableNotification. There is no required separate OPS send step on this path. A missing booking ID skips automatic email; missing booking/company/recipient causes explicit failure. | API/src/functions/caseos/todos.ts:621-669; API/src/caseos/services/deliverableNotifier.ts:102-178 |
| Company receipt | Automatic mail includes opinion PDF download link and receipt-confirmation link. Receipt records confirmation and completes TK-ACK-01 where found. 72h without confirmation becomes system auto-receipt via 30-minute timer, distinct from proof someone read the file. | API/src/caseos/services/deliverableNotifier.ts:188-267; API/src/functions/portalDeliverables.ts:486-638; API/src/shared/deliverableReceiptPolicy.ts:1-28; API/src/functions/deliverableAutoConfirmTimer.ts:19-61,96-135 |
| Company decision | When plan requires receipt, TK-GT-01 DONE requires deliverable acknowledgement first. Physician is denied company-decision editing. Company decision copies measures/deadlines/review timing into Case and creates follow-up recommendations. | API/src/functions/caseos/todos.ts:263-279,495-518,679-817; API/src/caseos/services/companyCaseProjection.ts:60-70 |
| Completion and automatic follow-up Case | Close checks required evidence/tasks and receipt where configured. On close, plan.followup_schedule with non-NONE policy produces a deterministic child follow-up Case; failures leave a persisted PENDING marker, retried every 15 minutes. This creates a Case, not a Cal appointment or agreed slot. | API/src/functions/caseos/cases.ts:145-190,1350-1419,1473-1538,2302-2305 |
| Manual follow-up | OPS variant route creates child DRAFT then activates. review_date route creates a deterministic CT_FOLLOWUP DRAFT, requires parent tasks DONE, preserves company decision snapshot and avoids duplicates. | Portal/app/cases/[caseId]/page.tsx:2680-2744; API/src/caseos/services/caseService.ts:1098-1201; API/src/functions/caseos/followups.ts:18-161 |

## Exact email behavior

### Auto opinion path

`TK-DO-01 DONE → generateAndUploadOpinionLetter → sendDeliverableNotification → sendEmail`.

- Automatic recipient priority is explicit `sendTo` if supplied, otherwise first nonempty booking `email`, `booker_email`, `primary_email`, `contact_email`, otherwise company `deliverable_notice_emails`, otherwise singular `deliverable_notice_email`.
- The `employee_email` field is deliberately excluded. This is not an address- or role-level exclusion: an employee booking for themself can supply the same address as `booker_email`, which the form forwards as Cal `email` (API/docs/booking/index.html:3976-3990,4563-4568). The actual DONE caller supplies no `sendTo`, therefore booking requester wins over company fallback, including an employee requester where those fields resolve to their address.
- This is consistent with a company requester receiving the generated opinion automatically, but it is not always hard-wired to the company's master contact email.
- Mail passes subject/text/html only, with PDF download and receipt links. No PDF attachment parameter on this path.
- Source: API/src/caseos/services/deliverableNotifier.ts:150-178,188-229; API/src/functions/caseos/todos.ts:633-639.

### Legacy/manual paths checked, not assumed absent

- `portalWorkReport.ts` is live-registered and used by Doctor/OPS UI, but its request fields are extension, travel, English, additional document, notes; it persists report + billing/usage entries only. It neither generates opinion PDF nor sends opinion email. Sources: API/src/shared/registerCoreFunctions.ts:36; API/src/functions/portalWorkReport.ts:11-19,347-548; Portal/app/doctor/today/page.tsx:238-256,538-543.
- OPS `today` and booking-detail screens have document selection and separate Company notify/resend buttons. `portalDeliverables` requires existing documents.opinion_letter.box_file_id, sends to explicit send_to or company deliverable_notice_email(s), and writes delivery metadata. Sources: Portal/app/today/page.tsx:178-224,549-578; API/src/functions/portalDeliverables.ts:213-314.
- Legacy UI exposes attachment/shared_link/both, but backend does not read delivery_mode and does not pass attachments. The actual implementation remains link mail. Sources: Portal/app/today/page.tsx:664-673; API/src/functions/portalDeliverables.ts:283-289.
- PDF preview endpoint exists, generates bytes only and returns application/pdf inline. No corresponding current Portal call found. It is not a mandatory pre-delivery approval gate. Source: API/src/functions/caseos/exports.ts:1555-1590.
- There is no independent electronic-signature operation in this generation path; booked provider name is printed. Source: API/src/caseos/services/opinionLetterGenerator.ts:672-681,844-850; API/src/caseos/pdf/renderOpinionLetterPdf.ts:461-474.

## Source-detected connection limits (not production reproductions)

1. FULL Company Case actions render Close, Followup and VOID buttons, but those POST endpoints remain OPS-only in Portal API rules. FULL exception list permits creation/type/activation/Series but not close/followups/void. Thus those Company requests would be rejected by the proxy under the present source conditions. This is an existing UI/permission connection mismatch; no production click was attempted. Sources: Portal/app/cases/[caseId]/page.tsx:5499-5559; Portal/lib/apiAccess.ts:122-125,182-192; Portal/app/api/proxy/[...path]/route.ts:124-131.
2. Notification-only failure is recorded as opinion_letter_notification_pending/error. The automatic repair worker scans Box evidence repair PENDING, not all notification_pending records. If both Box writes completed and only email failed, this audited worker does not pick that record up. Manual resend exists. Sources: API/src/caseos/services/opinionLetterGenerator.ts:1232-1264,1392-1408; API/src/functions/opinionLetterEvidenceRepairTimer.ts:192-201.
3. Mail delivery feature OFF returns 202 without sending; the ordinary sendEmail facade returns status only, and notifier does not inspect a suppression message. Source-level sent metadata is therefore not inbox receipt proof. No current feature flag value was inspected. Sources: API/src/shared/mailer.ts:252-258,314-322; API/src/caseos/services/deliverableNotifier.ts:222-233.
4. PDF generation can proceed if either configured Box target succeeds, marking other evidence PARTIAL and repairing later. Both failures block completion with 503. Sources: API/src/caseos/services/opinionLetterGenerator.ts:881-902,1213-1275; API/src/functions/caseos/todos.ts:560-568.

## Retry and evidence preservation

- Box repair copies pinned delivered bytes and verifies the version/hash instead of rendering a different opinion later.
- Repair timer runs every five minutes; reconciler sends only if initial notice was not sent and uses booking send history as second duplicate guard.
- Generator uses a stable `意見書__{caseId}.pdf` file name for version continuity.
- Download uses signed token + file location/ancestry checks. Default download token lifetime is 72h (configurable), receipt confirmation token is 14d; 72h auto-receipt is a separate business status.
- Sources: API/src/caseos/services/opinionLetterGenerator.ts:853-864,1443-1643; API/src/functions/opinionLetterEvidenceRepairTimer.ts:101-137,213-230,276-280; API/src/functions/publicDeliverablesDownload.ts:43-166; API/src/shared/deliverableDownloadToken.ts:34-67.

## Demo versus ordinary company

- New 2026-10-06 synthetic company setup explicitly requires synthetic marker/name, no commercial subscription, fee zero, automatic invoice off, empty delivery recipients, booking link DO_NOT_SEND, CareLink off and no precreated Box/contract fields. It does not itself send mail, make Cal bookings, provision Box/Microsoft, or confirm acceptance.
- Dedicated synthetic Case is HEALTH_CONSULT__STD, KIDUKI_INTERNAL, assigned to an existing READY physician with Cal username. Case activation deliberately skips Box setup in this dedicated preparation route.
- Real later OTP registration and Cal bookings use ordinary external behaviors. Demo markers do not globally suppress every future mail or workspace. Runbook explicitly says actual bookings retain normal downstream workspace and notifications.
- Preparation returns NOT_VERIFIED; booking completion, webhook, Doctor/Company readback and actual mail receipt must be separate evidence.
- Sources: API/src/functions/opsDemoCase.ts:30-45,51-85,190-244; API/docs/runbooks/synthetic_demo_company.md:23-25,40-56.

## Existing tests inspected, not executed in this read-only task

- `API/test/companyRegistration.test.ts`: OTP, OIDC, cross-company email boundary, PACK/SPOT scope/invitation preservation.
- `API/test/fullCompanySelfService.test.ts`: FULL company tenant-bound creation, activation/Series access, employee upsert, audit.
- `API/test/caseosCompanyInformationBoundary.test.ts`: Company projection; Doctor cannot edit Company decision; TK-DO clinical fields stay OH-only; company PDF model excludes raw clinical values.
- `API/test/bookingIntakePolicy.test.ts`: required/optional/reminder distinctions.
- `API/test/opinionLetterBoxVersioning.test.ts`: stable Box version, one successful target, bounded repair backoff, pinned bytes.
- `API/test/opinionLetterRepairSource.test.ts`: exact delivered-byte repair; no rerender; missing/hash-mismatched source refused.
- `API/test/opinionLetterRepairLifecycle.test.ts:187,256`: previously unsent letter delivered once after repair; already delivered letter not sent twice.
- `API/test/deliverableReceiptPolicy.test.ts`: explicit 72h policy.
- `API/test/followupReconciliationWorker.test.ts`: persisted pending marker and scheduled idempotent worker.
- `API/test/opsDemoCompanies.test.ts`, `opsDemoCase.test.ts`: safe setup identity, no Box in dedicated Case preparation, idempotence, role/tenant guards.

## Recorded past live evidence, deliberately not current proof

Root `docs/operations/CASETRA_LAUNCH_READINESS_2026-09-15.md:49-76` records API `47aa98c4ea5a3ba6a290e0257d994dcb3aa7b1ca`, Portal `ca77688c320202a46567960d568327ec069eef3f`, API deployment run `34927694842`, Portal deployment `34918370053`, Portal smoke `34918848334`, synthetic Company acceptance `34926180994`, whole-system read audit `34928347740`. It records registration/OIDC/tenant boundaries/FULL Case/Series/company decision/cleanup. It records SendGrid HTTP202 + message ID, while inbox arrival/authentication headers and human acceptance remained unconfirmed in that dated report.

This report predates the current 2026-10-06 SHAs and cannot establish the current opinion-letter inbox journey. No customer state is inferred from the old counts.

### Current verification reported by the root auditor during this task

- Root auditor independently verified Azure subscription 1 / rg-kiduki-consult-dev and current Function feature settings: FEATURE_CAL_SYNC, MAIL_DELIVERY, BOX_PROVISIONING, WEBHOOK_INGEST, ENTRA_PROVISIONING all true. HEALTH_COMPLIANCE_ENGINE absent and source default false.
- Live API /version matches c5c8af0; API deployment run 37405677512 succeeded.
- Portal deployment run 37385638601 succeeded at bcbe12d; an exposed Portal live SHA was not found.
- Actual delivery to an email inbox remains unverified in this task. Thus the theoretical mail-delivery-OFF condition described above is not the verified current flag state.
- These observations were supplied by the root auditor, not obtained by this subagent from production configuration.

## Plain current-state account

The automatic opinion-letter generation and email-distribution mechanism is already part of Casetra. Company-contact authentication, employee registration, Case preparation, booking association, material receipt monitoring, doctor record entry, physician output, opinion delivery, receipt tracking, company decision and follow-up Case handling all have existing source implementations. Their triggers and role boundaries differ, and the source-detected Company postprocessing permission mismatch and notification-only retry limit are recorded above. No new-service proposal is made in this audit.
