import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initDeepLinkHandler } from '@/lib/deepLinkHandler'

// ⚡ تحميل خدمة الإشعارات مبكراً لإعداد المستمعين
import '@/services/pushNotifications'

// تفعيل معالج Deep Links للأندرويد
initDeepLinkHandler();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
