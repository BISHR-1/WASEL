import re

with open('src/pages/Cart.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace any malformed line containing "المجموع التقريبي:"
text = re.sub(r"المجموع التقريبي:[ \S]*\{finalTotalUSD\.toFixed\(2\)\},", "المجموع التقريبي: push{finalTotalUSD.toFixed(2)},", text)

with open('src/pages/Cart.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
