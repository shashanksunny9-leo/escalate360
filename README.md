# Escalate360 — Service First Escalation Experience

A Next.js / TypeScript prototype designed to be stored in GitHub and deployed on Vercel. No separate backend hosting is required for the prototype. The Next.js API route runs as a Vercel serverless function.

## User journey
1. A colleague opens an existing incident in ServiceNow Service First / Employee Center and sees the **Escalate** button.
2. The launch link passes the incident number and preferably the ServiceNow `sys_id` to the Vercel app as URL context (for example `https://your-app.vercel.app/?incident_number=INC0012345&sys_id=<record_sys_id>`).
3. The page automatically retrieves and displays the incident number and context. The incident number is read-only; the colleague does not select or retype it.
4. The colleague enters the issue category, business impact, affected-user count, ability to work, and issue description.
5. The rule engine derives a suggested priority from the colleague's answers; the colleague does not directly choose or override priority.
5. The policy engine checks eligibility.
6. If not yet eligible, the colleague can submit a chaser request to the assigned resolver group.
7. If eligible, the colleague can submit an escalation request.
8. In a configured ServiceNow integration, the server-side API forwards the request to the organisation's approved Scripted REST API. ServiceNow should create the escalation task and return its reference.

## Classification and escalation policy

### P1 — Critical
Critical / major incident conditions must follow the organisation's approved Major Incident Management (MIM) process immediately. Do not wait for the standard timer. The current prototype keeps P1 as an incident-derived priority in its sample data; a production ServiceNow incident lookup must supply the authoritative priority.

### P2 — High
- Financial / monetary loss
- Reputational loss or damage
- Colleague unable to work / non-operational
- New joiner unable to start work
- Risk, compliance or litigation exposure
- Multiple users affected

Escalation eligible after 48 elapsed hours from incident creation, if the incident remains unresolved. Before 48 hours, a chaser can be submitted to the assigned resolver group.

### P3 — Medium
- Application access or functionality issue
- Software installation
- Outlook / Teams issue
- Single-user issue where work can continue
- Hardware issue
- Request provisioning
- Service portal issue
- Network connectivity issue where work can continue / workaround exists
- OneDrive / shared drive / home drive issue

Escalation eligible after 48 elapsed hours from incident creation, if the incident remains unresolved. Before 48 hours, a chaser can be submitted to the assigned resolver group.

### P4 — Low
- Data / M-query assistance
- General how-to / information request
- Non-productivity-impacting issue where the colleague can fully work

Escalation eligible only after the configured incident SLA has elapsed, if the incident remains unresolved. Before SLA expiry, a chaser can be submitted.

**Important:** Category-to-priority mapping is a suggested classification based on the business rules supplied. Your ITSM owner must approve it. If the colleague's answers indicate a higher impact (e.g. multiple users, no ability to work, financial loss or risk), the production rules should apply the highest qualifying priority rather than allowing a lower category to override it.

## ServiceNow system-of-record design

The production design should keep ServiceNow as the system of record:

- Service First displays the Escalate entry point. The ServiceNow Service Portal / Employee Center administrator must add the button or widget and pass the authenticated user's identity and source incident number to this app.
- The app retrieves authoritative incident details from ServiceNow using the passed `sys_id` (preferred) or incident number. The incident number is displayed read-only and is not a colleague-entered field. The sample incident list is only for demonstration.
- The incident-context API should return `number`, `sysId`, `shortDescription`, `priority` (one of `P1 - Critical`, `P2 - High`, `P3 - Medium`, `P4 - Low`), `ageHours`, `slaHours`, `assignmentGroup`, and `status`. The server route normalizes ServiceNow snake_case or camelCase response properties.
- The Next.js `/api/escalations` route is the server-side integration boundary. It never exposes the ServiceNow token to the browser.
- The organisation should implement an approved ServiceNow Scripted REST API at the configured path. It must validate the caller and source incident, re-check incident state/priority/age/SLA, enforce idempotency, create a separate escalation task in the approved task table, set the parent/source incident reference, assign it to the configured Escalation Management group, and return the task number/sys_id.
- The Escalation Management group then owns coordination, contacts the assigned resolver group based on urgency, records acknowledgements/work notes, and updates the task in ServiceNow.
- Acknowledgements and status updates must be written to ServiceNow, not only to this front-end. Configure ServiceNow notifications / events to update the colleague through approved channels.
- Use OAuth 2.0 or the organisation's approved authentication, a least-privilege integration identity, ACLs, audit records, rate limiting, input validation and idempotency keys.
- Do not put credentials in GitHub, client-side code, or a public environment variable.

## Integration payload contract

The Next.js API sends the following fields to the organisation's Scripted REST API:
- `action`: `chaser`, `escalation` or `status_update`
- `incident_sys_id`: ServiceNow source incident sys_id
- `source`: `Escalate360`
- `incident_number`
- `issue_category`
- `suggested_priority`
- `requested_by`, `requester_email`
- `description`, `business_impact`
- `users_affected`, `workaround`, `contact_preference`
- `incident_age_hours`, `sla_hours`
- `current_assignment_group`, `eligibility_rule`
- `requested_at`

The ServiceNow endpoint should return JSON containing at least `reference` or `task_number` (and ideally `sys_id`).

For `action=chaser`, the ServiceNow endpoint should create a chaser / communication record or trigger the approved notification to the incident's current assignment group and add a work note to the source incident. It should return a chaser reference.

For `action=escalation`, the endpoint should create a separate escalation task, set its assignment group to the Escalation Management group, relate it to the source incident, and return the new task reference. Do not assign the new task directly to the resolver group if the agreed operating model is that the central escalation team coordinates with resolver teams.

For `action=status_update`, the endpoint should locate the escalation task by `task_reference`, update its state from `task_status`, append `work_note` to the task activity / work notes, record the authenticated actor and timestamp, and trigger the organisation's approved colleague notification. This supports acknowledgements and ongoing updates being written to ServiceNow rather than kept only in the portal.

## GitHub + Vercel setup
1. Extract this ZIP.
2. Create a GitHub repository and upload the contents of the `escalate360` folder (including `app`, `lib`, `package.json`, `tsconfig.json`, `next.config.mjs`).
3. In Vercel, import the repository. Framework preset: Next.js. No extra build command is required; use `npm run build`.
4. Deploy. The prototype works with `SERVICENOW_INTEGRATION_ENABLED=false`; requests return demo references and do not send real messages or create ServiceNow records.
5. To enable integration later, obtain the approved ServiceNow Scripted REST API and configure the environment variables below in Vercel Project Settings → Environment Variables. Do not enable until the endpoint is implemented and tested in a non-production ServiceNow instance.

## Vercel environment variables (server-side only)
- `SERVICENOW_INCIDENT_CONTEXT_API_PATH=/api/your_scope/escalation/v1/incident-context`
- `SERVICENOW_INTEGRATION_ENABLED=true`
- `SERVICENOW_INSTANCE_URL=https://your-instance.service-now.com`
- `SERVICENOW_ESCALATION_API_PATH=/api/your_scope/escalation/v1/request`
- `SERVICENOW_BEARER_TOKEN=...` (secret; store only in Vercel)

The API contract in this prototype assumes a bearer token supplied by a secure token-management process. For production, prefer OAuth token refresh / managed credentials and do not use a long-lived token pasted into source control.

## What is intentionally not live in this prototype
- ServiceNow authentication / incident lookup
- ServiceNow Scripted REST API implementation and table mapping
- Actual email / Teams / ServiceNow notifications
- Live acknowledgement/status sync from ServiceNow to this UI
- Persistent cross-user database and authenticated employee identity
- Real SLA calendar calculation (prototype thresholds use elapsed calendar hours)
- Real ServiceNow incident context when integration is disabled; use the sample incident only for local/demo testing

These require your ServiceNow administrators and organisation security team. The UI and server-side API boundary are provided so you can connect them without exposing secrets or putting credentials in GitHub.

## Local development
- Install Node.js LTS
- `npm install`
- `npm run dev`
- Open `http://localhost:3000`

## Build
- `npm run build`


## Auto-populated incident context and priority derivation
- The Service First launch button should pass `incident_number` and preferably `sys_id` as query parameters to the Vercel app. Example: `https://your-app.vercel.app/?incident_number=INC0012345&sys_id=<sys_id>`.
- The page retrieves the incident from `/api/incident-context`; the incident number is displayed read-only. It is not a dropdown and is not entered by the colleague.
- If launched without incident context, the app falls back to a clearly labelled demo incident for testing. In production, disable demo fallback and require valid ServiceNow context.
- Colleagues enter issue category, number of colleagues affected, whether they can work, description and business impact.
- High category or high-impact answers (multiple colleagues / team / business-wide, or unable to work) result in P2 High. Medium categories remain P3 Medium when no high-impact override applies. Low guidance / data help remains P4 Low when the colleague can fully work.
- P1 Critical is retained when ServiceNow identifies the source incident as critical and must follow the approved MIM process.
- The final production priority must be validated server-side against the organisation's approved impact/urgency matrix and authoritative ServiceNow data. Never trust a browser-supplied priority as the sole basis for task creation.
