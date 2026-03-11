export const INVOICE_TEMPLATE = {
  // You can provide JPG/PNG OR PDF template in public/invoice/.
  imageCandidates: [
    '/invoice/template.jpg.pdf',
    '/invoice/template.pdf',
    '/invoice/template.jpg',
    '/invoice/template.jpeg',
    '/invoice/template.png',
  ],
  // A4 portrait in points (jsPDF pt units)
  page: { width: 595, height: 842 },
  // Right-side anchors for RTL text placement.
  text: {
    fontSize: 11,
    color: [18, 18, 18],
  },
  fields: {
    date: { x: 300, y: 201, maxWidth: 230 },
    orderNumber: { x: 300, y: 229, maxWidth: 230 },
    senderName: { x: 300, y: 257, maxWidth: 230 },
    recipientName: { x: 300, y: 285, maxWidth: 230 },

    senderPhone: { x: 525, y: 201, maxWidth: 170 },
    recipientPhone: { x: 525, y: 229, maxWidth: 170 },
    senderAddress: { x: 525, y: 257, maxWidth: 170 },
    recipientAddress: { x: 525, y: 285, maxWidth: 170 },

    paymentMethod: { x: 505, y: 777, maxWidth: 160 },
    totalSyp: { x: 530, y: 668, maxWidth: 130 },
  },
  table: {
    startY: 357,
    rowHeight: 34.5,
    maxRows: 8,
    dateX: 96,
    itemX: 236,
    priceX: 392,
    qtyX: 446,
    totalX: 536,
    itemMaxWidth: 188,
  },
  qr: { x: 500, y: 36, size: 64 },
};
