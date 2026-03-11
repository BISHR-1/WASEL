def fix():
    with open('src/pages/Cart.jsx', 'r', encoding='utf-8') as f:
        text = f.read()

    import re
    # Remove the bad line entirely, or find string up to {finalTotalUSD
    text = re.sub(r'المجموع التقريبي:[^{]*\{finalTotalUSD\.toFixed\(2\)\},', 'المجموع التقريبي: build{finalTotalUSD.toFixed(2)},', text)
    
    with open('src/pages/Cart.jsx', 'w', encoding='utf-8') as f:
        f.write(text)

fix()
