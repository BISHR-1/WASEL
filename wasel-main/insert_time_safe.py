import re

with open("src/pages/DriverPanel.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Add Clock to imports
text = text.replace("ShieldAlert,\n}", "ShieldAlert,\n  Clock,\n}")

# Add render function helper above driver panel component or inline. We'll just define the html snippet and inject it.

# In the active order view:
# <p className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {focusedOrder.recipient_details?.address || '-'}</p></div>
target1 = r'(<p className="flex items-center gap-1"><MapPin className="w-4 h-4" /> \{focusedOrder\.recipient_details\?\.address \|\| \'-\'\}</p>)'

replacement1 = r"""\1
{(() => {
  const userTime = focusedOrder.recipient_details?.delivery_time;
  const supervisorTime = focusedOrder.delivery_time || `${focusedOrder.preferred_delivery_date || ''} ${focusedOrder.preferred_delivery_time || ''}`.trim();
  const timeToShow = userTime || supervisorTime;
  if (!timeToShow) return null;
  return (
    <p className="flex items-center gap-1 mt-2 text-[#92400E] bg-[#FEF3C7] p-2 rounded-lg text-xs font-bold border border-[#FDE68A]">
      <Clock className="w-4 h-4" />
      {userTime ? `المطلوب: ${userTime}` : `المتوقع من المشرف: ${supervisorTime}`}
    </p>
  );
})()}
"""
text = re.sub(target1, replacement1, text, flags=re.MULTILINE)

# In the archive view:
# <p className="text-xs text-[#64748B]">{order.recipient_details?.name || '-'} - {order.recipient_details?.phone || '-'}</p></div>
target2 = r'(<p className="text-xs text-\[\#64748B\]">\{order\.recipient_details\?\.name \|\| \'-\'\} - \{order\.recipient_details\?\.phone \|\| \'-\'\}</p></div>)'

replacement2 = r"""\1
{(() => {
  const userTime = order.recipient_details?.delivery_time;
  const supervisorTime = order.delivery_time || `${order.preferred_delivery_date || ''} ${order.preferred_delivery_time || ''}`.trim();
  const timeToShow = userTime || supervisorTime;
  if (!timeToShow) return null;
  return (
    <div className="flex items-center gap-1 mt-2 text-[#92400E] bg-[#FEF3C7] p-2 rounded-lg text-[10px] font-bold border border-[#FDE68A] w-max">
      <Clock className="w-3 h-3" />
      {userTime ? `المطلوب: ${userTime}` : `المتوقع من المشرف: ${supervisorTime}`}
    </div>
  );
})()}
"""
text = re.sub(target2, replacement2, text, flags=re.MULTILINE)


with open("src/pages/DriverPanel.jsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Updated DriverPanel with delivery time safe")
