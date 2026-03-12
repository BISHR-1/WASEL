import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initDeepLinkHandler } from '@/lib/deepLinkHandler'
import { supabase } from '@/lib/supabase'

// ⚡ تحميل خدمة الإشعارات مبكراً لإعداد المستمعين
import '@/services/pushNotifications'

// معالجة OAuth tokens قبل تحميل React لتجنب race condition
async function boot() {
  const hash = window.location.hash;
  const search = window.location.search;

  // 1) Implicit flow — #access_token=...
  if (hash.includes('access_token')) {
    const params = new URLSearchParams(hash.substring(1));
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token) {
      try {
        await supabase.auth.setSession({
          access_token,
          refresh_token: refresh_token || '',
        });
      } catch (e) {
        console.warn('boot: setSession from hash failed', e);
      }
    }
    window.history.replaceState({}, document.title, window.location.pathname || '/');
  }

  // 2) PKCE flow — ?code=...
  const code = new URLSearchParams(search).get('code');
  if (code && !hash.includes('access_token')) {
    try {
      await supabase.auth.exchangeCodeForSession(window.location.href);
    } catch (e) {
      console.warn('boot: exchangeCodeForSession failed', e);
    }
    window.history.replaceState({}, document.title, window.location.pathname || '/');
  }

  // تفعيل معالج Deep Links للأندرويد
  initDeepLinkHandler();

  ReactDOM.createRoot(document.getElementById('root')).render(
    <App />
  );
}

boot();
