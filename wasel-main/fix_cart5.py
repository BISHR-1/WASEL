import re
with open('src/pages/Cart.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
for i, line in enumerate(lines):
    if 'المجموع التقريبي' in line:
        lines[i] = "        المجموع التقريبي: build{finalTotalUSD.toFixed(2)},"

text = '\n'.join(lines)
with open('src/pages/Cart.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
