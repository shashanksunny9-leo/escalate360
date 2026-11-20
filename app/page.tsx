'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, Bell, CheckCircle2, Clock3, FileText, Headphones, Info, LifeBuoy, ShieldCheck, Users, Zap } from 'lucide-react';
import { issueCategories, type Priority } from '@/lib/rules';

type IncidentPreview = {
  number: string; sysId?: string; shortDescription: string; priority: Priority; ageHours: number;
  slaHours: number; assignmentGroup: string; status: string;
};

const demoIncidents: IncidentPreview[] = [
  { number:'INC0012345', shortDescription:'Unable to access global payments application', priority:'P2 - High', ageHours:31, slaHours:48, assignmentGroup:'Payments Application Support', status:'In Progress' },
  { number:'INC0012346', shortDescription:'Intermittent VPN connectivity for remote users', priority:'P3 - Medium', ageHours:52, slaHours:48, assignmentGroup:'End User Computing', status:'In Progress' },
  { number:'INC0012347', shortDescription:'Critical trading platform unavailable', priority:'P1 - Critical', ageHours:1, slaHours:4, assignmentGroup:'Trading Technology', status:'In Progress' },
  { number:'INC0012348', shortDescription:'Access request pending approval', priority:'P4 - Low', ageHours:72, slaHours:96, assignmentGroup:'Identity & Access', status:'On Hold' },
  { number:'INC0012349', shortDescription:'Month-end reporting batch delayed', priority:'P2 - High', ageHours:18, slaHours:48, assignmentGroup:'Data Operations', status:'In Progress' }
];

function ruleFor(priority: Priority, ageHours: number, slaHours: number) {
  if (priority === 'P1 - Critical') return { eligible:true, threshold:0, remaining:0, title:'Immediate MIM route', detail:'Critical incidents must follow the approved Major Incident Management process immediately. This portal will direct the request to the configured escalation team; follow your organisation’s MIM procedure.' };
  const threshold = priority === 'P4 - Low' ? slaHours : 48;
  const eligible = ageHours >= threshold;
  return {
    eligible, threshold, remaining:Math.max(0, threshold-ageHours),
    title:priority === 'P4 - Low' ? 'Escalation after SLA expiry' : 'Escalation after 48 hours',
    detail:eligible
      ? (priority === 'P4 - Low' ? `The configured ${slaHours}-hour SLA has elapsed. The issue is eligible for escalation if still unresolved.` : 'The 48-hour waiting period has elapsed. The issue is eligible for escalation if still unresolved.')
      : (priority === 'P4 - Low' ? `This low-priority issue can be escalated only after its ${slaHours}-hour SLA has elapsed. You can send a chaser to the assigned support team now.` : `This issue can be escalated after 48 hours. You can send a chaser to the assigned support team now; escalation becomes eligible after the waiting period if it remains unresolved.`)
  };
}

export default function Home() {
  const [screen,setScreen] = useState<'servicefirst'|'form'|'confirmation'|'support'>('servicefirst');
  const [incident,setIncident] = useState<IncidentPreview>(demoIncidents[0]);
  const [incidentLoading,setIncidentLoading] = useState(true);
  const [incidentContextError,setIncidentContextError] = useState('');
  const [categoryId,setCategoryId] = useState('financial_loss');
  const [requester,setRequester] = useState('');
  const [email,setEmail] = useState('');
  const [description,setDescription] = useState('');
  const [businessImpact,setBusinessImpact] = useState('');
  const [usersAffected,setUsersAffected] = useState('One colleague');
  const [workaround,setWorkaround] = useState('Partially operational');
  const [contactPreference,setContactPreference] = useState('Email');
  const [reference,setReference] = useState('');
  const [supportTaskRef,setSupportTaskRef] = useState('');
  const [supportStatus,setSupportStatus] = useState('Acknowledged');
  const [supportNote,setSupportNote] = useState('');
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);
  const [lastAction,setLastAction] = useState<'chaser'|'escalation'|null>(null);

  const [launchContext,setLaunchContext] = useState<{incidentNumber?:string;sysId?:string}>({});
  useEffect(()=>{
    const params = new URLSearchParams(window.location.search);
    const incidentNumber = params.get('incident_number') || params.get('incident') || undefined;
    const sysId = params.get('sys_id') || undefined;
    setLaunchContext({incidentNumber,sysId});
    if (!incidentNumber && !sysId) {
      setIncident(demoIncidents[0]);
      setIncidentLoading(false);
      setIncidentContextError('Demo mode: no ServiceNow incident context was passed. The sample incident below is for testing only.');
      return;
    }
    const query = new URLSearchParams();
    if (incidentNumber) query.set('incident_number',incidentNumber);
    if (sysId) query.set('sys_id',sysId);
    fetch(`/api/incident-context?${query.toString()}`)
      .then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to retrieve incident context.');return d})
      .then(d=>{setIncident(d.incident);setIncidentContextError('')})
      .catch(e=>setIncidentContextError(e instanceof Error?e.message:'Unable to retrieve incident context.'))
      .finally(()=>setIncidentLoading(false));
  },[]);
  const category = issueCategories.find(x=>x.id===categoryId) || issueCategories[0];
  const highImpactOverride = usersAffected !== 'One colleague' || workaround === 'Unable to work';
  const priority: Priority = incident.priority === 'P1 - Critical' ? 'P1 - Critical' : (category.priority === 'P2 - High' || highImpactOverride ? 'P2 - High' : category.priority);
  const rule = ruleFor(priority,incident.ageHours,incident.slaHours);

  const priorityDescription = useMemo(()=>({
    'P1 - Critical':'Immediate critical incident / Major Incident Management route.',
    'P2 - High':'Financial, reputational, risk or litigation exposure; colleague unable to work; new joiner unable to start; or multiple users affected.',
    'P3 - Medium':'Colleague can work but has a technology issue affecting an application, collaboration tool, endpoint, network, drive, portal or provisioning.',
    'P4 - Low':'Colleague can fully work and needs guidance, data / M-query help or assistance with a non-productivity-impacting issue.'
  } as Record<Priority,string>)[priority],[priority]);

  async function submitSupportUpdate() {
    setNotice('');
    if (!supportTaskRef.trim() || !supportNote.trim()) {
      setNotice('Enter the ServiceNow escalation task reference and an acknowledgement / work note.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/escalations', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({action:'status_update', taskReference:supportTaskRef, taskStatus:supportStatus, workNote:supportNote})
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to update escalation task.');
      setReference(data.reference || supportTaskRef);
      setLastAction('escalation');
      setNotice(data.message || 'Update submitted.');
      setSupportNote('');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Unable to submit the ServiceNow update.');
    } finally { setBusy(false); }
  }

  async function submit(action:'chaser'|'escalation') {
    setNotice('');
    if (!requester.trim() || !email.trim() || !description.trim()) {
      setNotice('Please complete your name, work email and issue description.'); return;
    }
    if (action==='escalation' && !rule.eligible) {
      setNotice('This incident has not reached its escalation eligibility threshold. Please send a chaser instead.'); return;
    }
    if (action==='chaser' && !rule.eligible && priority==='P1 - Critical') {
      setNotice('Critical issues must follow the approved Major Incident Management route.'); return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/escalations', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          action, incidentNumber:incident.number, incidentSysId:incident.sysId || launchContext.sysId, category:category.label, priority,
          requester, requesterEmail:email, description, businessImpact, usersAffected,
          workaround, contactPreference, incidentAgeHours:incident.ageHours,
          slaHours:incident.slaHours, assignmentGroup:incident.assignmentGroup,
          rule:rule.title
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to submit request.');
      setReference(data.reference || data.taskNumber || 'Submitted');
      setLastAction(action);
      setScreen('confirmation');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally { setBusy(false); }
  }

  return <main className="app-shell">
    <header className="top-header">
      <div className="brand"><div className="brand-icon"><LifeBuoy size={23}/></div><div><strong>Service First</strong><span>Colleague support</span></div></div>
      <div className="header-right"><span className="secure-label"><ShieldCheck size={15}/> Secure support journey</span><button className="text-link" onClick={()=>setScreen('support')}>IT Support workspace <ArrowRight size={15}/></button></div>
    </header>

    {screen==='servicefirst' && <section className="landing">
      <div className="hero-copy"><div className="eyebrow">SERVICE FIRST • COLLEAGUE EXPERIENCE</div><h1>How can we help you today?</h1><p>Get support for an existing technology issue. If you need additional attention, use the guided escalation process so the right team can review it.</p>
        <div className="launch-card"><div className="launch-icon"><AlertTriangle size={25}/></div><div className="launch-text"><h2>Need to escalate an existing incident?</h2><p>Your incident details are brought in automatically. Tell us about the business impact and we’ll guide you through the appropriate next step.</p></div><button className="primary-button" onClick={()=>setScreen('form')}>Escalate <ArrowRight size={17}/></button></div>
        <div className="landing-foot"><span><ShieldCheck size={16}/> Priority is suggested from your answers</span><span><Clock3 size={16}/> Eligibility rules are checked before submission</span></div>
      </div>
      <div className="side-illustration"><div className="illustration-orbit"><div className="orbit-center"><Headphones size={42}/></div><div className="orbit-node node-one"><Bell size={20}/></div><div className="orbit-node node-two"><CheckCircle2 size={20}/></div><div className="orbit-node node-three"><Users size={20}/></div></div><h3>One simple route to resolution</h3><p>Clear updates, accountable ownership and the right level of attention.</p></div>
    </section>}

    {screen==='form' && <section className="form-page">
      <button className="back-link" onClick={()=>setScreen('servicefirst')}><ArrowLeft size={16}/> Back to Service First</button>
      <div className="form-heading"><div className="eyebrow">GUIDED ESCALATION</div><h1>Tell us what’s happening</h1><p>We’ll assess the business impact and apply the escalation policy. Please use this for an existing incident.</p></div>
      <div className="form-grid">
        <div className="form-main">
          <section className="form-card">
            <div className="section-heading"><span className="section-number">01</span><div><h2>Incident details</h2><p>Your incident is automatically identified from the ServiceNow page you came from.</p></div></div>
            <label>ServiceNow incident number <span className="auto-tag">AUTO-POPULATED</span></label>
            <div className="auto-incident-field"><FileText size={17}/><strong>{incidentLoading?'Loading incident…':incident.number}</strong><span>Read only</span></div>
            <div className="incident-summary"><div><span>Current incident</span><strong>{incident.number}</strong><p>{incident.shortDescription}</p></div><div className="summary-meta"><span>{incident.status}</span><span>{incident.ageHours} hours old</span><span>{incident.assignmentGroup}</span><span>SLA: {incident.slaHours} hours</span></div></div>
            {incidentContextError&&<div className="inline-alert"><Info size={16}/>{incidentContextError}</div>}
          </section>

          <section className="form-card">
            <div className="section-heading"><span className="section-number">02</span><div><h2>What best describes the issue?</h2><p>Select the closest match. Priority is derived from your issue category and business impact answers. Higher-impact answers take precedence.</p></div></div>
            <label>Issue category</label>
            <select value={categoryId} onChange={e=>setCategoryId(e.target.value)}>{issueCategories.map(c=><option key={c.id} value={c.id}>{c.priority} — {c.label}</option>)}</select>
            <div className={`priority-card ${priority==='P2 - High'?'high':priority==='P3 - Medium'?'medium':priority==='P1 - Critical'?'critical':'low'}`}>
              <div className="priority-top"><span>Suggested priority</span><strong>{priority}</strong></div><p>{priorityDescription}</p>
            </div>
            <div className="field-two"><div><label>How many colleagues are affected?</label><select value={usersAffected} onChange={e=>setUsersAffected(e.target.value)}><option>One colleague</option><option>Multiple colleagues</option><option>Entire team / location</option><option>Business-wide</option></select></div><div><label>Can you continue working?</label><select value={workaround} onChange={e=>setWorkaround(e.target.value)}><option>Unable to work</option><option>Partially operational</option><option>Can work with a workaround</option><option>Fully operational</option></select></div></div>
          </section>

          <section className="form-card">
            <div className="section-heading"><span className="section-number">03</span><div><h2>Business impact and contact details</h2><p>Help the escalation team understand urgency and contact you.</p></div></div>
            <label>Your name</label><input value={requester} onChange={e=>setRequester(e.target.value)} placeholder="Enter your name"/>
            <label>Work email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@company.com"/>
            <label>Describe the issue and what you need</label><textarea value={description} onChange={e=>setDescription(e.target.value)} rows={4} placeholder="What happened? What work is affected? What have you tried?"/>
            <label>Business impact (if applicable)</label><textarea value={businessImpact} onChange={e=>setBusinessImpact(e.target.value)} rows={3} placeholder="For example: payment processing delayed, client deadline at risk, colleague unable to perform role..."/>
            <div className="field-two"><div><label>Preferred contact method</label><select value={contactPreference} onChange={e=>setContactPreference(e.target.value)}><option>Email</option><option>Phone</option><option>Teams</option></select></div><div><label>Existing support group</label><input value={incident.assignmentGroup} readOnly/></div></div>
          </section>
          <div className="form-actions"><button className="secondary-button" onClick={()=>setScreen('servicefirst')}>Cancel</button>{rule.eligible ? <button className="primary-button" disabled={busy || incidentLoading || !!incidentContextError && !!(launchContext.incidentNumber || launchContext.sysId)} onClick={()=>submit('escalation')}>{busy?'Submitting…':'Submit escalation'} <ArrowRight size={17}/></button> : <button className="primary-button" disabled={busy || incidentLoading || !!incidentContextError && !!(launchContext.incidentNumber || launchContext.sysId)} onClick={()=>submit('chaser')}>{busy?'Submitting…':'Send chaser to support'} <Bell size={17}/></button>}</div>
          {notice&&<div className="inline-alert"><Info size={17}/>{notice}</div>}
        </div>
        <aside className="form-side">
          <div className="rule-card"><div className="side-card-title"><ShieldCheck size={19}/><h3>Escalation eligibility</h3></div><div className={`eligibility-status ${rule.eligible?'ready':'waiting'}`}>{rule.eligible?'Eligible to escalate':'Chaser available'}</div><h4>{rule.title}</h4><p>{rule.detail}</p>{!rule.eligible&&<div className="countdown"><Clock3 size={17}/><div><strong>{rule.remaining} hours remaining</strong><span>until escalation eligibility</span></div></div>}</div>
          <div className="info-card"><div className="side-card-title"><Users size={19}/><h3>What happens next?</h3></div><ol><li><b>We validate</b><span>Your issue category and incident age are checked.</span></li><li><b>Support is notified</b><span>A chaser goes to the assigned support team when the waiting period has not elapsed.</span></li><li><b>Escalation team takes ownership</b><span>Once eligible, a separate escalation task is routed to the escalation team for coordination.</span></li><li><b>You receive a reference</b><span>Submission acknowledgement and reference are returned.</span></li></ol></div>
          <div className="note-card"><Info size={17}/><span>Critical issues should follow your organisation’s Major Incident Management route immediately. Do not wait for the standard escalation timer.</span></div>
        </aside>
      </div>
    </section>}

    {screen==='confirmation' && <section className="confirmation"><div className="success-icon"><CheckCircle2 size={38}/></div><div className="eyebrow">REQUEST SUBMITTED</div><h1>{lastAction==='chaser'?'Your chaser has been submitted':'Your escalation request has been submitted'}</h1><p>{lastAction==='chaser'?'The assigned support team has been asked to review the incident. This is a prototype acknowledgement unless a ServiceNow integration has been configured.':'The escalation request has been submitted to the configured escalation workflow. The escalation team can coordinate with the assigned support group.'}</p><div className="reference-card"><span>{lastAction==='chaser'?'Request reference':'Escalation reference'}</span><strong>{reference}</strong><small>Keep this reference for future follow-up.</small></div><button className="primary-button" onClick={()=>{setScreen('servicefirst');setNotice('')}}>Return to Service First <ArrowRight size={17}/></button></section>}

    {screen==='support' && <section className="support-page"><button className="back-link" onClick={()=>setScreen('servicefirst')}><ArrowLeft size={16}/> Back to Service First</button><div className="form-heading"><div className="eyebrow">IT SUPPORT WORKSPACE</div><h1>Escalation coordination</h1><p>This view is a prototype placeholder. In production, escalation task acknowledgement and status updates should be performed in ServiceNow by the authorised escalation team.</p></div><div className="support-callout"><Headphones size={28}/><div><h2>ServiceNow remains the system of record</h2><p>The portal should create a dedicated escalation task assigned to the configured Escalation Management group, with a reference to the source incident. The escalation team then coordinates with the incident’s assigned resolver group and updates the task in ServiceNow.</p></div></div>
      <div className="form-card support-update-card"><div className="section-heading"><span className="section-number">01</span><div><h2>Record acknowledgement / progress update</h2><p>In production, this writes the status and work note to the ServiceNow escalation task.</p></div></div>
        <label>ServiceNow escalation task reference</label><input value={supportTaskRef} onChange={e=>setSupportTaskRef(e.target.value)} placeholder="e.g. ESC0012345"/>
        <label>Task status</label><select value={supportStatus} onChange={e=>setSupportStatus(e.target.value)}><option>Acknowledged</option><option>In Progress</option><option>Pending Support Team</option><option>Resolved</option></select>
        <label>Acknowledgement / work note</label><textarea value={supportNote} onChange={e=>setSupportNote(e.target.value)} rows={3} placeholder="Record who has taken ownership, resolver group contacted, next action and next update time."/>
        <button className="primary-button" disabled={busy} onClick={submitSupportUpdate}>{busy?'Submitting…':'Update ServiceNow task'} <ArrowRight size={16}/></button>
        {notice&&<div className="inline-alert"><Info size={17}/>{notice}</div>}
      </div>
      <div className="support-steps"><div><span>01</span><b>Receive task</b><p>Escalation task assigned to the central escalation team.</p></div><div><span>02</span><b>Acknowledge</b><p>Team acknowledges ownership and records the update in ServiceNow.</p></div><div><span>03</span><b>Coordinate</b><p>Engage the resolver group based on urgency and business impact.</p></div><div><span>04</span><b>Update colleague</b><p>Record progress and next update commitment in ServiceNow.</p></div></div></section>}

    <footer className="app-footer"><span>Escalate360 • Service First escalation experience</span><span>Prototype • ServiceNow integration requires organisation configuration</span></footer>
  </main>;
}
