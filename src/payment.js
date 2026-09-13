import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qeqkndfwacfxgimevxjc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Eja3hi7ewZl72DWcSYLX0Q_8ufAJiCz';
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const PREMIUM_NGN = 5000;

const style = { position:'fixed', right:'18px', bottom:'18px', zIndex:'9999', border:'0', borderRadius:'999px', padding:'13px 18px', fontWeight:'800', cursor:'pointer', background:'#111827', color:'#fff', boxShadow:'0 12px 35px rgba(0,0,0,.22)' };

function loadPaystack() {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) return resolve();
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v2/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load Paystack checkout.'));
    document.head.appendChild(script);
  });
}

async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Please sign in before using Premium.');
  return data.user;
}

async function getPremium() {
  const user = await getCurrentUser();
  const { data, error } = await supabase.from('subscriptions').select('status,expires_at,reference,paid_at').eq('user_id', user.id).eq('plan','premium').order('created_at',{ascending:false}).limit(1).maybeSingle();
  if (error) throw error;
  const active = data?.status === 'active' && data.expires_at && new Date(data.expires_at) > new Date();
  return { user, data, active };
}

async function startPayment() {
  const user = await getCurrentUser();
  if (!PAYSTACK_PUBLIC_KEY) throw new Error('Paystack public key is not configured. Set VITE_PAYSTACK_PUBLIC_KEY in the deployment environment.');

  const reference = `JCNG-${user.id.slice(0,8)}-${Date.now()}`;
  const { error } = await supabase.from('subscriptions').insert({ user_id:user.id, provider:'paystack', reference, plan:'premium', amount_kobo:PREMIUM_NGN*100, currency:'NGN', status:'pending' });
  if (error) throw error;

  await loadPaystack();
  const popup = new window.PaystackPop();
  popup.newTransaction({
    key: PAYSTACK_PUBLIC_KEY,
    email: user.email,
    amount: PREMIUM_NGN * 100,
    currency: 'NGN',
    reference,
    metadata: { plan:'premium', product:'JobCheck NG' },
    onSuccess: async (transaction) => {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-paystack', { body:{ reference:transaction.reference } });
      if (verifyError || data?.error) return alert(data?.error || verifyError?.message || 'Payment received but verification failed.');
      alert(`Premium is active until ${new Date(data.expires_at).toLocaleDateString()}.`);
      await refreshButton();
    },
    onCancel: () => alert('Payment cancelled. No Premium subscription was activated.'),
    onError: (error) => alert(error?.message || 'Paystack could not load the payment.')
  });
}

async function refreshButton() {
  const old = document.getElementById('jobcheck-premium');
  if (old) old.remove();
  const button = document.createElement('button');
  button.id = 'jobcheck-premium';
  button.type = 'button';
  Object.assign(button.style, style);
  try {
    const { active, data } = await getPremium();
    if (active) {
      button.textContent = `✓ Premium active · ${new Date(data.expires_at).toLocaleDateString()}`;
      button.style.background = '#166534';
      button.addEventListener('click', () => alert(`Your JobCheck NG Premium subscription is active until ${new Date(data.expires_at).toLocaleDateString()}.`));
    } else {
      button.textContent = '⭐ Premium · ₦5,000/month';
      button.addEventListener('click', () => startPayment().catch(err => alert(err.message || 'Payment could not be started.')));
    }
  } catch {
    button.textContent = '⭐ Premium · ₦5,000/month';
    button.addEventListener('click', () => startPayment().catch(err => alert(err.message || 'Payment could not be started.')));
  }
  document.body.appendChild(button);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshButton); else refreshButton();
supabase.auth.onAuthStateChange(() => refreshButton());
