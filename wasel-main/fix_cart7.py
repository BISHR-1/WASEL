import re
with open("src/pages/Cart.jsx", "r", encoding="utf-8") as f:
    text = f.read()

text = re.sub(r'المجموع التقريبي:[^{]*\{finalTotalUSD\.toFixed\(2\)\},', '`المجموع التقريبي: $${finalTotalUSD.toFixed(2)}`,', text)

with open("src/pages/Cart.jsx", "w", encoding="utf-8") as f:
    f.write(text)
