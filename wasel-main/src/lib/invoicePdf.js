import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

function pick(...vals) {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    const s = String(v).trim();
    if (s) return s;
  }
  return '-';
}

export async function downloadOrderInvoicePdf(order, options = {}) {
  const language = options.language || 'ar';
  
  const createdAt = order?.created_at ? new Date(order.created_at) : new Date();
  const invoiceNumber = order?.order_number || order?.id || `WSL-${Date.now()}`;

  const items = Array.isArray(order?.items) ? order.items : [];
  const exchangeRate = Number(order?.exchange_rate) > 0 ? Number(order.exchange_rate) : 150;
  const totalUsd = Number(order?.total_usd ?? order?.total_amount ?? 0) || 0;
  const totalSyp = Number(order?.total_syp ?? (totalUsd * exchangeRate) ?? 0) || 0;
  const paymentMethod = order?.payment_method || (order?.payment_status === 'succeeded' ? 'paypal' : 'whatsapp');

  const sender = order?.sender_details || {};
  const recipient = order?.recipient_details || {};

  const senderName = pick(sender?.name, sender?.full_name, sender?.sender_name, order?.sender_name);
  const recipientName = pick(recipient?.name, recipient?.full_name, recipient?.recipient_name, order?.recipient_name);
  const senderPhone = pick(sender?.phone, sender?.mobile, sender?.sender_phone, order?.sender_phone);
  const recipientPhone = pick(recipient?.phone, recipient?.mobile, recipient?.recipient_phone, order?.recipient_phone);
  const senderAddress = pick(sender?.address, sender?.city, sender?.region, order?.sender_address);
  // recipient address fallback includes delivery_address
  const recipientAddress = pick(recipient?.address, order?.delivery_address, recipient?.city, recipient?.region, order?.recipient_address);

  const isAr = language === 'ar';
  const qrPayload = `Invoice:${invoiceNumber}|TotalUSD:${totalUsd.toFixed(2)}|Payment:${paymentMethod}|Date:${createdAt.toISOString()}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload)}`;
  const logoUrl = '/logo/wasel-logo.png';

  const rowsHtml = items.map((item, idx) => {
    const qty = Number(item?.quantity || 1) || 1;
    const unitSyp = Number(item?.priceSYP ?? item?.price_syp ?? item?.price ?? item?.unit_price ?? 0) || 0;
    const lineTotal = qty * unitSyp;
    const name = item?.name_ar || item?.product_name || item?.name || (isAr ? `صنف ${idx + 1}` : `Item ${idx + 1}`);

    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${idx + 1}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: ${isAr ? 'right' : 'left'}; font-weight: 500;">${name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${qty}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: ${isAr ? 'left' : 'right'};" dir="ltr">${Math.round(unitSyp).toLocaleString('en-US')} ل.س</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: ${isAr ? 'left' : 'right'}; font-weight: bold;" dir="ltr">${Math.round(lineTotal).toLocaleString('en-US')} ل.س</td>
      </tr>
    `;
  }).join('');

  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '-9999px'; // keep hidden
  container.style.left = '0';
  container.style.width = '800px';
  container.style.zIndex = '-99';

  // We use Cairo/Tajawal font or a system fallback if not available
  container.innerHTML = `
    <div id="invoice-capture" dir="${isAr ? 'rtl' : 'ltr'}" style="
      background-color: #ffffff;
      padding: 40px;
      color: #1f2937;
      font-family: 'Cairo', 'Tajawal', 'Almarai', system-ui, -apple-system, sans-serif;
      box-sizing: border-box;
    ">
      <!-- Header Section -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px;">
        <div style="display: flex; gap: 16px; align-items: center;">
          <img src="${logoUrl}" style="width: 70px; height: 70px; object-fit: contain; border-radius: 12px; border: 1px solid #e5e7eb; padding: 4px;" alt="Logo" crossorigin="anonymous" />
          <div>
            <h1 style="margin: 0; font-size: 28px; color: #111827; font-weight: 800;">${isAr ? 'فاتورة واصل ستور' : 'Wasel Store Invoice'}</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">
              ${isAr ? 'منصة واصل ستور للتسوق والتوصيل السريع' : 'Wasel Store Shopping & Fast Delivery'}
            </p>
          </div>
        </div>
        <div style="text-align: ${isAr ? 'left' : 'right'}; display: flex; flex-direction: column; gap: 4px;">
          <h2 style="margin: 0; font-size: 20px; color: #374151;">${isAr ? 'رقم الفاتورة' : 'Invoice No'} #</h2>
          <span style="font-weight: 700; font-size: 16px; color: #111827; direction: ltr; display: inline-block;">${invoiceNumber}</span>
          <div style="font-size: 14px; color: #4b5563; margin-top: 4px;">
            ${isAr ? 'التاريخ:' : 'Date:'} <span dir="ltr">${createdAt.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB')}</span>
          </div>
          <div style="font-size: 14px; color: #4b5563;">
            ${isAr ? 'طريقة الدفع:' : 'Payment:'} <strong>${paymentMethod === 'paypal' ? 'PayPal' : 'WhatsApp'}</strong>
          </div>
        </div>
      </div>

      <!-- Sender & Recipient Blocks -->
      <div style="display: flex; justify-content: space-between; gap: 24px; margin-bottom: 40px;">
        <!-- Sender -->
        <div style="flex: 1; background: #f9fafb; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #4b5563; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">
            ${isAr ? 'بيانات المرسل' : 'Sender Details'}
          </h3>
          <div style="font-size: 15px; margin-bottom: 8px;"><strong>${isAr ? 'الاسم:' : 'Name:'}</strong> ${senderName}</div>
          <div style="font-size: 15px; margin-bottom: 8px;"><strong>${isAr ? 'الهاتف:' : 'Phone:'}</strong> <span dir="ltr">${senderPhone}</span></div>
          <div style="font-size: 15px;"><strong>${isAr ? 'العنوان:' : 'Address:'}</strong> ${senderAddress}</div>
        </div>
        
        <!-- Recipient -->
        <div style="flex: 1; background: #f0fdf4; padding: 20px; border-radius: 12px; border: 1px solid #dcfce7;">
          <h3 style="margin: 0 0 12px 0; font-size: 16px; color: #166534; border-bottom: 1px solid #dcfce7; padding-bottom: 8px;">
            ${isAr ? 'بيانات المستلم' : 'Recipient Details'}
          </h3>
          <div style="font-size: 15px; margin-bottom: 8px;"><strong>${isAr ? 'الاسم:' : 'Name:'}</strong> ${recipientName}</div>
          <div style="font-size: 15px; margin-bottom: 8px;"><strong>${isAr ? 'الهاتف:' : 'Phone:'}</strong> <span dir="ltr">${recipientPhone}</span></div>
          <div style="font-size: 15px;"><strong>${isAr ? 'العنوان:' : 'Address:'}</strong> ${recipientAddress}</div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 40px;">
        <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #111827;">${isAr ? 'تفاصيل الطلب' : 'Order Items'}</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background-color: #f3f4f6; color: #374151; font-size: 14px;">
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">#</th>
              <th style="padding: 12px; text-align: ${isAr ? 'right' : 'left'}; border-bottom: 2px solid #e5e7eb;">${isAr ? 'المنتج' : 'Item'}</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb;">${isAr ? 'الكمية' : 'Qty'}</th>
              <th style="padding: 12px; text-align: ${isAr ? 'left' : 'right'}; border-bottom: 2px solid #e5e7eb;">${isAr ? 'السعر' : 'Unit Price'}</th>
              <th style="padding: 12px; text-align: ${isAr ? 'left' : 'right'}; border-bottom: 2px solid #e5e7eb;">${isAr ? 'المجموع' : 'Total'}</th>
            </tr>
          </thead>
          <tbody style="font-size: 15px;">
            ${rowsHtml || `<tr><td colspan="5" style="padding:20px; text-align:center; color:#9ca3af;">${isAr ? 'لا توجد منتجات' : 'No items'}</td></tr>`}
          </tbody>
        </table>
      </div>

      <!-- Totals & Footer -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end;">
        <div style="flex: 0 0 auto;">
          <img src="${qrUrl}" alt="QR Code" crossorigin="anonymous" style="width: 100px; height: 100px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 4px;" />
        </div>
        
        <div style="flex: 0 0 350px; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb;">
          <div style="display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 12px;">
            <span style="color: #4b5563;">${isAr ? 'المجموع بالليرة السورية:' : 'Total SYP:'}</span>
            <span style="font-weight: 600;" dir="ltr">${Math.round(totalSyp).toLocaleString('en-US')} ل.س</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 15px; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px dashed #cbd5e1;">
            <span style="color: #4b5563;">${isAr ? 'سعر الصرف المعتمد:' : 'Exchange Rate:'}</span>
            <span dir="ltr">${exchangeRate.toLocaleString('en-US')} ل.س</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: 800; color: #111827;">
            <span>${isAr ? 'الإجمالي (دولار):' : 'Final Total (USD):'}</span>
            <span dir="ltr">$${totalUsd.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style="text-align: center; margin-top: 50px; padding-top: 20px; border-top: 1px solid #f3f4f6; color: #9ca3af; font-size: 12px;">
        ${isAr ? 'شكراً لتعاملكم مع واصل ستور. هذه الفاتورة إلكترونية ولا تحتاج لتوقيع.' : 'Thank you for choosing Wasel Store. This is an electronic invoice and does not require a signature.'}
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const captureEl = document.getElementById('invoice-capture');
    
    // We wait briefly for remote images (logo/QR) to load if cache fails
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const canvas = await html2canvas(captureEl, {
      scale: 2, // higher resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // A4 dims in mm: 210 x 297
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    // Mobile-friendly download: blob + window.open fallback
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const fileName = `Wasel_Invoice_${invoiceNumber}.pdf`;

    if (isMobile) {
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      // Try share API first (works well on mobile)
      if (navigator.share && navigator.canShare?.({ files: [new File([blob], fileName, { type: 'application/pdf' })] })) {
        try {
          await navigator.share({
            files: [new File([blob], fileName, { type: 'application/pdf' })],
            title: isAr ? 'فاتورة واصل ستور' : 'Wasel Store Invoice',
          });
        } catch {
          // User cancelled share or share failed - open in new tab
          window.open(blobUrl, '_blank');
        }
      } else {
        // Fallback: open blob URL in new tab
        window.open(blobUrl, '_blank');
      }
    } else {
      pdf.save(fileName);
    }
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    alert(isAr ? 'فشل توليد الفاتورة، يرجى المحاولة لاحقاً' : 'Failed to generate invoice.');
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
