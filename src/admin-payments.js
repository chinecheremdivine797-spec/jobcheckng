import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qeqkndfwacfxgimevxjc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Eja3hi7ewZl72DWcSYLX0Q_8ufAJiCz';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const css = `#jc-admin-pay{position:fixed;right:18px;bottom:72px;z-index:9998;border:0;border-radius:999px;padding:11px 16px;font-weight:800;cursor:pointer;background:#334155;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.2)}#jc-pay-modal{position:fixed;inset:0;z-index:10000;background:rgba(2,6,23,.62);display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,sans-serif}#jc-pay-card{background:#fff;color:#0f172a;width:min(1000px,96vw);max-height:88vh;overflow:auto;border-radius:20px;padding:24px;box-shadow:0 25px 70px rgba(0,0,0,.3)}#jc-pay-card h2{margin:0 0 6px}#jc-pay-card .jc-muted{color:#64748b;margin-bottom:18px}.jc-pay-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:18px}.jc-pay-stat{border:1px solid #e2e8f0;border-radius:14px;padding:14px}.jc-pay-stat b{display:block;font-size:22px}.jc-pay-table{width:100%;border-collapse:collapse}.jc-pay-table th,.jc-pay-table td{text-align:left;padding:10px;border-bottom:1px solid #e2e8f0;font-size:13px}.jc-badge{display:inline-block;padding:4px 8px;border-radius:999px;background:#e2e8f0}.jc-active{background:#dcfce7;color:#166534}.jc-pending{background:#fef3c7;color:#92400e}.jc-close{float:right;border:0;background:#e2e8f0;border-radius:9px;padding:8px 11px;cursor:pointer}@media(max-width:700px){.jc-pay-grid{grid-template-columns:repeat(2,1fr)}.jc-pay-table{font-size:12px}}`;

function addStyles(){if(document.getElementById('jc-admin-pay-style'))return;const s=document.createElement('style');s.id='jc-admin-pay-style';s.textContent=css;document.head.appendChild(s)}
function money(kobo){return `₦${(Number(kobo||0)/100).toLocaleString('en-NG')}`}

async function isStaff(){const {data:{user}}=await supabase.auth.getUser();if(!user)return false;const {data}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle();return data?.role==='admin'||data?.role==='moderator'}

async function openPanel(){
  const staff=await isStaff();
  if(!staff)return alert('Admin access only.');
  const {data,error}=await supabase.from('subscriptions').select('user_id,provider,reference,plan,amount_kobo,currency,status,paid_at,expires_at,created_at').order('created_at',{ascending:false}).limit(200);
  if(error)return alert(error.message);
  const rows=data||[];
  const active=rows.filter(x=>x.status==='active'&&x.expires_at&&new Date(x.expires_at)>new Date()).length;
  const pending=rows.filter(x=>x.status==='pending').length;
  const revenue=rows.filter(x=>x.status==='active').reduce((n,x)=>n+Number(x.amount_kobo||0),0);
  const modal=document.createElement('div');modal.id='jc-pay-modal';
  modal.innerHTML=`<div id="jc-pay-card"><button class="jc-close" id="jc-pay-close">Close</button><h2>JobCheck NG · Payments</h2><div class="jc-muted">Premium subscription management</div><div class="jc-pay-grid"><div class="jc-pay-stat"><b>${rows.length}</b>Transactions</div><div class="jc-pay-stat"><b>${active}</b>Active Premium</div><div class="jc-pay-stat"><b>${pending}</b>Pending</div><div class="jc-pay-stat"><b>${money(revenue)}</b>Verified revenue</div></div><table class="jc-pay-table"><thead><tr><th>Reference</th><th>Amount</th><th>Status</th><th>Paid</th><th>Expires</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${x.reference}</td><td>${money(x.amount_kobo)}</td><td><span class="jc-badge ${x.status==='active'?'jc-active':x.status==='pending'?'jc-pending':''}">${x.status}</span></td><td>${x.paid_at?new Date(x.paid_at).toLocaleString('en-NG'):'—'}</td><td>${x.expires_at?new Date(x.expires_at).toLocaleDateString('en-NG'):'—'}</td></tr>`).join('')}</tbody></table></div>`;
  document.body.appendChild(modal);document.getElementById('jc-pay-close').onclick=()=>modal.remove();modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
}

async function mount(){addStyles();const staff=await isStaff().catch(()=>false);if(!staff)return;if(document.getElementById('jc-admin-pay'))return;const b=document.createElement('button');b.id='jc-admin-pay';b.textContent='💳 Admin Payments';b.onclick=()=>openPanel();document.body.appendChild(b)}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
supabase.auth.onAuthStateChange(()=>{const old=document.getElementById('jc-admin-pay');if(old)old.remove();mount()});
