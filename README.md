# Escalate360 — Intelligent Escalation Management Prototype

## Stack
- Next.js / React / TypeScript
- GitHub for source control
- Vercel for hosting
- Browser localStorage for demo task and chaser persistence
- No external database or live ServiceNow integration in this prototype

## Priority classification matrix

The requester selects the issue category. The prototype derives the priority from the selected category; it does not allow the requester to freely override the classification.

### P1 — Critical
Critical incidents remain on the immediate, approved Major Incident Management route. This is retained as a safety/operational exception and is not delayed by the P2/P3/P4 waiting rules.

### P2 — High
- Financial / monetary loss
- Reputational loss or damage
- Colleague unable to work / non-operational
- New joiner unable to start work
- Risk, compliance or litigation exposure
- Multiple users affected

Escalation eligibility: after 48 elapsed hours from incident creation, if the incident remains unresolved.

### P3 — Medium
- Application access issue
- Application functionality issue
- Software installation issue
- Outlook / Teams issue
- Single-user issue where the colleague can continue working with limitation
- Hardware issue
- Request provisioning issue
- Portal issue
- Network connectivity issue where work can continue or use a workaround
- OneDrive / shared drive / home drive issue

Escalation eligibility: after 48 elapsed hours from incident creation, if the incident remains unresolved.

### P4 — Low
- Data / M-query assistance
- General how-to / information request
- Non-productivity-impacting issue where the user can fully work

Escalation eligibility: only after the incident's configured SLA duration has elapsed and the incident remains unresolved.

## Chaser behaviour
- Before P2/P3 48-hour eligibility, the requester can record a chaser for the assigned support group.
- Before P4 SLA expiry, the requester can record a chaser for the assigned support group.
- The prototype stores chasers in localStorage and displays them in the task register.
- Chasers are simulated only: no email, Teams message, webhook or ServiceNow notification is actually sent.
- Duplicate chasers are blocked per incident in this demo.

## Demo incident data
The sample incident list contains illustrative incident ages, priorities, assignment groups and SLA durations. Replace these with live ServiceNow data during integration.

## Run locally
1. Install Node.js LTS.
2. Extract the ZIP.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

## Deploy using GitHub + Vercel
1. Push the extracted project to a GitHub repository.
2. Import the repository into Vercel.
3. Deploy using the Next.js framework preset.
4. No environment variables are required for the demo.

## Production integration requirements
Before production use, add authenticated user identity/roles, a shared database, server-side rule validation, audit logging, notification delivery, ServiceNow API integration, and approved security controls. Do not expose ServiceNow credentials in browser code or GitHub.

## Policy decisions to confirm
- Whether the 48-hour clock is calendar hours or business hours. This prototype uses elapsed calendar hours.
- The exact SLA clock definition and applicable SLA duration for P4 incidents.
- Whether P1 incidents are always routed through MIM.
- Whether the organisation's ServiceNow priority labels and impact/urgency mapping align with this illustrative category-to-priority matrix.


## TypeScript priority consistency
The canonical priority literals are `P1 - Critical`, `P2 - High`, `P3 - Medium`, and `P4 - Low`.
Use `P3 - Medium` consistently in sample records and application code. Avoid the legacy literal `P3 - Moderate`.
