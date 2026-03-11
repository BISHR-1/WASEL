import sys
with open('src/App.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('<Route path="/shared-cart/:token" element={<SharedCartPay />} />', '<Route path="/shared-cart/:token" element={<LayoutWrapper currentPageName="SharedCart"><SharedCartPay /></LayoutWrapper>} />')
text = text.replace('<Route path="/shared-cart" element={<SharedCartPay />} />', '<Route path="/shared-cart" element={<LayoutWrapper currentPageName="SharedCart"><SharedCartPay /></LayoutWrapper>} />')
text = text.replace('<Route path="/wasel-app/shared-cart/:token" element={<SharedCartPay />} />', '<Route path="/wasel-app/shared-cart/:token" element={<LayoutWrapper currentPageName="SharedCart"><SharedCartPay /></LayoutWrapper>} />')
text = text.replace('<Route path="/wasel-app/shared-cart" element={<SharedCartPay />} />', '<Route path="/wasel-app/shared-cart" element={<LayoutWrapper currentPageName="SharedCart"><SharedCartPay /></LayoutWrapper>} />')

with open('src/App.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
