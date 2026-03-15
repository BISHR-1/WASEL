"""
فيديو إعلاني #4 - "السلة المشتركة" (30 ثانية)
الفكرة: ميزة السلة المشتركة - اجمع طلبات العائلة بسلة وحدة

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
BLUE_ACCENT = (59, 130, 246)

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

    # ─── المشهد 1: المشكلة (0-6 ثواني) ───
    bg1 = ColorClip(size=(WIDTH, HEIGHT), color=WASEL_DARK, duration=6)

    problem = TextClip(
        text="كل واحد بالعيلة\nبده يطلب شي مختلف؟ 🤔",
        font_size=64, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(6).with_position(("center", 600))

    emojis = TextClip(
        text="👨 🍖  👩 🥗  👧 🍰  👦 🍕",
        font_size=70, color="white", font="Arial",
        size=(WIDTH - 80, None), method="caption"
    ).with_duration(6).with_position(("center", 900))

    scene1 = CompositeVideoClip([bg1, problem, emojis])
    scenes.append(scene1)

    # ─── المشهد 2: الحل - السلة المشتركة (6-14 ثواني) ───
    bg2 = ImageClip(gradient_frame(WIDTH, HEIGHT, WASEL_GREEN, WASEL_CTA)).with_duration(8)

    solution = TextClip(
        text="السلة المشتركة! 🛒👨‍👩‍👧‍👦",
        font_size=64, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption",
        stroke_color="black", stroke_width=2
    ).with_duration(8).with_position(("center", 400))

    how = TextClip(
        text=(
            "✅ أنشئ سلة مشتركة\n\n"
            "✅ شاركها مع العائلة\n\n"
            "✅ كل واحد يضيف طلبه\n\n"
            "✅ ادفع واستلم كلشي مرة وحدة!"
        ),
        font_size=44, color="white", font="Arial",
        size=(WIDTH - 120, None), method="caption"
    ).with_duration(8).with_position(("center", 700))

    scene2 = CompositeVideoClip([bg2, solution, how])
    scenes.append(scene2)

    # ─── المشهد 3: المزايا (14-21 ثواني) ───
    bg3 = ColorClip(size=(WIDTH, HEIGHT), color=WASEL_CREAM, duration=7)

    benefits_title = TextClip(
        text="ليش السلة المشتركة؟ 💡",
        font_size=58, color=f"rgb{WASEL_GREEN}", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(7).with_position(("center", 400))

    benefits = TextClip(
        text=(
            "💰 وفّر مصاري التوصيل\n\n"
            "⏰ وفّر وقتك\n\n"
            "🤝 قسّم الدفع مع الأهل\n\n"
            "📦 طلب واحد = توصيلة وحدة"
        ),
        font_size=42, color=f"rgb{WASEL_DARK}", font="Arial",
        size=(WIDTH - 120, None), method="caption"
    ).with_duration(7).with_position(("center", 700))

    scene3 = CompositeVideoClip([bg3, benefits_title, benefits])
    scenes.append(scene3)

    # ─── المشهد 4: CTA + QR (21-30 ثواني) ───
    bg4 = ColorClip(size=(WIDTH, HEIGHT), color=WASEL_DARK, duration=9)

    cta = TextClip(
        text="جرّب السلة المشتركة! 🚀",
        font_size=62, color="#2FA36B", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(9).with_position(("center", 400))

    qr_clip = ImageClip(generate_qr(APP_DOWNLOAD_URL, 350)).with_duration(9).with_position(("center", 640))

    scan = TextClip(
        text="📱 امسح الكود لتحميل التطبيق",
        font_size=36, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(9).with_position(("center", 1050))

    url = TextClip(
        text=WEBSITE_URL,
        font_size=44, color="#2FA36B", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(9).with_position(("center", 1200))

    brand = TextClip(
        text="واصل ستور 💚 نوصل حبك لحد الباب",
        font_size=40, color="white", font="Arial",
        size=(WIDTH - 100, None), method="caption"
    ).with_duration(9).with_position(("center", 1380))

    scene4 = CompositeVideoClip([bg4, cta, qr_clip, scan, url, brand])
    scenes.append(scene4)

    final = concatenate_videoclips(scenes, method="compose")
    output_path = os.path.join(OUTPUT_DIR, "wasel_ad_4_shared_cart.mp4")
    final.write_videofile(output_path, fps=FPS, codec="libx264",
                          audio=False, preset="medium")
    print(f"\n✅ تم إنشاء الفيديو: {output_path}")


if __name__ == "__main__":
    build_video()
