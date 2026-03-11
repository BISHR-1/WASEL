import re
import traceback

try:
    with open("src/pages/DriverPanel.jsx", "r", encoding="utf-8") as f:
        text = f.read()

    # 1. Add Profile to tabs
    tabs_div = r'<div className="flex gap-2"><Button variant={activeTab === \'active\' \? \'default\' : \'outline\'} onClick={\(\) => setActiveTab\(\'active\'\)} className="rounded-xl">طلبات حالية \(\{activeOrders\.length\}\)</Button><Button variant={activeTab === \'archive\' \? \'default\' : \'outline\'} onClick={\(\) => setActiveTab\(\'archive\'\)} className="rounded-xl">سجل الطلبات \(\{archivedOrders\.length\}\)</Button></div>'
    new_tabs_div = """<div className="flex gap-2 flex-wrap mb-4">
              <Button variant={activeTab === 'active' ? 'default' : 'outline'} onClick={() => setActiveTab('active')} className="rounded-xl">طلبات حالية ({activeOrders.length})</Button>
              <Button variant={activeTab === 'archive' ? 'default' : 'outline'} onClick={() => setActiveTab('archive')} className="rounded-xl">سجل الطلبات ({archivedOrders.length})</Button>
              <Button variant={activeTab === 'profile' ? 'default' : 'outline'} onClick={() => setActiveTab('profile')} className="rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 border-none">الملف الشخصي</Button>
            </div>"""
    text = re.sub(tabs_div, new_tabs_div, text, flags=re.MULTILINE)

    section_pattern = r'(<motion\.section initial=\{\{ opacity: 0, y: 10 \}\}.*?</motion\.section>)'
    matches = re.findall(section_pattern, text, flags=re.DOTALL)
    if matches:
        profile_section = matches[0]
        
        # Display images if id_front_url / id_back_url exists
        img_display = """
              {courierProfile?.id_front_url && (
                <div className="mt-2"><span className="text-xs text-gray-500 block mb-1">صورة الهوية (الأمام) الحالية:</span><img src={courierProfile.id_front_url} alt="ID Front" className="w-full h-32 object-contain rounded-xl border border-[#E5E7EB]" /></div>
              )}"""
        profile_section = profile_section.replace('text-xs" /></label>', 'text-xs" />' + img_display + '</label>', 1)

        img_display_back = """
              {courierProfile?.id_back_url && (
                <div className="mt-2"><span className="text-xs text-gray-500 block mb-1">صورة الهوية (الخلف) الحالية:</span><img src={courierProfile.id_back_url} alt="ID Back" className="w-full h-32 object-contain rounded-xl border border-[#E5E7EB]" /></div>
              )}"""
        # Because we already replaced the first 'text-xs" /></label>', the second one is for back file.
        profile_section = profile_section.replace('text-xs" /></label>', 'text-xs" />' + img_display_back + '</label>', 1)

        # Replace original occurrence with ''
        text = text.replace(matches[0], '')
        
        # Place it inside the tab
        # Wait, the tabs div is rendered AFTER the big {!isOnboardingComplete && blocks.
        # But we want to place it when ctiveTab === 'profile'.
        replacement = "{activeTab === 'profile' && (\n" + profile_section + "\n)}\n{activeTab === 'active' && ("
        text = text.replace("{activeTab === 'active' && (", replacement)
        
    with open("src/pages/DriverPanel.jsx", "w", encoding="utf-8") as f:
        f.write(text)
    
    print("Patched DriverPanel.jsx")
except Exception as e:
    traceback.print_exc()
