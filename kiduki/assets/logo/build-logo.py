"""Rebuild the site logo with the registered office name.

The existing asset reads 「東京KIDUKIコンサルティング事務所」 -- both the dropped
「東京」 and the missing 「産業医」 make it disagree with the registration. The KD
monogram is the actual brand mark, so it is lifted pixel-for-pixel out of the
original (its alpha channel is the shape) and only the wordmark is re-set.

The original wordmark is Mincho with a serif latin face, so Hiragino Mincho ProN
keeps the same voice. Everything is composed at 4x and downsampled, which
reproduces the soft antialiasing of the original instead of hard edges.

Two variants come out: dark for the white page header, white for the dark
footer widget.
"""
from PIL import Image, ImageDraw, ImageFont
import numpy as np

SRC = 'logo.png'
FONT = '/System/Library/Fonts/ヒラギノ明朝 ProN.ttc'
TEXT = 'KIDUKIコンサルティング産業医事務所'

# Measured from the original, in final (1x) pixels.
W, H = 625, 67
MONO_X0, MONO_X1 = 25, 71          # monogram column span
TEXT_X0, TEXT_X1 = 97, 607         # wordmark column span
TEXT_Y0, TEXT_Y1 = 16, 48          # wordmark ink rows
S = 4                              # supersampling factor

alpha = Image.open(SRC).split()[-1]
mono = alpha.crop((MONO_X0, 0, MONO_X1, H))


def fit_font(target_w, face_index):
    """Largest font size whose rendered wordmark still fits target_w."""
    best = None
    for size in range(40, 200):
        font = ImageFont.truetype(FONT, size, index=face_index)
        l, t, r, b = font.getbbox(TEXT)
        if r - l > target_w:
            break
        best = (size, font, r - l, b - t, t)
    return best


def build(face_index, rgb, out_path):
    target_w = (TEXT_X1 - TEXT_X0) * S
    size, font, ink_w, ink_h, ink_top = fit_font(target_w, face_index)

    canvas = Image.new('L', (W * S, H * S), 0)

    # Monogram: same pixels, just scaled up then back down.
    canvas.paste(mono.resize(((MONO_X1 - MONO_X0) * S, H * S), Image.LANCZOS),
                 (MONO_X0 * S, 0))

    # Wordmark: match the original ink box so vertical rhythm is unchanged.
    layer = Image.new('L', (W * S, H * S), 0)
    draw = ImageDraw.Draw(layer)
    l, t, r, b = font.getbbox(TEXT)
    x = TEXT_X0 * S - l
    y = TEXT_Y0 * S - t + ((TEXT_Y1 - TEXT_Y0 + 1) * S - ink_h) // 2
    draw.text((x, y), TEXT, font=font, fill=255)
    canvas.paste(layer, (0, 0), layer)

    small = canvas.resize((W, H), Image.LANCZOS)
    out = Image.new('RGBA', (W, H), rgb + (0,))
    out.putalpha(small)
    out.save(out_path, optimize=True)

    a = np.array(small)
    ys = np.where((a > 16).any(axis=1))[0]
    xs = np.where((a > 16).any(axis=0))[0]
    print(f'  {out_path}: フォント {font.getname()} {size}px / '
          f'インク 行{ys.min()}–{ys.max()} 列{xs.min()}–{xs.max()}')


for idx, label in ((0, 'W3'), (2, 'W6')):
    print(f'■ ヒラギノ明朝 {label}')
    build(idx, (29, 58, 48), f'logo-dark-{label}.png')
    build(idx, (255, 255, 255), f'logo-white-{label}.png')

print('\n元ロゴ: インク 行7–56 列25–606')
