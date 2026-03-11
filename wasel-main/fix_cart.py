import sys

def fix_cart():
    with open('src/pages/Cart.jsx', 'r', encoding='utf-8') as f:
        text = f.read()

    # Define the old block exactly as it is but we can do a regex or simple text replace
    old_text = "رقم الطلب: ,\n        'تفاصيل السلة:',\n        compactItems || '- لا توجد عناصر',\n        moreItemsNote,\n        '',\n        المجموع التقريبي: 5{finalTotalUSD.toFixed(2)},\n"
    
    new_text = "        // رقم الطلب,\n        'تفاصيل السلة:',\n        compactItems || '- لا توجد عناصر',\n        moreItemsNote,\n        '',\n        المجموع التقريبي: 15{finalTotalUSD.toFixed(2)},\n"
    
    if "رقم الطلب: ," in text:
        text = text.replace("رقم الطلب: ,", "/* رقم الطلب */")
    if "المجموع التقريبي: 5{finalTotalUSD.toFixed(2)}," in text:
        text = text.replace("المجموع التقريبي: 5{finalTotalUSD.toFixed(2)},", "المجموع التقريبي: 15{finalTotalUSD.toFixed(2)},")
        
    with open('src/pages/Cart.jsx', 'w', encoding='utf-8') as f:
        f.write(text)

fix_cart()
