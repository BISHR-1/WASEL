"""
فيديو إعلاني #1 - "حب من بعيد" (30 ثانية)
الفكرة: مغترب يرسل طلب لأهله في درعا - مشاعر الحنين والوصل

pip install moviepy pillow qrcode[pil] arabic-reshaper python-bidi numpy
"""

from moviepy import (
    TextClip, ColorClip, ImageClip, CompositeVideoClip,
    concatenate_videoclips, AudioFileClip, vfx
)
from PIL import Image, ImageDraw, ImageFont
import qrcode
import numpy as np
import os
import textwrap

# ─── الإعدادات ───
WIDTH, HEIGHT = 1080, 1920  # 9:16 للموبايل (Reels/TikTok/Shorts)
FPS = 30
DURATION = 30  # 30 ثانية
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ألوان واصل
WASEL_GREEN = (31, 122, 99)      # #1F7A63
WASEL_CTA = (47, 163, 107)       # #2FA36B
WASEL_DARK = (31, 41, 51)        # #1F2933
WASEL_CREAM = (249, 250, 248)    # #F9FAF8
WHITE = (255, 255, 255)

WEBSITE_URL = "https://www.wasel.life"
APP_DOWNLOAD_URL = "https://www.wasel.life/DownloadApp"


def generate_qr_code(url, size=300):
    """إنشاء QR Code للتطبيق"""
    qr = qrcode.QRCode(version=1, box_size=10, border=2,
                        error_correction=qrcode.constants.ERROR_CORRECT_H)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color=WASEL_DARK, back_color="white").convert("RGB")
    img = img.resize((size, size), Image.LANCZOS)
    return np.array(img)


def create_gradient_frame(w, h, color_top, color_bottom):
    """إنشاء خلفية متدرجة"""
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        ratio = y / h
        arr[y, :] = [
            int(color_top[i] + (color_bottom[i] - color_top[i]) * ratio)
            for i in range(3)
        ]
    return arr


def build_video():
    scenes = []

    # ─── المشهد 1: الافتتاحية (0-5 ثواني) ───
    bg1 = ColorClip(size=(WIDTH, HEIGHT), color=WASEL_DARK, duration=5)
    title1 = TextClip(
        text="بعيد عن أهلك؟",
        font_size=72, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(5).with_position(("center", 600))

    subtitle1 = TextClip(
        text="😔💔",
        font_size=120, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(5).with_position(("center", 800))

    scene1 = CompositeVideoClip([bg1, title1, subtitle1])
    scenes.append(scene1)

    # ─── المشهد 2: الحل (5-12 ثواني) ───
    gradient_bg = ImageClip(
        create_gradient_frame(WIDTH, HEIGHT, WASEL_GREEN, WASEL_CTA)
    ).with_duration(7)

    title2 = TextClip(
        text="واصل ستور",
        font_size=90, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption",
        stroke_color="black", stroke_width=2
    ).with_duration(7).with_position(("center", 500))

    tagline2 = TextClip(
        text="نوصل حبك لحد الباب 💙",
        font_size=56, color="#F9FAF8", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(7).with_position(("center", 700))

    features = TextClip(
        text="🛒 سوبرماركت  🍰 حلويات\n🎁 هدايا  🍕 مطاعم",
        font_size=44, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(7).with_position(("center", 900))

    scene2 = CompositeVideoClip([gradient_bg, title2, tagline2, features])
    scenes.append(scene2)

    # ─── المشهد 3: كيف يعمل (12-20 ثواني) ───
    bg3 = ColorClip(size=(WIDTH, HEIGHT), color=WASEL_CREAM, duration=8)

    step_title = TextClip(
        text="بـ 3 خطوات بس! 🚀",
        font_size=64, color=f"rgb{WASEL_GREEN}", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(8).with_position(("center", 400))

    steps_text = (
        "1⃣ اختار المنتجات من درعا\n\n"
        "2⃣ ادفع بباي بال أو المحفظة\n\n"
        "3⃣ أهلك يستلموا لباب البيت"
    )
    steps = TextClip(
        text=steps_text,
        font_size=44, color=f"rgb{WASEL_DARK}", font="Arial",
        size=(WIDTH - 120, None), method="caption"
    ).with_duration(8).with_position(("center", 650))

    scene3 = CompositeVideoClip([bg3, step_title, steps])
    scenes.append(scene3)

    # ─── المشهد 4: CTA + QR Code (20-30 ثواني) ───
    bg4 = ColorClip(size=(WIDTH, HEIGHT), color=WASEL_DARK, duration=10)

    qr_array = generate_qr_code(APP_DOWNLOAD_URL, size=350)
    qr_clip = ImageClip(qr_array).with_duration(10).with_position(("center", 700))

    cta_text = TextClip(
        text="حمّل التطبيق الآن!",
        font_size=68, color="#2FA36B", font="Arial",
        size=(WIDTH - 100, None), method="caption",
        stroke_color="white", stroke_width=1
    ).with_duration(10).with_position(("center", 500))

    scan_text = TextClip(
        text="📱 امسح الكود لتحميل التطبيق",
        font_size=36, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(10).with_position(("center", 1100))

    url_text = TextClip(
        text=WEBSITE_URL,
        font_size=40, color="#2FA36B", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(10).with_position(("center", 1250))

    tagline_final = TextClip(
        text="وصّل فرحة لأهلك اليوم! 🎁",
        font_size=48, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(10).with_position(("center", 1400))

    scene4 = CompositeVideoClip([bg4, cta_text, qr_clip, scan_text, url_text, tagline_final])
    scenes.append(scene4)

    # ─── تجميع الفيديو ───
    final = concatenate_videoclips(scenes, method="compose")
    output_path = os.path.join(OUTPUT_DIR, "wasel_ad_1_expat_love.mp4")
    final.write_videofile(output_path, fps=FPS, codec="libx264",
                          audio=False, preset="medium")
    print(f"\n✅ تم إنشاء الفيديو: {output_path}")
    return output_path


if __name__ == "__main__":
    build_video()
