// import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
// Note: This is a local function file

const corsHeadersNotif = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

(globalThis as any).Deno?.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeadersNotif });
  }

  try {
    // const base44 = createClientFromRequest(req);
    
    // Check auth (optional but recommended)
    // const user = await base44.auth.me();
    
    // Parse body safely
    let bodyData;
    try {
        bodyData = await req.json();
    } catch (e) {
        return Response.json({ error: 'Invalid JSON body' }, { status: 400, headers: corsHeadersNotif });
    }

    const { type, orderNumber, recipientEmail, recipientName, message, additionalData } = bodyData;

    let subject = '';
    let body = '';
    
    // Email Styling
    const headerStyle = "background: linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%); padding: 40px 20px; border-radius: 16px 16px 0 0; text-align: center;";
    const containerStyle = "font-family: 'Cairo', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #f0f0f0;";
    const contentStyle = "padding: 40px 30px;";
    const buttonStyle = "display: inline-block; background: #1B4332; color: #ffffff !important; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 16px; margin-top: 20px; box-shadow: 0 4px 10px rgba(27, 67, 50, 0.2); transition: background 0.3s ease;";
    const infoBoxStyle = "background: #FDFBF7; padding: 20px; border-radius: 12px; border: 1px solid #F5E6D3; margin: 25px 0;";
    const footerStyle = "text-align: center; padding: 30px; background-color: #f8f9fa; color: #6c757d; font-size: 13px; border-top: 1px solid #eee;";

    // Helper to ensure valid URL
    const ensureUrl = (url: string) => {
        if (!url) return '#';
        if (url.startsWith('http')) return url;
        const host = req.headers.get('host') || 'wasel-app.com';
        return `https://${host}${url.startsWith('/') ? '' : '/'}${url}`;
    };

    switch (type) {
      case 'new_order':
        subject = `✅ تم استلام طلبك: ${orderNumber}`;
        body = `
          <div dir="rtl" style="${containerStyle}">
            <div style="${headerStyle}">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800; font-family: 'Cairo', sans-serif;">تم استلام الطلب</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">شكراً لثقتك بمنصة واصل</p>
            </div>
            
            <div style="${contentStyle}">
              <h2 style="color: #1B4332; margin-top: 0; font-size: 20px;">مرحباً ${recipientName}،</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">يسعدنا إخبارك بأننا استلمنا طلبك بنجاح. سيقوم فريقنا بمراجعته والبدء في تجهيزه قريباً.</p>
              
              <div style="${infoBoxStyle}">
                <div style="margin-bottom: 10px; display: flex; justify-content: space-between;">
                  <span style="color: #718096;">رقم الطلب:</span>
                  <span style="color: #1B4332; font-weight: bold;">${orderNumber}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #718096;">تاريخ الطلب:</span>
                  <span style="color: #1B4332; font-weight: bold;">${new Date().toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
              
              ${message ? `<p style="color: #4a5568; font-size: 14px; margin-bottom: 25px; background: #eee; padding: 10px; border-radius: 8px;">${message}</p>` : ''}
              
              <div style="text-align: center;">
                <a href="${ensureUrl(additionalData?.trackUrl)}" style="${buttonStyle}">تتبع حالة الطلب</a>
              </div>
            </div>
            
            <div style="${footerStyle}">
              <p style="margin: 0 0 10px 0;">نحن هنا للمساعدة! إذا كان لديك أي استفسار، لا تتردد في التواصل معنا.</p>
              <p style="margin: 0;">© ${new Date().getFullYear()} واصل - Wasel. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        `;
        break;

      case 'order_updated':
        subject = `تحديث طلب ${orderNumber}: ${additionalData?.status || ''}`;
        body = `
          <div dir="rtl" style="${containerStyle}">
            <div style="${headerStyle} background: linear-gradient(135deg, #52B788 0%, #40916C 100%);">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">تحديث حالة الطلب</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">هناك مستجدات حول طلبك</p>
            </div>
            
            <div style="${contentStyle}">
              <h2 style="color: #1B4332; margin-top: 0; font-size: 20px;">مرحباً ${recipientName}،</h2>
              
              <div style="${infoBoxStyle} text-align: center;">
                <p style="color: #718096; margin: 0 0 5px 0; font-size: 14px;">حالة الطلب الحالية</p>
                <h3 style="color: #1B4332; margin: 0; font-size: 24px;">${additionalData?.status || 'تم التحديث'}</h3>
              </div>
              
              <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">${message}</p>
              
              <div style="text-align: center;">
                <a href="${ensureUrl(additionalData?.trackUrl)}" style="${buttonStyle} background: #52B788;">عرض تفاصيل الطلب</a>
              </div>
            </div>
            
            <div style="${footerStyle}">
              <p style="margin: 0;">© ${new Date().getFullYear()} واصل - Wasel</p>
            </div>
          </div>
        `;
        break;

      case 'new_message':
        subject = `💬 رسالة جديدة بخصوص الطلب ${orderNumber}`;
        body = `
          <div dir="rtl" style="${containerStyle}">
            <div style="${headerStyle} background: linear-gradient(135deg, #2D3748 0%, #4A5568 100%);">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">رسالة جديدة</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">لديك رسالة غير مقروءة</p>
            </div>
            
            <div style="${contentStyle}">
              <h2 style="color: #1B4332; margin-top: 0; font-size: 20px;">مرحباً ${recipientName}،</h2>
              
              <div style="${infoBoxStyle}">
                <p style="margin: 0 0 5px 0; color: #718096; font-size: 12px;">من:</p>
                <p style="margin: 0; color: #1B4332; font-weight: bold;">${additionalData?.senderName || 'فريق واصل'}</p>
              </div>
              
              <div style="background-color: #f8f9fa; border-right: 4px solid #1B4332; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
                <p style="color: #4a5568; margin: 0; line-height: 1.6; font-style: italic;">"${message}"</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${ensureUrl(additionalData?.chatUrl)}" style="${buttonStyle} background: #2D3748;">الرد على الرسالة</a>
              </div>
            </div>
            
            <div style="${footerStyle}">
              <p style="margin: 0;">© ${new Date().getFullYear()} واصل - Wasel</p>
            </div>
          </div>
        `;
        break;
        
      case 'invoice':
        subject = `🧾 فاتورة الطلب ${orderNumber}`;
        body = `
          <div dir="rtl" style="${containerStyle}">
            <div style="${headerStyle}">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">فاتورة الطلب</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">شكراً لإتمام عملية الدفع</p>
            </div>
            
            <div style="${contentStyle}">
              <h2 style="color: #1B4332; margin-top: 0; font-size: 20px;">مرحباً ${recipientName}،</h2>
              <p style="color: #4a5568; line-height: 1.6; font-size: 16px;">تم إصدار فاتورة لطلبك رقم <strong>${orderNumber}</strong>.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <img src="https://cdn-icons-png.flaticon.com/512/2997/2997933.png" alt="Invoice Payment" style="width: 80px; opacity: 0.8;">
              </div>
              
              <p style="color: #4a5568; text-align: center; margin-bottom: 25px;">يمكنك تحميل الفاتورة من خلال الزر أدناه:</p>
              
              <div style="text-align: center;">
                <a href="${additionalData?.invoiceUrl}" style="${buttonStyle}">تحميل الفاتورة (PDF)</a>
              </div>
            </div>
            
            <div style="${footerStyle}">
              <p style="margin: 0;">© ${new Date().getFullYear()} واصل - Wasel</p>
            </div>
          </div>
        `;
        break;

      default:
        return Response.json({ error: 'Invalid notification type' }, { status: 400, headers: corsHeadersNotif });
    }

    // Send the email via Base44/Supabase Integration or similar provider
    // Note: Base44 integration disabled for now
    // await base44.integrations.Core.SendEmail({
    //   from_name: 'واصل - Wasel',
    //   to: recipientEmail,
    //   subject,
    //   body,
    //   isHtml: true
    // });
    console.log('Email would be sent to:', recipientEmail, 'Subject:', subject);

    return Response.json({ success: true }, { headers: corsHeadersNotif });
  } catch (error: any) {
    console.error('Error sending notification:', error);
    return Response.json({ error: error.message || 'Internal Server Error' }, { status: 500, headers: corsHeaders });
  }
});
