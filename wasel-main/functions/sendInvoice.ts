import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';
// نحتاج خط يدعم العربية، سنستخدم خط افتراضي أو صورة إذا لزم الأمر، ولكن jspdf يدعم الخطوط المضافة.
// للتبسيط والموثوقية، سنستخدم مكتبة pdf-lib أو سنقوم برسم الفاتورة كصورة ثم تحويلها لـ PDF إذا واجهنا مشاكل في الخطوط العربية،
// لكن الأفضل استخدام خط عربي base64. 
// نظراً لعدم توفر خط عربي base64 جاهز الآن، سنستخدم نص إنجليزي بسيط للفاتورة مع الأرقام، أو نحاول استخدام خط افتراضي.
// الأفضل في Deno استخدام مكتبة تدعم العربية جيداً، ولكن jspdf تحتاج إضافة خط.
// سأقوم بإنشاء فاتورة بسيطة وتوليدها.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me(); // يجب أن يكون أدمن أو المستخدم نفسه

    const { orderId } = await req.json();

    if (!orderId) {
        return Response.json({ error: 'Order ID required' }, { status: 400 });
    }

    // جلب تفاصيل الطلب
    const orders = await base44.entities.Order.filter({ id: orderId });
    if (!orders || orders.length === 0) {
        return Response.json({ error: 'Order not found' }, { status: 404 });
    }
    const order = orders[0];

    // إنشاء PDF
    const doc = new jsPDF();
    
    // إعدادات الخط والألوان (ملاحظة: jsPDF الافتراضي لا يدعم العربية جيداً، لذا سنكتب بالإنجليزية أو نستخدم صورة)
    // سأستخدم الإنجليزية للأمان لضمان عدم ظهور رموز غريبة، وسأضيف الأرقام العربية
    
    // Header
    doc.setFillColor(27, 67, 50); // #1B4332
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("WASEL INVOICE", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text("Order #" + order.order_number, 105, 30, { align: 'center' });

    // Customer Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Bill To:", 20, 60);
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text(order.sender_name || 'Customer', 20, 70);
    doc.text(order.sender_country || '', 20, 78);
    doc.text(order.sender_whatsapp || '', 20, 86);

    // Order Info
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.text("Order Details:", 120, 60);
    doc.setFontSize(12);
    doc.setTextColor(80, 80, 80);
    doc.text("Date: " + new Date(order.created_date).toLocaleDateString(), 120, 70);
    doc.text("Status: " + order.status, 120, 78);
    doc.text("Payment: " + (order.payment_status || 'Pending'), 120, 86);

    // Items Table Header
    let y = 110;
    doc.setFillColor(245, 230, 211); // #F5E6D3
    doc.rect(20, y, 170, 10, 'F');
    doc.setTextColor(27, 67, 50);
    doc.setFontSize(12);
    doc.font = "helvetica";
    doc.setFont(undefined, 'bold');
    doc.text("Description", 30, y + 7);
    doc.text("Amount", 160, y + 7);

    // Items
    y += 20;
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);

    // Order Type Item
    doc.text(`Order Type: ${order.order_type}`, 30, y);
    // إذا كان هناك تفاصيل تكلفة
    if (order.cost_breakdown) {
        y += 10;
        doc.text("Item Cost", 30, y);
        doc.text(order.cost_breakdown.item_cost + " SYP", 160, y);
        
        y += 10;
        doc.text("Delivery Fee", 30, y);
        doc.text(order.cost_breakdown.delivery_fee + " SYP", 160, y);
        
        y += 10;
        doc.text("Service Fee", 30, y);
        doc.text(order.cost_breakdown.service_fee + " SYP", 160, y);
        
        y += 15;
        doc.line(20, y, 190, y);
        y += 10;
        doc.setFont(undefined, 'bold');
        doc.setFontSize(14);
        doc.text("Total", 30, y);
        doc.text(order.cost_breakdown.total + " SYP", 160, y);
    } else {
        doc.text("Total calculation pending", 160, y);
    }

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Thank you for choosing Wasel!", 105, 280, { align: 'center' });

    // تحويل PDF إلى ArrayBuffer
    const pdfOutput = doc.output('arraybuffer');
    
    // إنشاء ملف مؤقت للرفع
    const fileName = `invoice_${order.order_number}.pdf`;
    const tempFilePath = `/tmp/${fileName}`;
    await Deno.writeFile(tempFilePath, new Uint8Array(pdfOutput));
    
    // قراءة الملف كـ File object للرفع (محاكاة)
    // UploadFile يتوقع Form Data مع ملف.
    // Base44 SDK UploadFile يأخذ { file: ... } حيث file هو مسار أو blob.
    // في Deno، UploadFile يتوقع مسار الملف كـ string إذا كان في البيئة المحلية، أو Blob.
    // سأستخدم الـ SDK لرفع الملف من المسار المؤقت.
    // ملاحظة: UploadFile في الـ SDK الحالي للـ Backend قد يتطلب Blob أو File object.
    
    const fileBytes = await Deno.readFile(tempFilePath);
    const fileBlob = new Blob([fileBytes], { type: 'application/pdf' });
    const file = new File([fileBlob], fileName, { type: 'application/pdf' });

    // رفع الملف
    const { file_url } = await base44.integrations.Core.UploadFile({ file: file });

    // إرسال الإشعار مع رابط الفاتورة
    // نستخدم دالة sendNotification الموجودة لتوحيد الشكل
    // نحتاج لاستدعاء sendNotification كـ function internal أو عبر HTTP.
    // الأسهل استدعاؤها عبر SDK.
    
    await base44.functions.invoke('sendNotification', {
        type: 'invoice',
        orderNumber: order.order_number,
        recipientEmail: order.created_by, // البريد الإلكتروني للمستخدم الذي أنشأ الطلب
        recipientName: order.sender_name,
        message: 'Your invoice is ready.',
        additionalData: {
            invoiceUrl: file_url
        }
    });

    return Response.json({ success: true, invoiceUrl: file_url });

  } catch (error) {
    console.error('Error generating invoice:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});