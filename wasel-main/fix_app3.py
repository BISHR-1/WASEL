import re
with open("src/App.jsx", "r", encoding="utf-8") as f:
    text = f.read()

text = re.sub(r'<Route\s+path="/shared-cart/:token"\s+element=\{<SharedCartPay\s*/>\}\s*/>', '<Route path="/shared-cart/:token" element={<LayoutWrapper currentPageName="SharedCart"><SharedCartPay /></LayoutWrapper>} />', text)
text = re.sub(r'<Route\s+path="/shared-cart"\s+element=\{<SharedCartPay\s*/>\}\s*/>', '<Route path="/shared-cart" element={<LayoutWrapper currentPageName="SharedCart"><SharedCartPay /></LayoutWrapper>} />', text)
text = re.sub(r'<Route\s+path="/wasel-app/shared-cart/:token"\s+element=\{<SharedCartPay\s*/>\}\s*/>', '<Route path="/wasel-app/shared-cart/:token" element={<LayoutWrapper currentPageName="SharedCart"><SharedCartPay /></LayoutWrapper>} />', text)
text = re.sub(r'<Route\s+path="/wasel-app/shared-cart"\s+element=\{<SharedCartPay\s*/>\}\s*/>', '<Route path="/wasel-app/shared-cart" element={<LayoutWrapper currentPageName="SharedCart"><SharedCartPay /></LayoutWrapper>} />', text)

with open("src/App.jsx", "w", encoding="utf-8") as f:
    f.write(text)
