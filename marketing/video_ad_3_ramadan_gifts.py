"""
فيديو إعلاني #3 - "هدايا رمضان / المناسبات" (30 ثانية)
الفكرة: إرسال هدايا وحلويات للأهل في المناسبات

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
GOLD = (218, 165, 32)
DARK_PURPLE = (45, 20, 60)

WEBSITE_URL = "https://www.wasel.life"
APP_DOWNLOAD_URL = "https://www.wasel.life/DownloadApp"


def generate_qr(url, size=300):
    qr = qrcode.QRCode(version=1, box_size=10, border=2,
                        error_correction=qrcode.constants.ERROR_CORRECT_H)
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#1F2933", back_color="white").convert("RGB")
    return np.array(img.resize((size, size), Image.LANCZOS))


def gradient_frame(w, h, c1, c2):
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    for y in range(h):
        r = y / h
        arr[y, :] = [int(c1[i] + (c2[i] - c1[i]) * r) for i in range(3)]
    return arr


def build_video():
    scenes = []

    # ─── المشهد 1: المناسبة (0-7 ثواني) ───
    bg1 = ImageClip(gradient_frame(WIDTH, HEIGHT, DARK_PURPLE, (80, 40, 100))).with_duration(7)

    stars = TextClip(
        text="🌙✨🌙✨🌙",
        font_size=80, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(7).with_position(("center", 300))

    title1 = TextClip(
        text="عيد؟ رمضان؟ مناسبة؟",
        font_size=68, color="#DAA520", font="Arial",
        size=(WIDTH - 100, None), method="caption",
        stroke_color="white", stroke_width=1
    ).with_duration(7).with_position(("center", 600))

    sub1 = TextClip(
        text="فرّح أهلك في درعا\nوأنت بعيد عنهم! 🎁",
        font_size=52, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(7).with_position(("center", 850))

    scene1 = CompositeVideoClip([bg1, stars, title1, sub1])
    scenes.append(scene1)

    # ─── المشهد 2: المنتجات (7-15 ثواني) ───
    bg2 = ColorClip(size=(WIDTH, HEIGHT), color=(249, 250, 248), duration=8)

    products_title = TextClip(
        text="أرسل لهم 💝",
        font_size=64, color=f"rgb{WASEL_GREEN}", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(8).with_position(("center", 350))

    products = TextClip(
        text=(
            "🍰 صينية كنافة نابلسية\n\n"
            "🍫 شوكولا وحلويات فاخرة\n\n"
            "🧁 كيكة عيد ميلاد\n\n"
            "🛍️ سلة هدايا متكاملة\n\n"
            "💐 باقة ورد مع رسالة"
        ),
        font_size=42, color=f"rgb{WASEL_DARK}", font="Arial",
        size=(WIDTH - 120, None), method="caption"
    ).with_duration(8).with_position(("center", 650))

    scene2 = CompositeVideoClip([bg2, products_title, products])
    scenes.append(scene2)

    # ─── المشهد 3: الشهادة (15-21 ثواني) ───
    bg3 = ColorClip(size=(WIDTH, HEIGHT), color=WASEL_GREEN, duration=6)

    quote = TextClip(
        text=(
            "\" أرسلت كنافة لأمي بالعيد\n"
            "وهي ما كانت متوقعة...\n"
            "بكت من الفرحة 😭💚 \""
        ),
        font_size=46, color="white", font="Arial",
        size=(WIDTH - 120, None), method="caption"
    ).with_duration(6).with_position(("center", 600))

    quote_by = TextClip(
        text="— أحمد، مغترب في ألمانيا 🇩🇪",
        font_size=34, color="#F9FAF8", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(6).with_position(("center", 1000))

    scene3 = CompositeVideoClip([bg3, quote, quote_by])
    scenes.append(scene3)

    # ─── المشهد 4: CTA + QR (21-30 ثواني) ───
    bg4 = ImageClip(gradient_frame(WIDTH, HEIGHT, DARK_PURPLE, WASEL_DARK)).with_duration(9)

    cta = TextClip(
        text="وصّل فرحة لأهلك اليوم! 🎁",
        font_size=58, color="#DAA520", font="Arial",
        size=(WIDTH - 100, None), method="caption",
        stroke_color="white", stroke_width=1
    ).with_duration(9).with_position(("center", 400))

    qr_clip = ImageClip(generate_qr(APP_DOWNLOAD_URL, 350)).with_duration(9).with_position(("center", 650))

    scan = TextClip(
        text="📱 امسح الكود لتحميل التطبيق",
        font_size=36, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(9).with_position(("center", 1060))

    url = TextClip(
        text=WEBSITE_URL,
        font_size=44, color="#2FA36B", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(9).with_position(("center", 1200))

    brand = TextClip(
        text="واصل ستور 💚",
        font_size=52, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(9).with_position(("center", 1380))

    scene4 = CompositeVideoClip([bg4, cta, qr_clip, scan, url, brand])
    scenes.append(scene4)

    final = concatenate_videoclips(scenes, method="compose")
    output_path = os.path.join(OUTPUT_DIR, "wasel_ad_3_gifts.mp4")
    final.write_videofile(output_path, fps=FPS, codec="libx264",
                          audio=False, preset="medium")
    print(f"\n✅ تم إنشاء الفيديو: {output_path}")


if __name__ == "__main__":
    build_video()
