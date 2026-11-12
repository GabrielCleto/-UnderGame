import os
from PIL import Image, ImageDraw

monsters = [
    ("chaos_imp", 32, 32, "Chaos Imp (Diabrete do Caos)", 3),
    ("void_spider", 40, 32, "Void Spider (Aranha do Vazio)", 3),
    ("boss_void_overlord", 64, 64, "Soberano do Vazio (Chefe Onda 5)", 2),
    ("boss_magma_colossus", 64, 64, "Colosso de Magma (Chefe Onda 10)", 2)
]

preview_w = 980
preview_h = 760
bg = Image.new("RGBA", (preview_w, preview_h), (16, 12, 22, 255))
d = ImageDraw.Draw(bg)

# Draw Title
d.rectangle([0, 0, preview_w, 42], fill=(28, 20, 36, 255), outline=(80, 60, 100, 255))
d.text((20, 12), "UNDERGROUND GAME 2.0 - VISUALIZADOR DE SPRITESHEETS V2 (PIXEL ART)", fill=(255, 215, 80, 255))

cur_y = 52
for name, fw, fh, title, scale in monsters:
    sheet = Image.open(os.path.join("assets", "new_monsters", f"{name}.png"))
    card_h = fh * scale + 34
    d.rectangle([14, cur_y, preview_w - 14, cur_y + card_h], fill=(22, 16, 30, 255), outline=(55, 42, 72, 255))
    d.text((24, cur_y + 6), f"{title} | 6 Frames [0..3 Walk/Idle, 4 Charge, 5 Attack] | Original: {fw}x{fh}px | Zoom: {scale}x", fill=(210, 190, 235, 255))
    
    frame_y = cur_y + 24
    for f in range(6):
        box = (f * fw, 0, (f + 1) * fw, fh)
        frame_img = sheet.crop(box)
        scaled_frame = frame_img.resize((fw * scale, fh * scale), Image.NEAREST)
        
        fx = 24 + f * (fw * scale + 12)
        # Checkerboard background
        for cy in range(0, fh * scale, 8):
            for cx in range(0, fw * scale, 8):
                c = (34, 26, 44, 255) if ((cx//8 + cy//8) % 2 == 0) else (44, 34, 56, 255)
                d.rectangle([fx + cx, frame_y + cy, fx + min(fw * scale, cx + 8), frame_y + min(fh * scale, cy + 8)], fill=c)
        
        border_col = (255, 130, 40, 255) if f >= 4 else (80, 65, 110, 255)
        d.rectangle([fx - 1, frame_y - 1, fx + fw * scale, frame_y + fh * scale], outline=border_col)
        
        # Label frame
        tag = f"F{f}: {'Atk' if f==5 else ('Charge' if f==4 else 'Idle')}"
        d.text((fx + 2, frame_y + fh * scale - 12), tag, fill=(180, 180, 200, 255))
        
        bg.paste(scaled_frame, (fx, frame_y), scaled_frame)
    
    cur_y += card_h + 12

out_path = "C:/Users/Gabriel/.gemini/antigravity/brain/04e8b787-a66a-4f90-b442-c9119df2342c/monsters_preview.png"
bg.save(out_path)
print("Complete preview saved to:", out_path)
