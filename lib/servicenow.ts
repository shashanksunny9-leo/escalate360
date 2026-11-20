import type { Escalation } from './rules';

/** Prototype adapter. Replace with a server-side ServiceNow integration after approval.
 * Never expose ServiceNow credentials in browser code or commit secrets to GitHub.
 */
export async function createServiceNowEscalationTask(task: Escalation) {
  if (process.env.SERVICENOW_INTEGRATION_ENABLED !== 'true') {
    return { mode: 'prototype', externalReference: `MOCK-${task.taskNumber}`, message: 'Saved in the prototype task register. No ServiceNow record was created.' };
  }
  // Implement a server-side call to your approved Scripted REST API here.
  // Use OAuth / approved credentials, least-privilege access, validation and idempotency.
  throw new Error('ServiceNow integration is not configured. Add the approved server-side API adapter before enabling it.');
}
