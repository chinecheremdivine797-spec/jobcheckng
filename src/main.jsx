import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, Search, Upload, FileWarning, Lock, ArrowRight, CheckCircle2, ClipboardList, Flag, X, LogIn, ChevronRight, LogOut } from 'lucide-react';
import './styles.css';

const SUPABASE_URL = 'https://qeqkndfwacfxgimevxjc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Eja3hi7ewZl72DWcSYLX0Q_8ufAJiCz';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const checks = [
  'Requests for upfront registration, training, equipment or processing fees',
  'Promises of unusually high pay for very little work',
  'Pressure to move conversations or payments off-platform',
  'Suspicious links, fake company identities or inconsistent contact details'
];

const demoHistory = [
  { title: 'Remote Data Entry Offer', level: 'High Risk', date: 'Today', reason: 'Upfront payment request' },
  { title: 'Freelance Design Contract', level: 'Needs Review', date: 'Yesterday', reason: 'Off-platform communication' },
  { title: 'Customer Support Role', level: 'Low Risk', date: 'Sep 9', reason: 'No major red flags detected' }
];

function App() {
  const [page, setPage] = useState('home');
  const [jobText, setJobText] = useState('');
  const [result, setResult] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [user, setUser] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [history, setHistory] = useState([]);
  const [reportForm, setReportForm] = useState({ title: '', company: '', source: 'WhatsApp', amount: '', description: '' });

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user || null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) loadHistory();
  }, [user]);

  async function loadHistory() {
    const { data } = await supabase.from('job_checks').select('*').order('created_at', { ascending: false }).limit(20);
    setHistory(data || []);
  }

  async function analyze() {
    if (!jobText.trim()) return;
    const text = jobText.toLowerCase();
    const flags = checks.filter((_, i) => {
      if (i === 0) return /pay|fee|charge|registration|training|deposit|money|payment/.test(text);
      if (i === 1) return /easy money|huge salary|1000\$|\$1000|₦|million/.test(text);
      if (i === 2) return /telegram|whatsapp|crypto|gift card|send.*money/.test(text);
      return /http|click|verify|urgent|gmail|outlook/.test(text);
    });
    const level = flags.length >= 2 ? 'High Risk' : flags.length === 1 ? 'Needs Review' : 'Low Risk';
    const riskScore = level === 'High Risk' ? Math.min(95, 60 + flags.length * 12) : level === 'Needs Review' ? 45 : 15;
    const next = { level, flags, riskScore };
    setResult(next);

    if (user) {
      await supabase.from('job_checks').insert({
        user_id: user.id,
        title: jobText.trim().slice(0, 70),
        job_text: jobText.trim(),
        risk_level: level === 'High Risk' ? 'high' : level === 'Needs Review' ? 'medium' : 'low',
        risk_score: riskScore,
        red_flags: flags,
        recommendations: ['Verify the employer independently.', 'Do not send money to get a job.', 'Avoid sharing sensitive documents until the employer is verified.']
      });
      loadHistory();
    }
  }

  async function submitAuth(e) {
    e.preventDefault();
    setAuthBusy(true); setAuthMessage('');
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') || '').trim();
    const password = String(form.get('password') || '');
    const fullName = String(form.get('fullName') || '').trim();
    let response;
    if (authMode === 'signup') {
      response = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    } else {
      response = await supabase.auth.signInWithPassword({ email, password });
    }
    setAuthBusy(false);
    if (response.error) return setAuthMessage(response.error.message);
    if (authMode === 'signup' && !response.data.session) {
      setAuthMessage('Account created. Check your email if confirmation is required, then sign in.');
      return;
    }
    setShowLogin(false); setPage('dashboard');
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null); setPage('home');
  }

  async function submitReport(e) {
    e.preventDefault();
    if (!user) { setShowLogin(true); setAuthMode('signin'); return; }
    const { error } = await supabase.from('reports').insert({
      user_id: user.id,
      title: reportForm.title,
      description: `${reportForm.company ? `Company/recruiter: ${reportForm.company}\n` : ''}${reportForm.amount ? `Amount requested: ${reportForm.amount}\n` : ''}${reportForm.description}`,
      source: reportForm.source
    });
    if (!error) setReportSent(true);
  }

  const go = (next) => { setPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const recent = history.length ? history : demoHistory;

  return <div className="app">
    <header className="nav">
      <button className="brand brandButton" onClick={() => go('home')}><div className="brandIcon"><ShieldCheck size={23}/></div><span>JobCheck <b>NG</b></span></button>
      <nav>
        <button onClick={() => go('home')}>Job Checker</button>
        <button onClick={() => go('dashboard')}>Dashboard</button>
        <button onClick={() => go('report')}>Report a Job</button>
        {user ? <button className="login" onClick={signOut}><LogOut size={15}/> Sign out</button> : <button className="login" onClick={() => {setAuthMode('signin');setShowLogin(true)}}><LogIn size={15}/> Sign in</button>}
      </nav>
    </header>

    {page === 'home' && <main>
      <section className="hero">
        <div className="heroCopy"><div className="pill"><ShieldCheck size={15}/> Built for safer job hunting in Nigeria</div><h1>Check the job.<br/><span>Protect your money.</span></h1><p>Paste a job offer, message, or suspicious request and JobCheck NG will help you identify scam warning signs before you pay or share sensitive information.</p><button className="primary" onClick={() => document.getElementById('checker')?.scrollIntoView({behavior:'smooth'})}>Check a Job <ArrowRight size={18}/></button></div>
        <div className="heroCard"><div className="scanRing"><ShieldCheck size={48}/></div><strong>Job safety starts here.</strong><span>Free checks • Private by design</span></div>
      </section>
      <section id="checker" className="checker section"><div className="sectionHead"><div><span className="eyebrow">JOB CHECKER</span><h2>Is this job offer safe?</h2><p>Paste the job description, recruiter message, or payment request below.</p></div><div className="secure"><Lock size={15}/> Your text stays private</div></div>
        <div className="checkerGrid"><div className="inputCard"><textarea value={jobText} onChange={e => setJobText(e.target.value)} placeholder="Paste the job offer here...\n\nExample: You have been selected for a remote job. Pay ₦25,000 for registration before we can start your onboarding."/><div className="inputFooter"><label className="upload"><Upload size={16}/> Upload screenshot <input type="file" accept="image/*" hidden /></label><button onClick={analyze} className="analyze"><Search size={17}/> Analyze offer</button></div></div>
          <div className="resultCard">{!result ? <><div className="emptyIcon"><FileWarning size={27}/></div><h3>Your safety result will appear here</h3><p>JobCheck looks for common scam patterns and explains the warning signs it finds.</p></> : <><div className={`risk ${result.level.replaceAll(' ','-').toLowerCase()}`}><CheckCircle2 size={20}/>{result.level} · {result.riskScore}/100</div><h3>{result.flags.length ? 'Warning signs detected' : 'No obvious red flags found'}</h3>{result.flags.length ? <ul>{result.flags.map((f,i)=><li key={i}>{f}</li>)}</ul> : <p>This is not a guarantee that the offer is legitimate. Verify the employer independently before accepting or paying.</p>}</>}</div>
        </div></section>
      <section className="how section"><span className="eyebrow">HOW IT WORKS</span><h2>Three simple steps to a safer decision.</h2><div className="steps"><div><b>01</b><h3>Paste or upload</h3><p>Bring the offer, chat, email or screenshot you want checked.</p></div><div><b>02</b><h3>Scan for red flags</h3><p>JobCheck checks for common payment, identity and pressure tactics.</p></div><div><b>03</b><h3>Decide with confidence</h3><p>Get clear risk signals and practical next steps before you proceed.</p></div></div></section>
      <section className="report section"><div><span className="eyebrow">HELP OTHERS</span><h2>Found a suspicious job?</h2><p>Report it so other Nigerian job seekers can avoid the same trap.</p></div><button className="secondary" onClick={() => go('report')}>Report a Job <ArrowRight size={17}/></button></section>
    </main>}

    {page === 'dashboard' && <main className="dashboardPage section"><div className="pageTitle"><div><span className="eyebrow">MY ACCOUNT</span><h1>Dashboard</h1><p>{user ? `Signed in as ${user.email}` : 'Sign in to save checks and reports to your account.'}</p></div><button className="primary" onClick={() => go('home')}>New Job Check <Search size={17}/></button></div>
      <div className="statGrid"><div className="stat"><Search/><strong>{history.length}</strong><span>Saved checks</span></div><div className="stat"><Flag/><strong>—</strong><span>Reports submitted</span></div><div className="stat"><CheckCircle2/><strong>{history.filter(x=>x.risk_level==='low').length}</strong><span>Low-risk results</span></div><div className="stat"><ShieldCheck/><strong>{history.filter(x=>x.risk_level==='high').length}</strong><span>High-risk results</span></div></div>
      <div className="dashboardGrid"><section className="panel"><div className="panelHead"><h2>Recent checks</h2><button onClick={() => go('checks')}>View all <ChevronRight size={16}/></button></div>{recent.slice(0,5).map((item,i)=>{const level=item.level || (item.risk_level==='high'?'High Risk':item.risk_level==='medium'?'Needs Review':'Low Risk');return <div className="history" key={item.id || i}><div className="historyIcon"><ClipboardList size={18}/></div><div className="historyMain"><strong>{item.title}</strong><span>{item.reason || (item.red_flags?.[0] || 'No major red flags detected')}</span></div><div className={`miniRisk ${level.replaceAll(' ','-').toLowerCase()}`}>{level}</div><small>{item.created_at ? new Date(item.created_at).toLocaleDateString() : item.date}</small></div>})}</section><section className="panel safety"><ShieldCheck size={30}/><h2>Safety reminder</h2><p>Never pay an employer to get a job. Verify company details using an independent source before sending money or documents.</p></section></div>
    </main>}

    {page === 'checks' && <main className="dashboardPage section"><div className="pageTitle"><div><span className="eyebrow">HISTORY</span><h1>My Checks</h1><p>{user ? 'Your saved job-safety checks.' : 'Sign in to see your saved checks.'}</p></div></div><section className="panel fullPanel">{(user ? history : demoHistory).map((item,i)=>{const level=item.level || (item.risk_level==='high'?'High Risk':item.risk_level==='medium'?'Needs Review':'Low Risk');return <div className="history" key={item.id || i}><div className="historyIcon"><ClipboardList size={18}/></div><div className="historyMain"><strong>{item.title}</strong><span>{item.reason || (item.red_flags?.[0] || 'No major red flags detected')}</span></div><div className={`miniRisk ${level.replaceAll(' ','-').toLowerCase()}`}>{level}</div><small>{item.created_at ? new Date(item.created_at).toLocaleDateString() : item.date}</small></div>})}</section></main>}

    {page === 'report' && <main className="dashboardPage section"><div className="pageTitle"><div><span className="eyebrow">COMMUNITY SAFETY</span><h1>Report a Job</h1><p>Share a suspicious job so other people can avoid the same trap.</p></div></div><section className="formPanel">{reportSent ? <div className="successBox"><CheckCircle2 size={42}/><h2>Report received</h2><p>Thank you. Your report has been saved for review.</p><button className="primary" onClick={() => {setReportSent(false);setReportForm({title:'',company:'',source:'WhatsApp',amount:'',description:''})}}>Submit another report</button></div> : <form onSubmit={submitReport}><div className="formGrid"><label>Job title<input required value={reportForm.title} onChange={e=>setReportForm({...reportForm,title:e.target.value})} placeholder="e.g. Remote data entry"/></label><label>Company / recruiter<input value={reportForm.company} onChange={e=>setReportForm({...reportForm,company:e.target.value})} placeholder="Name shown in the offer"/></label><label>Where did you find it?<select value={reportForm.source} onChange={e=>setReportForm({...reportForm,source:e.target.value})}><option>WhatsApp</option><option>Telegram</option><option>Facebook</option><option>Upwork / Fiverr</option><option>Email</option><option>Other</option></select></label><label>Amount requested<input value={reportForm.amount} onChange={e=>setReportForm({...reportForm,amount:e.target.value})} placeholder="e.g. ₦25,000"/></label></div><label>What happened?<textarea required value={reportForm.description} onChange={e=>setReportForm({...reportForm,description:e.target.value})} placeholder="Explain the suspicious request, payment demand, links, or messages..."/></label><label className="uploadBox"><Upload size={19}/> Attach screenshot (optional)<input type="file" accept="image/*" hidden /></label><button className="primary" type="submit">{user ? 'Submit report' : 'Sign in to submit'} <ArrowRight size={17}/></button></form>}</section></main>}

    <footer><span>© 2026 JobCheck NG</span><span>Safer job hunting starts with a check.</span></footer>

    {showLogin && <div className="modalBackdrop" onClick={() => setShowLogin(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setShowLogin(false)}><X/></button><div className="modalIcon"><LogIn/></div><h2>{authMode === 'signup' ? 'Create your JobCheck NG account' : 'Sign in to JobCheck NG'}</h2><p>Secure email and password authentication powered by Supabase.</p><form onSubmit={submitAuth}>{authMode === 'signup' && <label>Full name<input name="fullName" required placeholder="Your name"/></label>}<label>Email<input name="email" type="email" required placeholder="you@example.com"/></label><label>Password<input name="password" type="password" minLength="6" required placeholder="At least 6 characters"/></label>{authMessage && <div className="authMessage">{authMessage}</div>}<button className="primary" type="submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'signup' ? 'Create account' : 'Sign in'} <ArrowRight size={17}/></button></form><button className="textButton" onClick={()=>{setAuthMode(authMode==='signup'?'signin':'signup');setAuthMessage('')}}>{authMode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}</button></div></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
