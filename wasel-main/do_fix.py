import re

with open("src/pages/DriverPanel.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# Let's revert the file to git state first to avoid messes
import subprocess
subprocess.run(["git", "checkout", "--", "src/pages/DriverPanel.jsx"])

with open("src/pages/DriverPanel.jsx", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Extract Profile Section
section_pattern = r'(<motion\.section initial=\{\{ opacity: 0, y: 10 \}\}.*?</motion\.section>)'
matches = re.findall(section_pattern, text, flags=re.DOTALL)
profile_section = matches[0]

# Add images to profile_section
img_display = """
          {courierProfile?.id_front_url && (
            <div className="mt-2"><span className="text-xs text-gray-500 block mb-1">صورة الهوية (الأمام) الحالية:</span><img src={courierProfile.id_front_url} alt="ID Front" className="w-full h-32 object-contain rounded-xl border border-[#E5E7EB]" /></div>
          )}"""
profile_section = profile_section.replace('text-xs" /></label>', 'text-xs" />' + img_display + '</label>', 1)

img_display_back = """
          {courierProfile?.id_back_url && (
            <div className="mt-2"><span className="text-xs text-gray-500 block mb-1">صورة الهوية (الخلف) الحالية:</span><img src={courierProfile.id_back_url} alt="ID Back" className="w-full h-32 object-contain rounded-xl border border-[#E5E7EB]" /></div>
          )}"""
profile_section = profile_section.replace('text-xs" /></label>', 'text-xs" />' + img_display_back + '</label>', 1)

# Modify tabs
tabs_original = r"""<div className="flex gap-2"><Button variant={activeTab === 'active' \? 'default' : 'outline'} onClick={\(\) => setActiveTab\('active'\)} className="rounded-xl">طلبات حالية \(\{activeOrders\.length\}\)</Button><Button variant={activeTab === 'archive' \? 'default' : 'outline'} onClick={\(\) => setActiveTab\('archive'\)} className="rounded-xl">سجل الطلبات \(\{archivedOrders\.length\}\)</Button></div>"""
tabs_new = """{isOnboardingComplete && (
  <div className="flex gap-2 flex-wrap mb-4">
    <Button variant={activeTab === 'active' ? 'default' : 'outline'} onClick={() => setActiveTab('active')} className="rounded-xl">طلبات حالية ({activeOrders.length})</Button>
    <Button variant={activeTab === 'archive' ? 'default' : 'outline'} onClick={() => setActiveTab('archive')} className="rounded-xl">سجل الطلبات ({archivedOrders.length})</Button>
    <Button variant={activeTab === 'profile' ? 'default' : 'outline'} onClick={() => setActiveTab('profile')} className="rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 border-none">الملف الشخصي</Button>
  </div>
)}"""

# Replace tabs_original with empty string first, because we will place it dynamically
text = re.sub(tabs_original, '', text, flags=re.MULTILINE)

# Remove the original profile_section from text
text = text.replace(matches[0], '')

# Let's insert the tabs_new to be just inside the main tag
main_pattern = r'(<main className="max-w-6xl mx-auto px-4 py-6 space-y-6">)'
text = re.sub(main_pattern, r'\1\n        ' + tabs_new, text)

# Now, place the profile_section conditionally BEFORE {!isOnboardingComplete && (
profile_placer = "        {( !isOnboardingComplete || activeTab === 'profile' ) && (\n" + profile_section + "\n        )}\n\n"
text = text.replace("{!isOnboardingComplete && (", profile_placer + "        {!isOnboardingComplete && (")

# Finally, we want the stats/bonuses elements to NOT show up when activeTab is profile
# We have a large block: {isOnboardingComplete && (<> ... </>)}
# Inside there, we can dynamically add {activeTab !== 'profile' && ( to hide some parts or just rely on the existing tabs. But actually, those stat sections are completely outside the activeTab condition.
# The user wants "Move driver info to a new tab called Profile", so we did that. The other info like Bonus and Salary can stay visible above the tabs or can be moved inside active/archive views. Let's just leave them as they are, but since we added the Tabs above, it'll look like Tabs, then stats, then tab content. That's a bit misordered. 
# Better place the Tabs below the Stats. Or move the stats inside ctiveTab !== 'profile'.
# Let's wrap {isOnboardingComplete && ( block in {isOnboardingComplete && activeTab !== 'profile' && (
text = text.replace("{isOnboardingComplete && (", "{isOnboardingComplete && activeTab !== 'profile' && (")

with open("src/pages/DriverPanel.jsx", "w", encoding="utf-8") as f:
    f.write(text)

print("Formatting DriverPanel complete!")
