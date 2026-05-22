import { useState } from 'react';
import { Code2, ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import LandingShell from '../components/LandingShell';

const PAGE_CSS = `
/* API docs layout */
.api-wrap{display:grid;grid-template-columns:200px 1fr;gap:40px;max-width:1100px;margin:0 auto;padding:72px 5% 96px;align-items:flex-start}
.api-sidebar{position:sticky;top:88px}
.api-sidebar-label{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--tl);margin-bottom:12px}
.api-group-btn{display:block;width:100%;text-align:left;padding:9px 12px;border-radius:8px;font-size:14px;font-weight:500;color:var(--tm);background:transparent;border:none;cursor:pointer;transition:all .15s;font-family:'DM Sans',sans-serif;margin-bottom:2px}
.api-group-btn:hover{background:rgba(27,67,50,.07);color:var(--forest)}
.api-group-btn.api-active{background:rgba(27,67,50,.1);color:var(--forest);font-weight:700}

/* Endpoint accordion */
.ep-card{border:1px solid rgba(0,0,0,.08);border-radius:14px;overflow:hidden;margin-bottom:12px;transition:box-shadow .2s}
.ep-card:hover{box-shadow:0 4px 18px rgba(27,67,50,.08)}
.ep-head{display:flex;align-items:center;gap:12px;padding:14px 18px;background:#fff;border:none;cursor:pointer;width:100%;text-align:left}
.ep-path{font-family:'JetBrains Mono',Menlo,monospace;font-size:14px;font-weight:600;color:var(--td);flex:1}
.ep-body{border-top:1px solid rgba(0,0,0,.06);padding:20px 20px;background:var(--cream)}
.ep-desc{font-size:14px;color:var(--tm);line-height:1.7;margin-bottom:16px}
.ep-sub{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--tl);margin-bottom:8px}
.param-row{display:grid;grid-template-columns:130px 80px 70px 1fr;gap:10px;padding:9px 14px;border-bottom:1px solid rgba(0,0,0,.05);font-size:13px;align-items:start}
.param-row:last-child{border-bottom:none}

/* Method badges */
.m-GET{background:rgba(34,197,94,.12);color:#16a34a}
.m-POST{background:rgba(27,67,50,.12);color:var(--forest)}
.m-PUT{background:rgba(212,168,83,.15);color:#92400E}
.m-DELETE{background:rgba(239,68,68,.12);color:#dc2626}
.method-badge{font-size:11px;font-weight:800;padding:3px 8px;border-radius:5px;font-family:'JetBrains Mono',monospace;letter-spacing:.5px;flex-shrink:0}

/* Auth badge */
.auth-chip{font-size:11px;color:var(--tl);background:rgba(0,0,0,.05);border:1px solid rgba(0,0,0,.08);border-radius:5px;padding:2px 8px;flex-shrink:0}

/* Code block */
.code-wrap{position:relative;margin-top:10px;margin-bottom:14px;border-radius:12px;overflow:hidden}
.code-pre{background:var(--charcoal);color:#E2E8F0;padding:18px 20px;padding-right:70px;overflow-x:auto;font-size:13px;line-height:1.7;font-family:'JetBrains Mono',Menlo,monospace;margin:0}
.copy-btn{position:absolute;top:10px;right:10px;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:7px;padding:5px 12px;cursor:pointer;display:flex;align-items:center;gap:5px;color:#94A3B8;font-size:12px;transition:all .15s;font-family:'DM Sans',sans-serif}
.copy-btn:hover{background:rgba(255,255,255,.14);color:#fff}

/* Error table */
.error-grid{display:grid;grid-template-columns:auto 1fr;gap:8px 20px;margin-top:14px}
.e-code{font-family:'JetBrains Mono',monospace;font-weight:700;color:#dc2626;font-size:13px;padding-top:1px}
.e-desc{font-size:13px;color:#374151}

@media(max-width:820px){
  .api-wrap{grid-template-columns:1fr}
  .api-sidebar{position:static}
  .param-row{grid-template-columns:1fr 1fr;gap:6px}
}
@media(max-width:500px){
  .param-row{grid-template-columns:1fr}
}
`;

function Method({ type }) {
  return <span className={`method-badge m-${type}`}>{type}</span>;
}

function CopyBtn({ code }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button className="copy-btn" onClick={copy}>
      {copied ? <Check size={12} color="#52B788" /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function CodeBlock({ code }) {
  return (
    <div className="code-wrap">
      <CopyBtn code={code} />
      <pre className="code-pre"><code>{code}</code></pre>
    </div>
  );
}

function Endpoint({ method, path, desc, auth, params, request, response }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ep-card step" style={{ padding: 0, borderRadius: 14, cursor: 'default' }}>
      <button className="ep-head" onClick={() => setOpen(o => !o)}>
        <Method type={method} />
        <code className="ep-path">{path}</code>
        {auth && <span className="auth-chip">🔒 Auth</span>}
        {open ? <ChevronDown size={16} color="var(--tl)" /> : <ChevronRight size={16} color="var(--tl)" />}
      </button>
      {open && (
        <div className="ep-body">
          <p className="ep-desc">{desc}</p>
          {params && (
            <div style={{ marginBottom: 18 }}>
              <div className="ep-sub">Parameters</div>
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,.07)', borderRadius: 10, overflow: 'hidden' }}>
                <div className="param-row" style={{ background: 'rgba(0,0,0,.02)', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--tl)' }}>
                  <span>Name</span><span>Type</span><span>Required</span><span>Description</span>
                </div>
                {params.map(([name, type, req, desc]) => (
                  <div key={name} className="param-row">
                    <code style={{ color: 'var(--forest)', fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{name}</code>
                    <span style={{ color: type === 'string' ? '#16a34a' : '#92400E', fontSize: 12, background: type === 'string' ? 'rgba(34,197,94,.1)' : 'rgba(212,168,83,.15)', borderRadius: 4, padding: '2px 8px', display: 'inline-block' }}>{type}</span>
                    <span style={{ fontSize: 12, color: req ? '#dc2626' : 'var(--tl)' }}>{req ? 'yes' : 'no'}</span>
                    <span style={{ color: 'var(--tm)', lineHeight: 1.5 }}>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {request && <><div className="ep-sub">Request Body</div><CodeBlock code={request} /></>}
          {response && <><div className="ep-sub">Response</div><CodeBlock code={response} /></>}
        </div>
      )}
    </div>
  );
}

const GROUPS = [
  { id: 'auth', label: 'Authentication', desc: 'Register and authenticate users. All protected routes require a Bearer token in the Authorization header.', endpoints: [
    { method: 'POST', path: '/api/auth/register', desc: 'Create a new user account. Role must be one of: tenant, landlord, agent.', auth: false,
      request: `{\n  "name": "Amina Mwangi",\n  "email": "amina@example.com",\n  "phone": "+255762000000",\n  "password": "securepassword",\n  "role": "tenant"\n}`,
      response: `{\n  "success": true,\n  "token": "eyJhbGciOiJIUzI1NiJ9...",\n  "user": { "_id": "64f2a...", "name": "Amina Mwangi", "role": "tenant" }\n}`,
    },
    { method: 'POST', path: '/api/auth/login', desc: 'Authenticate an existing user and receive a JWT token (expires 7 days).', auth: false,
      request: `{ "email": "amina@example.com", "password": "securepassword" }`,
      response: `{ "success": true, "token": "eyJhbGciOiJIUzI1NiJ9...", "user": { "_id": "64f2a...", "role": "tenant" } }`,
    },
    { method: 'GET', path: '/api/auth/me', desc: 'Returns the currently authenticated user\'s profile.', auth: true,
      response: `{ "success": true, "data": { "_id": "64f2a...", "name": "Amina Mwangi", "email": "amina@example.com", "role": "tenant" } }`,
    },
  ]},
  { id: 'properties', label: 'Properties', desc: 'List, browse, create, update, and delete properties. Public browse requires no auth.', endpoints: [
    { method: 'GET', path: '/api/properties', desc: 'Paginated public browse of available properties.', auth: false,
      params: [['page','number',false,'Page number (default 1)'],['limit','number',false,'Per page (default 10, max 50)'],['city','string',false,'Filter by city'],['minPrice','number',false,'Min monthly rent in TZS'],['maxPrice','number',false,'Max monthly rent in TZS']],
      response: `{ "success": true, "data": [...], "total": 42, "page": 1, "pages": 5 }`,
    },
    { method: 'POST', path: '/api/properties', desc: 'Create a property. Accepts multipart/form-data for image upload (field: images, max 10 files).', auth: true,
      request: `// multipart/form-data\ntitle: "3BR House in Mikocheni"\ndescription: "Spacious house with garden"\nprice: 1200000\ncity: "Dar es Salaam"\nbedrooms: 3\nbathrooms: 2\nimages: [File, File]`,
      response: `{ "success": true, "data": { "_id": "64g3b...", "title": "3BR House in Mikocheni", "status": "available" } }`,
    },
    { method: 'PUT', path: '/api/properties/:id', desc: 'Update a property. Only the owning landlord or admin can update.', auth: true,
      params: [['id','string',true,'Property ID']],
      request: `{ "price": 1300000, "status": "unavailable" }`,
      response: `{ "success": true, "data": { "_id": "...", "price": 1300000 } }`,
    },
  ]},
  { id: 'applications', label: 'Applications', desc: 'Tenants apply for properties; landlords review, approve, or reject.', endpoints: [
    { method: 'POST', path: '/api/applications', desc: 'Tenant submits a rental application for a property.', auth: true,
      request: `{\n  "propertyId": "64g3b...",\n  "moveInDate": "2026-07-01",\n  "employmentStatus": "employed",\n  "message": "Long-term tenant looking for a quiet neighbourhood."\n}`,
      response: `{ "success": true, "data": { "_id": "...", "status": "pending" } }`,
    },
    { method: 'GET', path: '/api/applications/received', desc: 'Landlord/agent fetches all applications for their properties.', auth: true,
      response: `{ "success": true, "data": [{ "_id": "...", "status": "pending", "tenant": {...}, "property": {...} }] }`,
    },
    { method: 'PUT', path: '/api/applications/:id/approve', desc: 'Approve an application and auto-create a lease. All other pending apps for the same property are rejected.', auth: true,
      params: [['id','string',true,'Application ID']],
      request: `{ "startDate": "2026-07-01", "endDate": "2027-06-30" }`,
      response: `{ "success": true, "data": { "application": {...}, "lease": { "_id": "...", "status": "active" } } }`,
    },
    { method: 'PUT', path: '/api/applications/:id/reject', desc: 'Reject an application with an optional reason.', auth: true,
      params: [['id','string',true,'Application ID']],
      request: `{ "reason": "Property already rented to another applicant." }`,
      response: `{ "success": true, "data": { "_id": "...", "status": "rejected" } }`,
    },
  ]},
  { id: 'leases', label: 'Leases', desc: 'Manage active and historical lease agreements between landlords and tenants.', endpoints: [
    { method: 'GET', path: '/api/leases/my', desc: 'Tenant fetches their active or most recent lease.', auth: true,
      response: `{ "success": true, "data": { "_id": "...", "status": "active", "startDate": "2026-07-01", "endDate": "2027-06-30", "rentAmount": 850000, "property": {...}, "landlord": {...} } }`,
    },
    { method: 'GET', path: '/api/leases/landlord', desc: 'Landlord/agent fetches all leases for their properties.', auth: true,
      response: `{ "success": true, "data": [{ "_id": "...", "status": "active", "tenant": {...}, "property": {...} }] }`,
    },
    { method: 'PUT', path: '/api/leases/:id/terminate', desc: 'Terminate an active lease. Property is set back to available.', auth: true,
      params: [['id','string',true,'Lease ID']],
      request: `{ "reason": "Mutual agreement — tenant relocating." }`,
      response: `{ "success": true, "data": { "_id": "...", "status": "terminated" } }`,
    },
  ]},
  { id: 'payments', label: 'Payments', desc: 'Rent payments via AzamPay mobile money (M-Pesa, Airtel, Tigopesa) or manual recording.', endpoints: [
    { method: 'POST', path: '/api/payments/generate', desc: 'Generate monthly payment records for a lease. Idempotent — skips months that already exist.', auth: true,
      request: `{ "leaseId": "64h4c..." }`,
      response: `{ "success": true, "created": 12, "skipped": 0 }`,
    },
    { method: 'POST', path: '/api/payments/:id/initiate', desc: 'Initiate mobile money payment via AzamPay STK push. Triggers prompt on tenant phone.', auth: true,
      params: [['id','string',true,'Payment ID']],
      request: `{ "phone": "0762000000", "provider": "mpesa" }`,
      response: `{ "success": true, "data": { "useRealGateway": true, "message": "STK push sent to 0762000000", "paymentId": "..." } }`,
    },
    { method: 'GET', path: '/api/payments/:id/status', desc: 'Poll payment status every 5s after initiating mobile money payment.', auth: true,
      params: [['id','string',true,'Payment ID']],
      response: `{ "success": true, "data": { "status": "paid", "paidDate": "2026-05-18T10:30:00Z", "paymentMethod": "mpesa" } }`,
    },
  ]},
  { id: 'maintenance', label: 'Maintenance', desc: 'Tenants submit maintenance requests; landlords update status through the workflow.', endpoints: [
    { method: 'POST', path: '/api/maintenance', desc: 'Tenant submits a new maintenance request.', auth: true,
      request: `{ "title": "Leaking roof in bedroom", "description": "Water dripping from a ceiling crack when it rains.", "priority": "high" }`,
      response: `{ "success": true, "data": { "_id": "...", "status": "open" } }`,
    },
    { method: 'GET', path: '/api/maintenance', desc: 'Fetch maintenance requests for the authenticated user (scoped by role).', auth: true,
      response: `{ "success": true, "data": [{ "_id": "...", "status": "in_progress", "title": "..." }] }`,
    },
    { method: 'PUT', path: '/api/maintenance/:id', desc: 'Update request status. Landlord/agent only.', auth: true,
      params: [['id','string',true,'Request ID']],
      request: `{ "status": "in_progress", "notes": "Contractor scheduled for 20 May 2026." }`,
      response: `{ "success": true, "data": { "_id": "...", "status": "in_progress" } }`,
    },
  ]},
];

const STATUS_ENUMS = [
  ['Property', 'available | occupied | unavailable'],
  ['Application', 'pending | approved | rejected'],
  ['Lease', 'active | expired | terminated'],
  ['Payment', 'pending | paid | overdue | waived'],
  ['Maintenance', 'open | in_progress | resolved | closed'],
];

export default function ApiDocs() {
  const [group, setGroup] = useState('auth');
  const current = GROUPS.find(g => g.id === group);

  return (
    <LandingShell animateSelectors=".ep-card">
      <style>{PAGE_CSS}</style>

      {/* HERO */}
      <section className="phero">
        <div className="phero-bg" />
        <div className="phero-ov" />
        <div className="phero-c">
          <div className="hero-badge"><Code2 size={13} /> REST API</div>
          <h1 className="hero-title">API<br /><em>Documentation</em></h1>
          <p className="hero-sub">Integrate RentEase into your own systems. RESTful JSON API — same endpoints used by our web and mobile clients.</p>
          <div style={{ marginTop: 28, display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: '10px 20px' }}>
            <code style={{ color: 'var(--mint)', fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}>
              https://api.rentease.co.tz/api
            </code>
          </div>
        </div>
      </section>

      {/* AUTH NOTICE — same style as Home's eyebrow sections */}
      <section style={{ background: 'var(--cream)', padding: '36px 5% 0' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', gap: 14, background: '#fff', border: '1px solid rgba(212,168,83,.3)', borderRadius: 14, padding: '16px 20px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>🔒</span>
            <div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, color: 'var(--td)', marginBottom: 6 }}>Authentication</div>
              <div style={{ fontSize: 14, color: 'var(--tm)', lineHeight: 1.65 }}>
                Protected endpoints require <code style={{ background: 'rgba(212,168,83,.15)', padding: '1px 7px', borderRadius: 4, fontFamily: 'monospace', color: '#92400E' }}>Authorization: Bearer &lt;token&gt;</code> header. Obtain a token from <code style={{ background: 'rgba(27,67,50,.08)', padding: '1px 7px', borderRadius: 4, fontFamily: 'monospace', color: 'var(--forest)' }}>POST /api/auth/login</code>. Tokens expire after 7 days.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN DOCS — cream background */}
      <div style={{ background: 'var(--cream)' }}>
        <div className="api-wrap">
          {/* Sidebar */}
          <aside className="api-sidebar">
            <div className="api-sidebar-label">Resources</div>
            {GROUPS.map(({ id, label }) => (
              <button key={id} className={`api-group-btn${group === id ? ' api-active' : ''}`}
                onClick={() => setGroup(id)}>{label}</button>
            ))}
            <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(0,0,0,.08)' }}>
              <div className="api-sidebar-label">Status Enums</div>
              {STATUS_ENUMS.map(([name, vals]) => (
                <div key={name} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--td)', marginBottom: 3 }}>{name}</div>
                  <div style={{ fontSize: 11, color: 'var(--tl)', fontFamily: 'monospace', lineHeight: 1.7 }}>{vals}</div>
                </div>
              ))}
            </div>
          </aside>

          {/* Endpoint list */}
          <main>
            <div style={{ marginBottom: 28 }}>
              <h2 className="stitle" style={{ fontSize: 'clamp(22px,3vw,30px)', marginBottom: 8 }}>{current.label}</h2>
              <p style={{ fontSize: 15, color: 'var(--tm)', lineHeight: 1.65 }}>{current.desc}</p>
            </div>
            {current.endpoints.map(ep => <Endpoint key={ep.method + ep.path} {...ep} />)}

            {/* Error reference */}
            <div className="step" style={{ padding: '28px 32px', marginTop: 32 }}>
              <div className="step-n">!</div>
              <div className="snm">Error Responses</div>
              <div className="sd2" style={{ marginBottom: 12 }}>All errors follow the same JSON shape:</div>
              <CodeBlock code={`{ "success": false, "message": "Human-readable error description" }`} />
              <div className="error-grid">
                {[['400','Bad Request — missing or invalid fields'],['401','Unauthorized — missing or expired Bearer token'],['403','Forbidden — valid token but insufficient role'],['404','Not Found — resource does not exist'],['409','Conflict — e.g. duplicate application for same property'],['500','Server Error — contact support@rentease.co.tz']].map(([code, desc]) => (
                  <>
                    <code key={code} className="e-code">{code}</code>
                    <span key={desc} className="e-desc">{desc}</span>
                  </>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </LandingShell>
  );
}
