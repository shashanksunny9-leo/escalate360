export type Priority = 'P1 - Critical' | 'P2 - High' | 'P3 - Medium' | 'P4 - Low';
export type Incident = {
  number: string; shortDescription: string; priority: Priority; ageHours: number;
  slaHours: number; businessImpact: string; assignmentGroup: string; status: string;
};
export type Escalation = {
  id: string; taskNumber: string; incidentNumber: string; requester: string;
  requesterRole: string; priority: Priority; reason: string; impact: string;
  status: 'Open' | 'Acknowledged' | 'In Progress' | 'Resolved'; createdAt: string;
};
export type IssueCategory = {
  id: string; label: string; priority: Exclude<Priority, 'P1 - Critical'>; description: string;
};

export const issueCategories: IssueCategory[] = [
  { id:'financial_loss', label:'Financial / monetary loss', priority:'P2 - High', description:'Actual or likely financial loss, revenue impact or monetary exposure.' },
  { id:'reputation', label:'Reputational loss or damage', priority:'P2 - High', description:'Issue may damage the organisation’s reputation, client confidence or market standing.' },
  { id:'non_operational', label:'Colleague unable to work / non-operational', priority:'P2 - High', description:'A colleague cannot perform their role or business-critical work.' },
  { id:'new_joiner', label:'New joiner unable to start work', priority:'P2 - High', description:'A new joiner cannot become operational due to a technology or access issue.' },
  { id:'risk_litigation', label:'Risk, compliance or litigation exposure', priority:'P2 - High', description:'Potential risk, control, compliance, legal or litigation implications.' },
  { id:'multiple_users', label:'Multiple users affected', priority:'P2 - High', description:'An issue affects multiple colleagues, a team, location or business function.' },
  { id:'app_access', label:'Application access issue', priority:'P3 - Medium', description:'Colleague can work but cannot access a specific application or function.' },
  { id:'app_functionality', label:'Application functionality issue', priority:'P3 - Medium', description:'Application feature or function is not working as expected, but work can continue.' },
  { id:'software_install', label:'Software installation issue', priority:'P3 - Medium', description:'Installation or configuration of standard software is required.' },
  { id:'outlook_teams', label:'Outlook / Teams issue', priority:'P3 - Medium', description:'Email, calendar, messaging, meetings or collaboration functionality issue.' },
  { id:'single_user', label:'Single-user issue', priority:'P3 - Medium', description:'An issue affecting one colleague who can continue working with some limitation.' },
  { id:'hardware', label:'Hardware issue', priority:'P3 - Medium', description:'Laptop, monitor, peripheral or other endpoint hardware issue.' },
  { id:'provisioning', label:'Request provisioning issue', priority:'P3 - Medium', description:'Standard access, entitlement or service provisioning request issue.' },
  { id:'portal', label:'Portal issue', priority:'P3 - Medium', description:'Internal service portal or request portal issue.' },
  { id:'network', label:'Network connectivity issue', priority:'P3 - Medium', description:'Network, Wi-Fi or VPN issue where work can continue or use a workaround.' },
  { id:'drives', label:'OneDrive / shared drive / home drive issue', priority:'P3 - Medium', description:'File storage, synchronisation, mapped drive or shared drive issue.' },
  { id:'data_query', label:'Data / M-query assistance', priority:'P4 - Low', description:'Help, guidance or query support that does not affect daily productivity.' },
  { id:'how_to', label:'General how-to / information request', priority:'P4 - Low', description:'User can fully work and only needs guidance or information.' },
  { id:'non_productivity', label:'Non-productivity-impacting issue', priority:'P4 - Low', description:'Issue does not prevent work or materially affect daily productivity.' }
];

export const incidents: Incident[] = [
  { number:'INC0012345', shortDescription:'Unable to access global payments application', priority:'P2 - High', ageHours:31, slaHours:48, businessImpact:'Revenue impacting', assignmentGroup:'Payments Application Support', status:'In Progress' },
  { number:'INC0012346', shortDescription:'Intermittent VPN connectivity for remote users', priority:'P3 - Medium', ageHours:52, slaHours:48, businessImpact:'Productivity impact', assignmentGroup:'End User Computing', status:'In Progress' },
  { number:'INC0012347', shortDescription:'Critical trading platform unavailable', priority:'P1 - Critical', ageHours:1, slaHours:4, businessImpact:'Critical business service', assignmentGroup:'Trading Technology', status:'In Progress' },
  { number:'INC0012348', shortDescription:'Access request pending approval', priority:'P4 - Low', ageHours:72, slaHours:96, businessImpact:'Individual user impact', assignmentGroup:'Identity & Access', status:'On Hold' },
  { number:'INC0012349', shortDescription:'Month-end reporting batch delayed', priority:'P2 - High', ageHours:18, slaHours:48, businessImpact:'Time-critical business process', assignmentGroup:'Data Operations', status:'In Progress' }
];

export type Chaser = {
  id:string; incidentNumber:string; assignmentGroup:string; requester:string;
  message:string; createdAt:string; status:'Queued (demo)';
};

export function evaluateEscalation(incident: Incident) {
  if (incident.status === 'Resolved' || incident.status === 'Closed') {
    return { eligible:false, canChase:false, thresholdHours:0, message:'This incident is resolved or closed. A new escalation cannot be raised.', rule:'Resolved / closed' };
  }
  if (incident.priority === 'P1 - Critical') {
    return { eligible:true, canChase:false, thresholdHours:0, message:'Critical priority: follow the approved Major Incident Management process immediately.', rule:'P1 immediate MIM route' };
  }
  const thresholdHours = incident.priority === 'P4 - Low' ? incident.slaHours : 48;
  const eligible = incident.ageHours >= thresholdHours;
  const remainingHours = Math.max(0, thresholdHours - incident.ageHours);
  if (eligible) {
    return {
      eligible:true, canChase:false, thresholdHours, remainingHours:0,
      message:incident.priority === 'P4 - Low'
        ? `The configured ${incident.slaHours}-hour SLA has elapsed. This low-priority incident is eligible for escalation.`
        : `${incident.priority} has reached the 48-hour waiting period. This incident is eligible for escalation.`,
      rule:incident.priority === 'P4 - Low' ? 'P4 after SLA elapsed' : 'P2/P3 after 48 hours'
    };
  }
  return {
    eligible:false, canChase:true, thresholdHours, remainingHours,
    message:incident.priority === 'P4 - Low'
      ? `Low-priority issues can be escalated only after the SLA has elapsed. ${remainingHours} hours remain against the ${incident.slaHours}-hour SLA. You can send a chaser to ${incident.assignmentGroup}.`
      : `${incident.priority} issues can be escalated after 48 hours. ${remainingHours} hours remain. You can send a chaser to ${incident.assignmentGroup} now.`,
    rule:incident.priority === 'P4 - Low' ? 'Chaser before SLA elapsed' : 'Chaser before 48 hours'
  };
}
