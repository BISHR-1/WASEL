import re

with open("src/pages/MyOrders.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Make sure Clock is imported
if "Clock," not in text and "Clock " not in text:
    text = text.replace("RefreshCw,", "RefreshCw,\n  Clock,")

# find the expected delivery time block
target = r"\{\(order\.preferred_delivery_date \|\| order\.preferred_delivery_time \|\| order\.delivery_time\) && \(\s*<p className=\"mr-6 text-xs text-\[\#1B4332\] mt-1 font-semibold\">\s*\{language === 'ar' \? 'موعد التسليم المتوقع:' : 'Expected delivery:'\}\s*\{' '\}\s*\{order\.delivery_time \|\| `\$\{order\.preferred_delivery_date \|\| ''\} \$\{order\.preferred_delivery_time \|\| ''\}`\.trim\(\)\}\s*</p>\s*\)\}"

replacement = r"""{(() => {
                               const userTime = order.recipient_details?.delivery_time;
                               const supervisorTime = order.delivery_time || `${order.preferred_delivery_date || ''} ${order.preferred_delivery_time || ''}`.trim();
                               const timeToShow = supervisorTime || userTime;
                               if (!timeToShow) return null;
                               return (
                                 <p className="mr-6 text-xs text-[#1B4332] mt-1 font-semibold flex items-center gap-1">
                                   <Clock className="w-3 h-3" />
                                   {supervisorTime ? (language === 'ar' ? `موعد التسليم المتوقع (من المشرف): ${supervisorTime}` : `Supervisor Expected: ${supervisorTime}`) : (language === 'ar' ? `الموعد المطلوب: ${userTime}` : `Requested: ${userTime}`)}
                                 </p>
                               );
                             })()}"""

text = re.sub(target, replacement, text, flags=re.MULTILINE)

with open("src/pages/MyOrders.jsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated MyOrders.jsx correctly")
