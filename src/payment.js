import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qeqkndfwacfxgimevxjc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Eja3hi7ewZl72DWcSYLX0Q_8ufAJiCz';
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const PREMIUM_NGN = 5000;

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

async function startPayment() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    alert('Please sign in before starting Premium payment.');
    return;
  }
  if (!PAYSTACK_PUBLIC_KEY) {
    alert('Paystack is connected, but the Paystack public key has not been configured yet. Add VITE_PAYSTACK_PUBLIC_KEY in the deployment environment.');
    return;
  }
  const reference = `JCNG-${user.id.slice(0,8)}-${Date.now()}`;
  const { error } = await supabase.from('subscriptions').insert({
    user_id: user.id,
    provider: 'paystack',
    reference,
    plan: 'premium',
    amount_kobo: PREMIUM_NGN * 100,
    currency: 'NGN',
    status: 'pending'
  });
  if (error) throw error;
  await loadPaystack();
  const popup = new window.PaystackPop();
  popup.newTransaction({
    key: PAYSTACK_PUBLIC_KEY,
    email: user.email,
    amount: PREMIUM_NGN * 100,
    currency: 'NGN',
    ref: reference,
    metadata: { plan: 'premium', product: 'JobCheck NG' },
    onSuccess: async (transaction) => {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-paystack', {
        body: { reference: transaction.reference }
      });
      if (verifyError || data?.error) {
        alert(data?.error || verifyError?.message || 'Payment was received but verification failed. Please contact support.');
        return;
      }
      alert('Payment successful. JobCheck NG Premium is now active.');
    },
    onCancel: () => {
      alert('Payment cancelled. No Premium subscription was activated.');
    }
  });
}

function mountPaymentButton() {
  if (document.getElementById('jobcheck-premium')) return;
  const button = document.createElement('button');
  button.id = 'jobcheck-premium';
  button.type = 'button';
  button.textContent = '⭐ Premium · ₦5,000/month';
  Object.assign(button.style, {
    position: 'fixed', right: '18px', bottom: '18px', zIndex: '9999', border: '0',
    borderRadius: '999px', padding: '13px 18px', fontWeight: '800', cursor: 'pointer',
    background: '#111827', color: '#fff', boxShadow: '0 12px 35px rgba(0,0,0,.22)'
  });
  button.addEventListener('click', () => startPayment().catch(err => alert(err.message || 'Payment could not be started.')));
  document.body.appendChild(button);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountPaymentButton);
else mountPaymentButton();
