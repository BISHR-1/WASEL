import sys

def fix_cart2():
    with open('src/pages/Cart.jsx', 'r', encoding='utf-8') as f:
        text = f.read()

    # Look for the exact line
    for line in text.split('\n'):
        if 'المجموع التقريبي:' in line:
            print("FOUND:", repr(line))

fix_cart2()
