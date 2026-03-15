"""
فيديو إعلاني #2 - "سوبرماركت لباب البيت" (30 ثانية)
الفكرة: عرض تنوع المنتجات مع التوصيل السريع

pip install moviepy pillow qrcode[pil] numpy
"""

from moviepy import (
    TextClip, ColorClip, ImageClip, CompositeVideoClip,
    concatenate_videoclips, vfx
)
import qrcode
import numpy as np
from PIL import Image
import os

WIDTH, HEIGHT = 1080, 1920
FPS = 30
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

WASEL_GREEN = (31, 122, 99)
WASEL_CTA = (47, 163, 107)
WASEL_DARK = (31, 41, 51)
WASEL_CREAM = (249, 250, 248)

WEBSITE_URL = "https://www.wasel.life"
APP_DOWNLOAD_URL = "https://www.wasel.life/DownloadApp"


def generate_qr(url, size=300):
    qr = qrcode.QRCode(version=1, box_size=10, border=2,
                        error_correction=qrcode.constants.ERROR_CORRECT_H)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1F2933", back_color="white").convert("RGB")
    return np.array(img.resize((size, size), Image.LANCZOS))


def create_radial_bg(w, h, center_color, edge_color):
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    cx, cy = w // 2, h // 2
    max_dist = np.sqrt(cx**2 + cy**2)
    for y in range(h):
        for x in range(0, w, 4):  # تسريع: كل 4 بكسلات
            dist = np.sqrt((x - cx)**2 + (y - cy)**2) / max_dist
            dist = min(dist, 1.0)
            color = [int(center_color[i] + (edge_color[i] - center_color[i]) * dist) for i in range(3)]
            arr[y, x:x+4] = color
    return arr


def build_video():
    scenes = []

    # ─── المشهد 1: العنوان الرئيسي (0-6 ثواني) ───
    bg1 = ColorClip(size=(WIDTH, HEIGHT), color=WASEL_GREEN, duration=6)

    emoji_grid = TextClip(
        text="🥬🍅🥩🧀\n🍞🥛🧃🫒\n🍰🍫🧁☕",
        font_size=80, color="white", font="Arial",
        size=(WIDTH - 80, None), method="caption"
    ).with_duration(6).with_position(("center", 350))

    title1 = TextClip(
        text="كل اللي بتحتاجه\nبمكان واحد!",
        font_size=72, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption",
        stroke_color="black", stroke_width=2
    ).with_duration(6).with_position(("center", 850))

    scene1 = CompositeVideoClip([bg1, emoji_grid, title1])
    scenes.append(scene1)

    # ─── المشهد 2: الأقسام (6-13 ثواني) ───
    bg2 = ColorClip(size=(WIDTH, HEIGHT), color=WASEL_CREAM, duration=7)

    sections_title = TextClip(
        text="أقسام واصل ستور 🏪",
        font_size=60, color=f"rgb{WASEL_GREEN}", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(7).with_position(("center", 350))

    sections = TextClip(
        text=(
            "🛒 سوبرماركت - خضار وفواكه طازجة\n\n"
            "🍕 مطاعم - ألذ الأكلات\n\n"
            "🍰 حلويات - كنافة وبقلاوة\n\n"
            "🎁 هدايا - فرّح أحبابك\n\n"
            "📦 طرود - وصّل أي شي"
        ),
        font_size=40, color=f"rgb{WASEL_DARK}", font="Arial",
        size=(WIDTH - 120, None), method="caption"
    ).with_duration(7).with_position(("center", 600))

    scene2 = CompositeVideoClip([bg2, sections_title, sections])
    scenes.append(scene2)

    # ─── المشهد 3: التوصيل (13-20 ثواني) ───
    bg3 = ColorClip(size=(WIDTH, HEIGHT), color=WASEL_DARK, duration=7)

    delivery_icon = TextClip(
        text="🏍️💨",
        font_size=150, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(7).with_position(("center", 500))

    delivery_text = TextClip(
        text="توصيل سريع لباب البيت\nفي درعا سوريا 🇸🇾",
        font_size=56, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(7).with_position(("center", 850))

    delivery_sub = TextClip(
        text="ادفع بباي بال 💳 أو المحفظة 👛",
        font_size=40, color="#2FA36B", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(7).with_position(("center", 1100))

    scene3 = CompositeVideoClip([bg3, delivery_icon, delivery_text, delivery_sub])
    scenes.append(scene3)

    # ─── المشهد 4: CTA + QR (20-30 ثواني) ───
    bg4 = ColorClip(size=(WIDTH, HEIGHT), color=WASEL_GREEN, duration=10)

    cta = TextClip(
        text="اطلب الآن! 🛒",
        font_size=72, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption",
        stroke_color="black", stroke_width=2
    ).with_duration(10).with_position(("center", 400))

    qr_clip = ImageClip(generate_qr(APP_DOWNLOAD_URL, 350)).with_duration(10).with_position(("center", 650))

    qr_label = TextClip(
        text="📱 امسح لتحميل التطبيق",
        font_size=36, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(10).with_position(("center", 1060))

    url = TextClip(
        text=WEBSITE_URL,
        font_size=44, color="#F9FAF8", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(10).with_position(("center", 1200))

    brand = TextClip(
        text="واصل ستور 💚 نوصل حبك لحد الباب",
        font_size=40, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(10).with_position(("center", 1400))

    scene4 = CompositeVideoClip([bg4, cta, qr_clip, qr_label, url, brand])
    scenes.append(scene4)

    final = concatenate_videoclips(scenes, method="compose")
    output_path = os.path.join(OUTPUT_DIR, "wasel_ad_2_grocery.mp4")
    final.write_videofile(output_path, fps=FPS, codec="libx264",
                          audio=False, preset="medium")
    print(f"\n✅ تم إنشاء الفيديو: {output_path}")


if __name__ == "__main__":
    build_video()
