import sys

def modify_cart_jsx():
    with open('wasel-main/src/pages/Cart.jsx', 'r', encoding='utf-8') as f:
        text = f.read()

    # Injections
    # 1. State:
    target_state = "const [recipientName, setRecipientName] = useState('');"
    new_state = '''const [recipientName, setRecipientName] = useState('');
  const [sharedCartMode, setSharedCartMode] = useState(false);
  const [sharedCartCreator, setSharedCartCreator] = useState(null);
  const [sharedCartToken, setSharedCartToken] = useState(null);
  
  useEffect(() => {
    try {
      const sessionStr = localStorage.getItem('wasel_shared_cart_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        setSharedCartMode(true);
        setSharedCartToken(session.token);
        setSharedCartCreator(session.creator_id);
        
        if (session.recipient) {
          setRecipientName(session.recipient.name || '');
          setRecipientPhone(session.recipient.phone || '');
          setRecipientAddress(session.recipient.address || '');
        }
      }
    } catch(e) {}
  }, []);
  
  const handleClearSharedCart = () => {
    localStorage.removeItem('wasel_shared_cart_session');
    setSharedCartMode(false);
    setSharedCartToken(null);
    setSharedCartCreator(null);
    setRecipientName('');
    setRecipientPhone('');
    setRecipientAddress('');
    toast.success('تم إلغاء وضع السلة المشتركة يمكنك إنشاء طلبك الخاص');
  };'''
  
    text = text.replace(target_state, new_state)
    
    # 2. Add badge inside form
    target_ui = '''<h4 className="font-bold text-gray-900 mb-3 text-base" dir="rtl">بيانات المستلم</h4>'''
    new_ui = '''<h4 className="font-bold text-gray-900 mb-3 text-base" dir="rtl">بيانات المستلم</h4>
              {sharedCartMode && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm text-center font-bold relative">
                  هذا الطلب لـ {recipientName} (سلة مشتركة) 🕊️
                  <button onClick={handleClearSharedCart} className="absolute left-2 top-2 text-xs text-red-500 underline">إلغاء</button>
                </div>
              )}'''
    text = text.replace(target_ui, new_ui)

    # Disable inputs
    text = text.replace('value={recipientName}\\n                    onChange={(e) => setRecipientName(e.target.value)}', 
                        'value={recipientName}\\n                    onChange={(e) => setRecipientName(e.target.value)}\\n                    disabled={sharedCartMode}')
    text = text.replace('value={recipientPhone}\\n                    onChange={(e) => setRecipientPhone(e.target.value)}', 
                        'value={recipientPhone}\\n                    onChange={(e) => setRecipientPhone(e.target.value)}\\n                    disabled={sharedCartMode}')
    text = text.replace('value={recipientAddress}\\n                    onChange={(e) => setRecipientAddress(e.target.value)}', 
                        'value={recipientAddress}\\n                    onChange={(e) => setRecipientAddress(e.target.value)}\\n                    disabled={sharedCartMode}')
                        
    # Replace the share payload text
    text = text.replace(
        '<h4 className="font-extrabold text-[#065F46] text-sm mb-1">ميزة رابط الدفع من تطبيق واصل</h4>',
        '<h4 className="font-extrabold text-[#065F46] text-sm mb-1">شارك سلتك مع أحبابك 🕊️</h4>'
    )
    text = text.replace(
        'عند الضغط على "مشاركة السلة" يتم إنشاء رابط خاص + إنشاء طلب فعلي يصل مباشرة للمشرف مع إشعار فوري. الطرف الخارجي يفتح الرابط، يسجل الدخول، ثم يكمل الدفع.',
        'وفرنا لك بيئة آمنة تتيح لمن تحب في الخارج استكمال طلبك والمساهمة به بكل سهولة وبدون تعقيد. بمجرد الدفع سيصلك إشعار فوري وتتغير حالة الطلب.'
    )
    
    with open('wasel-main/src/pages/Cart.jsx', 'w', encoding='utf-8') as f:
        f.write(text)

modify_cart_jsx()
