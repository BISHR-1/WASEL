import re
with open("src/pages/Cart.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Fix the join newline
text = text.replace("].filter(Boolean).join('\n');", "].filter(Boolean).join('\\n');")

with open("src/pages/Cart.jsx", "w", encoding="utf-8") as f:
    f.write(text)
