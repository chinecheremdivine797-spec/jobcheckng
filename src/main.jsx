import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShieldCheck, Search, Upload, FileWarning, Lock, ArrowRight, CheckCircle2, LayoutDashboard, ClipboardList, Flag, User, X, LogIn, ChevronRight } from 'lucide-react';
import './styles.css';

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
  const [signedIn, setSignedIn] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  function analyze() {
    if (!jobText.trim()) return;
    const text = jobText.toLowerCase();
    const flags = checks.filter((_, i) => {
      if (i === 0) return /pay|fee|charge|registration|training|deposit|money|payment/.test(text);
      if (i === 1) return /easy money|huge salary|1000\$|\$1000|₦|million/.test(text);
      if (i === 2) return /telegram|whatsapp|crypto|gift card|send.*money/.test(text);
      return /http|click|verify|urgent|gmail|outlook/.test(text);
    });
    setResult({ level: flags.length >= 2 ? 'High Risk' : flags.length === 1 ? 'Needs Review' : 'Low Risk', flags });
  }

  function signIn(e) {
    e.preventDefault();
    setSignedIn(true); setShowLogin(false); setPage('dashboard');
  }

  const go = (next) => { setPage(next); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return <div className="app">
    <header className="nav">
      <button className="brand brandButton" onClick={() => go('home')}><div className="brandIcon"><ShieldCheck size={23}/></div><span>JobCheck <b>NG</b></span></button>
      <nav>
        <button onClick={() => go('home')}>Job Checker</button>
        <button onClick={() => go('dashboard')}>Dashboard</button>
        <button onClick={() => go('report')}>Report a Job</button>
        {signedIn ? <button className="login" onClick={() => setSignedIn(false)}>Sign out</button> : <button className="login" onClick={() => setShowLogin(true)}>Sign in</button>}
      </nav>
    </header>

    {page === 'home' && <main>
      <section className="hero">
        <div className="heroCopy">
          <div className="pill"><ShieldCheck size={15}/> Built for safer job hunting in Nigeria</div>
          <h1>Check the job.<br/><span>Protect your money.</span></h1>
          <p>Paste a job offer, message, or suspicious request and JobCheck NG will help you identify scam warning signs before you pay or share sensitive information.</p>
          <button className="primary" onClick={() => document.getElementById('checker')?.scrollIntoView({behavior:'smooth'})}>Check a Job <ArrowRight size={18}/></button>
        </div>
        <div className="heroCard"><div className="scanRing"><ShieldCheck size={48}/></div><strong>Job safety starts here.</strong><span>Free checks • Private by design</span></div>
      </section>

      <section id="checker" className="checker section">
        <div className="sectionHead"><div><span className="eyebrow">JOB CHECKER</span><h2>Is this job offer safe?</h2><p>Paste the job description, recruiter message, or payment request below.</p></div><div className="secure"><Lock size={15}/> Your text stays private</div></div>
        <div className="checkerGrid">
          <div className="inputCard"><textarea value={jobText} onChange={e => setJobText(e.target.value)} placeholder="Paste the job offer here...\n\nExample: You have been selected for a remote job. Pay ₦25,000 for registration before we can start your onboarding."/><div className="inputFooter"><label className="upload"><Upload size={16}/> Upload screenshot <input type="file" accept="image/*" hidden /></label><button onClick={analyze} className="analyze"><Search size={17}/> Analyze offer</button></div></div>
          <div className="resultCard">
            {!result ? <><div className="emptyIcon"><FileWarning size={27}/></div><h3>Your safety result will appear here</h3><p>JobCheck looks for common scam patterns and explains the warning signs it finds.</p></> : <><div className={`risk ${result.level.replaceAll(' ','-').toLowerCase()}`}><CheckCircle2 size={20}/>{result.level}</div><h3>{result.flags.length ? 'Warning signs detected' : 'No obvious red flags found'}</h3>{result.flags.length ? <ul>{result.flags.map((f,i)=><li key={i}>{f}</li>)}</ul> : <p>This is not a guarantee that the offer is legitimate. Verify the employer independently before accepting or paying.</p>}</>}
          </div>
        </div>
      </section>

      <section className="how section"><span className="eyebrow">HOW IT WORKS</span><h2>Three simple steps to a safer decision.</h2><div className="steps"><div><b>01</b><h3>Paste or upload</h3><p>Bring the offer, chat, email or screenshot you want checked.</p></div><div><b>02</b><h3>Scan for red flags</h3><p>JobCheck checks for common payment, identity and pressure tactics.</p></div><div><b>03</b><h3>Decide with confidence</h3><p>Get clear risk signals and practical next steps before you proceed.</p></div></div></section>

      <section className="report section"><div><span className="eyebrow">HELP OTHERS</span><h2>Found a suspicious job?</h2><p>Report it so other Nigerian job seekers can avoid the same trap.</p></div><button className="secondary" onClick={() => go('report')}>Report a Job <ArrowRight size={17}/></button></section>
    </main>}

    {page === 'dashboard' && <main className="dashboardPage section">
      <div className="pageTitle"><div><span className="eyebrow">MY ACCOUNT</span><h1>Dashboard</h1><p>Track your checks and keep suspicious offers in one place.</p></div><button className="primary" onClick={() => go('home')}>New Job Check <Search size={17}/></button></div>
      <div className="statGrid"><div className="stat"><Search/><strong>12</strong><span>Total checks</span></div><div className="stat"><Flag/><strong>4</strong><span>Reports submitted</span></div><div className="stat"><CheckCircle2/><strong>7</strong><span>Low-risk results</span></div><div className="stat"><ShieldCheck/><strong>1</strong><span>High-risk today</span></div></div>
      <div className="dashboardGrid"><section className="panel"><div className="panelHead"><h2>Recent checks</h2><button onClick={() => go('checks')}>View all <ChevronRight size={16}/></button></div>{demoHistory.map((item,i)=><div className="history" key={i}><div className="historyIcon"><ClipboardList size={18}/></div><div className="historyMain"><strong>{item.title}</strong><span>{item.reason}</span></div><div className={`miniRisk ${item.level.replaceAll(' ','-').toLowerCase()}`}>{item.level}</div><small>{item.date}</small></div>)}</section><section className="panel safety"><ShieldCheck size={30}/><h2>Safety reminder</h2><p>Never pay an employer to get a job. Verify company details using an independent source before sending money or documents.</p></section></div>
    </main>}

    {page === 'checks' && <main className="dashboardPage section"><div className="pageTitle"><div><span className="eyebrow">HISTORY</span><h1>My Checks</h1><p>Your recent job-safety checks.</p></div></div><section className="panel fullPanel">{demoHistory.concat(demoHistory).map((item,i)=><div className="history" key={i}><div className="historyIcon"><ClipboardList size={18}/></div><div className="historyMain"><strong>{item.title}</strong><span>{item.reason}</span></div><div className={`miniRisk ${item.level.replaceAll(' ','-').toLowerCase()}`}>{item.level}</div><small>{item.date}</small></div>)}</section></main>}

    {page === 'report' && <main className="dashboardPage section"><div className="pageTitle"><div><span className="eyebrow">COMMUNITY SAFETY</span><h1>Report a Job</h1><p>Share a suspicious job so other people can avoid the same trap.</p></div></div><section className="formPanel">{reportSent ? <div className="successBox"><CheckCircle2 size={42}/><h2>Report received</h2><p>Thank you. The JobCheck team can review this report and use it to protect other job seekers.</p><button className="primary" onClick={() => setReportSent(false)}>Submit another report</button></div> : <form onSubmit={e => {e.preventDefault();setReportSent(true)}}><div className="formGrid"><label>Job title<input required placeholder="e.g. Remote data entry"/></label><label>Company / recruiter<input required placeholder="Name shown in the offer"/></label><label>Where did you find it?<select><option>WhatsApp</option><option>Telegram</option><option>Facebook</option><option>Upwork / Fiverr</option><option>Email</option><option>Other</option></select></label><label>Amount requested<input placeholder="e.g. ₦25,000"/></label></div><label>What happened?<textarea required placeholder="Explain the suspicious request, payment demand, links, or messages..."></textarea><label className="uploadBox"><Upload size={19}/> Attach screenshot (optional)<input type="file" accept="image/*" hidden /></label><button className="primary" type="submit">Submit report <ArrowRight size={17}/></button></form>}</section></main>}

    <footer><span>© 2026 JobCheck NG</span><span>Safer job hunting starts with a check.</span></footer>

    {showLogin && <div className="modalBackdrop" onClick={() => setShowLogin(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setShowLogin(false)}><X/></button><div className="modalIcon"><LogIn/></div><h2>Sign in to JobCheck NG</h2><p>Email and password will be connected to Supabase next.</p><form onSubmit={signIn}><label>Email<input type="email" required placeholder="you@example.com"/></label><label>Password<input type="password" required placeholder="••••••••"/></label><button className="primary" type="submit">Sign in <ArrowRight size={17}/></button></form><small>Don't have an account? Registration will be added with the secure auth layer.</small></div></div>}
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
