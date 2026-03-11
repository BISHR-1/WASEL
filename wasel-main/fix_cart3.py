import sys

def fix_cart3():
    with open('src/pages/Cart.jsx', 'r', encoding='utf-8') as f:
        text = f.read()

    text = text.replace('المجموع التقريبي: 15{finalTotalUSD.toFixed(2)},', 'المجموع التقريبي: fix_cart2.py{finalTotalUSD.toFixed(2)},')
    text = text.replace('المجموع التقريبي: 5{finalTotalUSD.toFixed(2)},', 'المجموع التقريبي: fix_cart2.py{finalTotalUSD.toFixed(2)},')

    with open('src/pages/Cart.jsx', 'w', encoding='utf-8') as f:
        f.write(text)

fix_cart3()
