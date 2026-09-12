import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ShieldCheck, Search, Upload, FileWarning, Lock, ArrowRight, CheckCircle2 } from 'lucide-react';
import './styles.css';

const checks = [
  'Requests for upfront registration, training, equipment or processing fees',
  'Promises of unusually high pay for very little work',
  'Pressure to move conversations or payments off-platform',
  'Suspicious links, fake company identities or inconsistent contact details'
];

function App() {
  const [jobText, setJobText] = useState('');
  const [result, setResult] = useState(null);

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

  return <div className="app">
    <header className="nav">
      <div className="brand"><div className="brandIcon"><ShieldCheck size={23}/></div><span>JobCheck <b>NG</b></span></div>
      <nav><a href="#checker">Job Checker</a><a href="#how">How it works</a><a href="#report">Report a Job</a><button className="login">Sign in</button></nav>
    </header>

    <main>
      <section className="hero">
        <div className="heroCopy">
          <div className="pill"><ShieldCheck size={15}/> Built for safer job hunting in Nigeria</div>
          <h1>Check the job.<br/><span>Protect your money.</span></h1>
          <p>Paste a job offer, message, or suspicious request and JobCheck NG will help you identify scam warning signs before you pay or share sensitive information.</p>
          <a className="primary" href="#checker">Check a Job <ArrowRight size={18}/></a>
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

      <section id="how" className="how section"><span className="eyebrow">HOW IT WORKS</span><h2>Three simple steps to a safer decision.</h2><div className="steps"><div><b>01</b><h3>Paste or upload</h3><p>Bring the offer, chat, email or screenshot you want checked.</p></div><div><b>02</b><h3>Scan for red flags</h3><p>JobCheck checks for common payment, identity and pressure tactics.</p></div><div><b>03</b><h3>Decide with confidence</h3><p>Get clear risk signals and practical next steps before you proceed.</p></div></div></section>

      <section id="report" className="report section"><div><span className="eyebrow">HELP OTHERS</span><h2>Found a suspicious job?</h2><p>Report it so other Nigerian job seekers can avoid the same trap.</p></div><button className="secondary">Report a Job <ArrowRight size={17}/></button></section>
    </main>
    <footer><span>© 2026 JobCheck NG</span><span>Safer job hunting starts with a check.</span></footer>
  </div>
}

createRoot(document.getElementById('root')).render(<App />);
