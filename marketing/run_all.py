"""
تشغيل جميع سكريبتات التسويق دفعة واحدة
أو اختيار سكريبت محدد

pip install moviepy pillow qrcode[pil] numpy
"""

import subprocess
import sys
import os

SCRIPTS = {
    # فيديوهات إعلانية (30 ثانية)
    "v1": ("video_ad_1_expat_love.py", "فيديو - حب من بعيد (المغتربين)"),
    "v2": ("video_ad_2_grocery_delivery.py", "فيديو - سوبرماركت لباب البيت"),
    "v3": ("video_ad_3_ramadan_gifts.py", "فيديو - هدايا رمضان والمناسبات"),
    "v4": ("video_ad_4_shared_cart.py", "فيديو - السلة المشتركة"),
    "v5": ("video_ad_5_trust_security.py", "فيديو - ثقة وأمان"),
    # بوستات إعلانية
    "p1": ("post_ad_1_expat.py", "بوست - أرسل لأهلك"),
    "p2": ("post_ad_2_special_offer.py", "بوست - عرض خاص"),
    "p3": ("post_ad_3_how_it_works.py", "بوست - كيف يعمل واصل"),
    "p4": ("post_ad_4_reviews.py", "بوست - شهادات العملاء"),
    "p5": ("post_ad_5_download_app.py", "بوست - حمّل التطبيق"),
}

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))

    if len(sys.argv) > 1:
        choice = sys.argv[1].lower()
        if choice == "all":
            keys = list(SCRIPTS.keys())
        elif choice == "videos":
            keys = [k for k in SCRIPTS if k.startswith("v")]
        elif choice == "posts":
            keys = [k for k in SCRIPTS if k.startswith("p")]
        elif choice in SCRIPTS:
            keys = [choice]
        else:
            print(f"❌ خيار غير صالح: {choice}")
            print_help()
            return
    else:
        print_help()
        return

    for key in keys:
        filename, desc = SCRIPTS[key]
        filepath = os.path.join(script_dir, filename)
        print(f"\n{'=' * 60}")
        print(f"🎬 تشغيل: {desc}")
        print(f"📄 الملف: {filename}")
        print(f"{'=' * 60}")
        subprocess.run([sys.executable, filepath], cwd=script_dir)

    print(f"\n{'=' * 60}")
    print(f"✅ تم الانتهاء! المخرجات في مجلد: {os.path.join(script_dir, 'output')}")
    print(f"{'=' * 60}")


def print_help():
    print("""
╔══════════════════════════════════════════════════════════╗
║          🎬 واصل ستور - أدوات التسويق                  ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  الاستخدام:                                              ║
║    python run_all.py [خيار]                              ║
║                                                          ║
║  الخيارات:                                               ║
║    all     - تشغيل كل السكريبتات                        ║
║    videos  - تشغيل الفيديوهات فقط                       ║
║    posts   - تشغيل البوستات فقط                         ║
║    v1-v5   - تشغيل فيديو محدد                           ║
║    p1-p5   - تشغيل بوست محدد                            ║
║                                                          ║
╠══════════════════════════════════════════════════════════╣
║  الفيديوهات:                                             ║
""")
    for key, (_, desc) in SCRIPTS.items():
        prefix = "║" if key.startswith("v") or key == "p1" else "║"
        if key == "p1":
            print("╠══════════════════════════════════════════════════════════╣")
            print("║  البوستات:                                               ║")
        print(f"║    {key}: {desc:<50}║")
    print("╚══════════════════════════════════════════════════════════╝")


if __name__ == "__main__":
    main()
