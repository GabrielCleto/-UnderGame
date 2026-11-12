"""
High-End Pixel Art Monster Generator V3 for Underground Game 2.0
Consistent right-facing orientation for directional mobs (imp & spider),
rich 16-bit / 32-bit color ramps, detailed anatomy, and explosive attack frames.
"""

import math
import os
from PIL import Image, ImageDraw

def create_canvas(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))

def draw_disc(draw, cx, cy, r, fill, outline=None):
    draw.ellipse([int(cx - r), int(cy - r), int(cx + r), int(cy + r)], fill=fill, outline=outline)

# ==============================================================================
# 1. CHAOS IMP (192 x 32 -> 6 frames of 32x32, faces RIGHT)
# ==============================================================================
def generate_chaos_imp():
    FW, FH = 32, 32
    sheet = create_canvas(FW * 6, FH)

    OUTLINE = (22, 6, 12, 255)
    BODY_DEEP = (62, 14, 22, 255)
    BODY_SHADOW = (108, 22, 32, 255)
    BODY_MID = (168, 34, 44, 255)
    BODY_LIT = (218, 58, 54, 255)
    BODY_HI = (255, 115, 92, 255)

    HORN_DARK = (18, 14, 24, 255)
    HORN_MID = (48, 42, 60, 255)
    HORN_LIT = (95, 85, 120, 255)
    HORN_HI = (160, 145, 195, 255)

    WING_BONE = (42, 10, 18, 255)
    WING_DARK = (78, 16, 26, 255)
    WING_MID = (136, 28, 42, 255)
    WING_LIT = (188, 48, 62, 255)

    GOLD_EYE = (255, 215, 55, 255)
    EYE_PUPIL = (180, 20, 10, 255)
    FIRE_RED = (220, 45, 10, 255)
    FIRE_ORANGE = (255, 125, 15, 255)
    FIRE_GOLD = (255, 215, 45, 255)
    FIRE_WHITE = (255, 255, 220, 255)

    for frame in range(6):
        img = create_canvas(FW, FH)
        d = ImageDraw.Draw(img)

        is_charge = (frame == 4)
        is_attack = (frame == 5)

        bob = [0, -1, -2, -1, 0, 1][frame]
        cx = 15 + (2 if is_attack else (-1 if is_charge else 0))
        cy = 16 + bob

        # --- BACK WING ---
        if frame == 0:
            pts = [(cx-3, cy-1), (cx-12, cy-10), (cx-14, cy-4), (cx-11, cy+2), (cx-4, cy+3)]
            d.polygon(pts, fill=WING_DARK, outline=OUTLINE)
            d.line([(cx-3, cy-1), (cx-12, cy-10)], fill=WING_BONE, width=1)
            d.point((cx-12, cy-10), fill=HORN_HI)
        elif frame == 1:
            pts = [(cx-3, cy), (cx-13, cy-4), (cx-14, cy+3), (cx-10, cy+7), (cx-4, cy+4)]
            d.polygon(pts, fill=WING_DARK, outline=OUTLINE)
            d.line([(cx-3, cy), (cx-13, cy-4)], fill=WING_BONE, width=1)
        elif frame == 2:
            pts = [(cx-3, cy+1), (cx-13, cy+3), (cx-12, cy+10), (cx-8, cy+10), (cx-4, cy+5)]
            d.polygon(pts, fill=WING_DARK, outline=OUTLINE)
            d.line([(cx-3, cy+1), (cx-13, cy+3)], fill=WING_BONE, width=1)
        elif frame == 3:
            pts = [(cx-3, cy-1), (cx-11, cy-7), (cx-13, cy-1), (cx-9, cy+4), (cx-4, cy+3)]
            d.polygon(pts, fill=WING_DARK, outline=OUTLINE)
        elif frame == 4: # Tucked tight
            pts = [(cx-2, cy-2), (cx-8, cy-8), (cx-9, cy-2), (cx-6, cy+4), (cx-3, cy+3)]
            d.polygon(pts, fill=WING_DARK, outline=OUTLINE)
        elif frame == 5: # Flared wide backward
            pts = [(cx-1, cy-2), (cx-9, cy-10), (cx-13, cy-4), (cx-8, cy+2), (cx-2, cy+2)]
            d.polygon(pts, fill=WING_MID, outline=OUTLINE)
            d.line([(cx-1, cy-2), (cx-9, cy-10)], fill=FIRE_GOLD, width=1)

        # --- TAIL WITH SPADE ARROW (Extends to left behind him) ---
        tail_tip_y = cy + 9 + (1 if frame % 2 == 1 else 0)
        tail_x = cx - 9
        d.line([(cx - 2, cy + 5), (cx - 5, cy + 7), (tail_x, tail_tip_y)], fill=BODY_SHADOW, width=2)
        d.line([(cx - 2, cy + 5), (cx - 5, cy + 7), (tail_x, tail_tip_y)], fill=OUTLINE, width=1)
        # Spade arrow head
        d.polygon([(tail_x, tail_tip_y), (tail_x - 4, tail_tip_y - 3), (tail_x - 3, tail_tip_y + 2)], fill=FIRE_ORANGE, outline=OUTLINE)
        d.point((tail_x - 2, tail_tip_y - 1), fill=FIRE_GOLD)

        # --- LEGS & HOOVES ---
        d.rectangle([cx - 3, cy + 5, cx - 1, cy + 8], fill=BODY_SHADOW, outline=OUTLINE)
        d.rectangle([cx + 1, cy + 5, cx + 3, cy + 8], fill=BODY_MID, outline=OUTLINE)
        d.point((cx - 2, cy + 8), fill=HORN_MID)
        d.point((cx + 2, cy + 8), fill=HORN_MID)

        # --- TORSO ---
        d.ellipse([cx - 4, cy - 1, cx + 4, cy + 6], fill=BODY_MID, outline=OUTLINE)
        d.rectangle([cx - 2, cy + 1, cx + 2, cy + 4], fill=BODY_LIT)
        d.line([(cx - 2, cy + 2), (cx + 2, cy + 2)], fill=BODY_HI)
        d.point((cx, cy + 3), fill=BODY_SHADOW)
        d.line([(cx - 1, cy + 4), (cx + 1, cy + 4)], fill=BODY_DEEP)

        # --- FRONT WING ---
        if frame == 0:
            pts_l = [(cx+3, cy-1), (cx+12, cy-10), (cx+14, cy-4), (cx+10, cy+3), (cx+4, cy+3)]
            d.polygon(pts_l, fill=WING_LIT, outline=OUTLINE)
            d.line([(cx+3, cy-1), (cx+12, cy-10)], fill=WING_BONE, width=1)
            d.point((cx+12, cy-10), fill=HORN_HI)
        elif frame == 1:
            pts_l = [(cx+3, cy), (cx+13, cy-4), (cx+14, cy+4), (cx+9, cy+8), (cx+4, cy+4)]
            d.polygon(pts_l, fill=WING_MID, outline=OUTLINE)
            d.line([(cx+3, cy), (cx+13, cy-4)], fill=WING_BONE, width=1)
        elif frame == 2:
            pts_l = [(cx+3, cy+1), (cx+13, cy+3), (cx+12, cy+10), (cx+7, cy+11), (cx+4, cy+5)]
            d.polygon(pts_l, fill=WING_MID, outline=OUTLINE)
            d.line([(cx+3, cy+1), (cx+13, cy+3)], fill=WING_BONE, width=1)
        elif frame == 3:
            pts_l = [(cx+3, cy-1), (cx+11, cy-7), (cx+13, cy-1), (cx+8, cy+5), (cx+4, cy+3)]
            d.polygon(pts_l, fill=WING_LIT, outline=OUTLINE)
            d.line([(cx+3, cy-1), (cx+11, cy-7)], fill=WING_BONE, width=1)
        elif frame == 4:
            pts_l = [(cx+2, cy-2), (cx+8, cy-8), (cx+9, cy-2), (cx+6, cy+4), (cx+3, cy+3)]
            d.polygon(pts_l, fill=WING_MID, outline=OUTLINE)
        elif frame == 5:
            pts_l = [(cx-2, cy-2), (cx-13, cy-8), (cx-15, cy-1), (cx-9, cy+4), (cx-3, cy+3)]
            d.polygon(pts_l, fill=WING_LIT, outline=OUTLINE)
            d.line([(cx-2, cy-2), (cx-13, cy-8)], fill=FIRE_GOLD, width=1)

        # --- HEAD & DEMONIC FACE ---
        head_y = cy - 5
        d.ellipse([cx - 5, head_y - 5, cx + 5, head_y + 4], fill=BODY_MID, outline=OUTLINE)
        d.rectangle([cx - 3, head_y - 3, cx + 3, head_y - 1], fill=BODY_LIT)
        d.point((cx + 1, head_y - 3), fill=BODY_HI)

        # CURVED HORNS
        d.line([(cx - 3, head_y - 3), (cx - 5, head_y - 7), (cx - 8, head_y - 10)], fill=HORN_MID, width=2)
        d.line([(cx - 3, head_y - 3), (cx - 5, head_y - 7), (cx - 8, head_y - 10)], fill=OUTLINE, width=1)
        d.point((cx - 8, head_y - 10), fill=FIRE_GOLD if is_charge else HORN_HI)

        d.line([(cx + 3, head_y - 3), (cx + 5, head_y - 7), (cx + 8, head_y - 10)], fill=HORN_MID, width=2)
        d.line([(cx + 3, head_y - 3), (cx + 5, head_y - 7), (cx + 8, head_y - 10)], fill=OUTLINE, width=1)
        d.point((cx + 8, head_y - 10), fill=FIRE_GOLD if is_charge else HORN_HI)

        # SLANTED EYES
        if is_charge:
            d.line([(cx - 3, head_y - 2), (cx - 1, head_y - 1)], fill=FIRE_WHITE, width=1)
            d.line([(cx + 1, head_y - 1), (cx + 3, head_y - 2)], fill=FIRE_WHITE, width=1)
            d.point((cx - 2, head_y - 1), fill=FIRE_GOLD)
            d.point((cx + 2, head_y - 1), fill=FIRE_GOLD)
        else:
            d.point((cx - 3, head_y - 2), fill=GOLD_EYE)
            d.point((cx - 2, head_y - 1), fill=GOLD_EYE)
            d.point((cx - 2, head_y - 2), fill=EYE_PUPIL)
            d.point((cx + 3, head_y - 2), fill=GOLD_EYE)
            d.point((cx + 2, head_y - 1), fill=GOLD_EYE)
            d.point((cx + 2, head_y - 2), fill=EYE_PUPIL)

        # MOUTH & FIRE EFFECTS (Facing RIGHT +X)
        if is_charge:
            d.ellipse([cx - 2, head_y + 1, cx + 2, head_y + 3], fill=OUTLINE)
            fx = cx + 6
            fy = head_y + 2
            draw_disc(d, fx, fy, 4, fill=FIRE_ORANGE, outline=FIRE_RED)
            draw_disc(d, fx, fy, 2, fill=FIRE_GOLD)
            draw_disc(d, fx, fy, 1, fill=FIRE_WHITE)
            d.point((fx + 4, fy - 3), fill=FIRE_WHITE)
            d.point((fx + 5, fy + 3), fill=FIRE_GOLD)
        elif is_attack:
            d.ellipse([cx - 2, head_y + 1, cx + 2, head_y + 3], fill=OUTLINE)
            fx = cx + 6
            fy = head_y + 2
            d.polygon([(fx, fy - 2), (fx + 10, fy - 5), (fx + 8, fy), (fx + 10, fy + 4), (fx, fy + 3)], fill=FIRE_RED)
            d.polygon([(fx + 1, fy - 1), (fx + 7, fy - 3), (fx + 6, fy), (fx + 7, fy + 2), (fx + 1, fy + 2)], fill=FIRE_ORANGE)
            draw_disc(d, fx + 2, fy, 3, fill=FIRE_GOLD)
            draw_disc(d, fx + 2, fy, 1, fill=FIRE_WHITE)
            d.point((fx + 10, fy - 3), fill=FIRE_WHITE)
            d.point((fx + 9, fy + 1), fill=FIRE_GOLD)
        else:
            d.line([(cx - 2, head_y + 2), (cx + 2, head_y + 2)], fill=OUTLINE)
            d.point((cx - 2, head_y + 3), fill=FIRE_WHITE)
            d.point((cx + 2, head_y + 3), fill=FIRE_WHITE)

        d.point((cx - 3, cy + 3), fill=HORN_MID)
        d.point((cx + 3, cy + 3), fill=HORN_MID)

        sheet.paste(img, (frame * FW, 0))

    return sheet


# ==============================================================================
# 2. VOID SPIDER (240 x 32 -> 6 frames of 40x32, faces RIGHT)
# ==============================================================================
def generate_void_spider():
    FW, FH = 40, 32
    sheet = create_canvas(FW * 6, FH)

    OUTLINE = (12, 6, 20, 255)
    CHITIN_DEEP = (24, 14, 40, 255)
    CHITIN_MID = (46, 28, 76, 255)
    CHITIN_LIT = (76, 48, 122, 255)
    CHITIN_HI = (122, 86, 186, 255)

    VOID_DEEP = (90, 18, 140, 255)
    VOID_MAGENTA = (220, 35, 210, 255)
    VOID_CYAN = (40, 220, 240, 255)
    VOID_WHITE = (235, 255, 255, 255)

    for frame in range(6):
        img = create_canvas(FW, FH)
        d = ImageDraw.Draw(img)

        is_charge = (frame == 4)
        is_attack = (frame == 5)

        # Center position: spider faces RIGHT (+X)
        cx = 18
        cy = 19

        if is_charge:
            # REAR UP STANCE (Facing RIGHT):
            # Abdomen rests low on LEFT (cx - 8), Head & front legs rise high on RIGHT (cx + 4)
            ab_x, ab_y = cx - 8, cy + 3
            d.ellipse([ab_x - 8, ab_y - 6, ab_x + 7, ab_y + 6], fill=CHITIN_MID, outline=OUTLINE)
            d.ellipse([ab_x - 5, ab_y - 4, ab_x + 5, ab_y + 4], fill=CHITIN_DEEP)
            d.polygon([(ab_x, ab_y - 3), (ab_x + 3, ab_y), (ab_x, ab_y + 3), (ab_x - 3, ab_y)], fill=VOID_MAGENTA)
            d.point((ab_x, ab_y), fill=VOID_WHITE)

            # Rear Legs planted on left
            d.line([(cx - 12, cy + 3), (cx - 15, cy + 5), (cx - 16, cy + 10)], fill=CHITIN_LIT, width=2)
            d.line([(cx - 6, cy + 4), (cx - 10, cy + 6), (cx - 11, cy + 11)], fill=CHITIN_MID, width=2)

            # Tilted Cephalothorax raised on right
            hd_x, hd_y = cx + 4, cy - 6
            d.ellipse([hd_x - 5, hd_y - 5, hd_x + 5, hd_y + 4], fill=CHITIN_LIT, outline=OUTLINE)
            d.point((hd_x + 2, hd_y - 2), fill=CHITIN_HI)

            # Raised Front Scythe Legs (Right side)
            d.line([(hd_x, hd_y), (hd_x + 5, hd_y - 7), (hd_x + 10, hd_y - 3)], fill=CHITIN_HI, width=2)
            d.line([(hd_x, hd_y + 1), (hd_x + 3, hd_y - 9), (hd_x + 7, hd_y - 6)], fill=CHITIN_LIT, width=2)

            # Singularity ball in mandibles
            mand_x, mand_y = hd_x + 7, hd_y + 1
            draw_disc(d, mand_x, mand_y, 4, fill=VOID_MAGENTA, outline=VOID_DEEP)
            draw_disc(d, mand_x, mand_y, 2, fill=VOID_CYAN)
            draw_disc(d, mand_x, mand_y, 1, fill=VOID_WHITE)
            d.point((mand_x + 4, mand_y - 3), fill=VOID_CYAN)
            d.point((mand_x + 3, mand_y + 4), fill=VOID_MAGENTA)

            # Eyes
            d.point((hd_x + 3, hd_y - 2), fill=VOID_CYAN)
            d.point((hd_x + 1, hd_y - 3), fill=VOID_MAGENTA)
            d.point((hd_x + 3, hd_y + 1), fill=VOID_CYAN)

        elif is_attack:
            # LUNGE & SLAM TO THE RIGHT (+X)
            atk_cx = 21
            ab_x, ab_y = atk_cx - 9, cy - 1
            d.ellipse([ab_x - 8, ab_y - 6, ab_x + 7, ab_y + 6], fill=CHITIN_MID, outline=OUTLINE)
            d.point((ab_x + 1, ab_y - 1), fill=VOID_MAGENTA)

            hd_x, hd_y = atk_cx + 2, cy
            d.ellipse([hd_x - 5, hd_y - 5, hd_x + 5, hd_y + 4], fill=CHITIN_LIT, outline=OUTLINE)

            # Scythe legs striking ground
            d.line([(hd_x, hd_y), (hd_x + 3, cy + 4), (hd_x + 7, cy + 10)], fill=CHITIN_HI, width=2)
            d.line([(hd_x - 3, hd_y), (hd_x, cy + 6), (hd_x + 2, cy + 10)], fill=CHITIN_MID, width=2)
            d.line([(ab_x, ab_y), (ab_x - 4, cy + 4), (ab_x - 8, cy + 10)], fill=CHITIN_DEEP, width=2)

            # Void Blast Stream shooting RIGHT (+X)
            bx = hd_x + 5
            by = hd_y
            d.polygon([(bx, by - 3), (37, by - 6), (39, by), (37, by + 6), (bx, by + 3)], fill=VOID_DEEP)
            d.polygon([(bx, by - 1), (35, by - 3), (37, by), (35, by + 3), (bx, by + 1)], fill=VOID_MAGENTA)
            d.line([(bx, by), (36, by)], fill=VOID_CYAN, width=2)
            d.line([(bx + 2, by), (34, by)], fill=VOID_WHITE, width=1)
            d.point((38, by - 4), fill=VOID_CYAN)
            d.point((38, by + 4), fill=VOID_WHITE)

        else:
            # WALK / IDLE (Frames 0..3) facing RIGHT
            leg_step = frame % 4
            bob = [0, -1, 0, 1][leg_step]

            ab_x, ab_y = cx - 7, cy - 1 + bob
            hd_x, hd_y = cx + 5, cy + bob

            # Back Legs (Behind body)
            d.line([(ab_x - 2, ab_y), (ab_x - 7, ab_y - 6), (ab_x - 10 - ([0, 2, 0, -1][leg_step]), cy + 10)], fill=CHITIN_DEEP, width=2)
            d.line([(hd_x - 4, hd_y), (hd_x - 7, hd_y - 7), (hd_x - 8 - ([-1, 0, 2, 0][leg_step]), cy + 10)], fill=CHITIN_DEEP, width=2)
            d.line([(hd_x, hd_y), (hd_x + 3, hd_y - 6), (hd_x + 5 + ([1, -1, 0, 2][leg_step]), cy + 10)], fill=CHITIN_DEEP, width=2)

            # Abdomen (Bulbous void gland on left)
            d.ellipse([ab_x - 8, ab_y - 7, ab_x + 8, ab_y + 7], fill=CHITIN_MID, outline=OUTLINE)
            d.ellipse([ab_x - 6, ab_y - 5, ab_x + 6, ab_y + 5], fill=CHITIN_DEEP)
            d.line([(ab_x - 4, ab_y - 5), (ab_x + 4, ab_y - 5)], fill=CHITIN_HI)

            # Bioluminescent Eldritch Runes
            rune_glow = VOID_WHITE if frame == 2 else VOID_MAGENTA
            d.polygon([(ab_x - 2, ab_y - 2), (ab_x, ab_y - 4), (ab_x + 2, ab_y - 2), (ab_x, ab_y)], fill=rune_glow)
            d.line([(ab_x - 4, ab_y), (ab_x - 2, ab_y + 2)], fill=VOID_CYAN)
            d.line([(ab_x + 4, ab_y), (ab_x + 2, ab_y + 2)], fill=VOID_CYAN)

            # Cephalothorax (Head on right)
            d.ellipse([hd_x - 5, hd_y - 5, hd_x + 5, hd_y + 4], fill=CHITIN_LIT, outline=OUTLINE)
            d.ellipse([hd_x - 3, hd_y - 3, hd_x + 3, hd_y + 2], fill=CHITIN_MID)
            d.point((hd_x + 1, hd_y - 3), fill=CHITIN_HI)

            # Fangs / Mandibles with venom glint
            d.line([(hd_x + 4, hd_y + 2), (hd_x + 6, hd_y + 6)], fill=CHITIN_DEEP, width=1)
            d.point((hd_x + 6, hd_y + 6), fill=VOID_CYAN)
            d.line([(hd_x + 1, hd_y + 2), (hd_x + 3, hd_y + 6)], fill=CHITIN_DEEP, width=1)
            d.point((hd_x + 3, hd_y + 6), fill=VOID_CYAN)

            # 4 Glowing Eyes Cluster
            d.point((hd_x + 3, hd_y - 2), fill=VOID_CYAN)
            d.point((hd_x + 1, hd_y - 2), fill=VOID_WHITE if frame % 2 == 0 else VOID_CYAN)
            d.point((hd_x + 3, hd_y), fill=VOID_MAGENTA)
            d.point((hd_x + 1, hd_y), fill=VOID_WHITE if frame % 2 == 1 else VOID_MAGENTA)

            # Front Legs (In front of body)
            d.line([(ab_x, ab_y + 1), (ab_x - 5, ab_y - 4), (ab_x - 8 - ([1, 0, -2, 0][leg_step]), cy + 10)], fill=CHITIN_HI, width=2)
            d.line([(ab_x, ab_y + 1), (ab_x - 5, ab_y - 4), (ab_x - 8 - ([1, 0, -2, 0][leg_step]), cy + 10)], fill=OUTLINE, width=1)
            d.line([(hd_x - 2, hd_y + 2), (hd_x - 4, hd_y - 5), (hd_x - 6 - ([0, 2, 0, -1][leg_step]), cy + 10)], fill=CHITIN_HI, width=2)
            d.line([(hd_x - 2, hd_y + 2), (hd_x - 4, hd_y - 5), (hd_x - 6 - ([0, 2, 0, -1][leg_step]), cy + 10)], fill=OUTLINE, width=1)
            d.line([(hd_x + 2, hd_y + 2), (hd_x + 5, hd_y - 5), (hd_x + 8 + ([-1, 0, 2, 0][leg_step]), cy + 10)], fill=CHITIN_HI, width=2)
            d.line([(hd_x + 2, hd_y + 2), (hd_x + 5, hd_y - 5), (hd_x + 8 + ([-1, 0, 2, 0][leg_step]), cy + 10)], fill=OUTLINE, width=1)

        sheet.paste(img, (frame * FW, 0))

    return sheet


# ==============================================================================
# 3. BOSS VOID OVERLORD (384 x 64 -> 6 frames of 64x64)
# ==============================================================================
def generate_boss_void_overlord():
    FW, FH = 64, 64
    sheet = create_canvas(FW * 6, FH)

    OUTLINE = (12, 6, 22, 255)
    PLATE_DARK = (24, 16, 40, 255)
    PLATE_MID = (44, 30, 70, 255)
    PLATE_LIT = (72, 50, 114, 255)
    PLATE_HI = (114, 86, 172, 255)

    GOLD_DARK = (115, 70, 18, 255)
    GOLD_MID = (185, 130, 30, 255)
    GOLD_LIT = (250, 205, 55, 255)

    COWL_DARK = (18, 10, 32, 255)
    COWL_MID = (38, 20, 64, 255)
    COWL_LIT = (68, 36, 108, 255)

    CLOAK_DARK = (18, 8, 32, 255)
    CLOAK_MID = (58, 20, 95, 255)
    CLOAK_LIT = (118, 38, 175, 255)

    VOID_DEEP = (80, 14, 130, 255)
    VOID_MAGENTA = (225, 40, 210, 255)
    VOID_CYAN = (55, 225, 250, 255)
    VOID_WHITE = (240, 255, 255, 255)

    for frame in range(6):
        img = create_canvas(FW, FH)
        d = ImageDraw.Draw(img)

        is_charge = (frame == 4)
        is_attack = (frame == 5)

        bob = [0, -2, -3, -1, -1, 1][frame]
        cx = 32
        cy = 30 + bob

        # Floating void mist below robes
        mist_phase = frame * 1.05
        for tx in range(cx - 16, cx + 18, 3):
            wave = int(math.sin(mist_phase + tx * 0.4) * 3)
            ty_start = cy + 18
            ty_end = min(62, ty_start + 10 + wave)
            d.line([(tx, ty_start), (tx + wave, ty_end)], fill=CLOAK_MID, width=2)
            d.point((tx + wave, ty_end), fill=VOID_MAGENTA)
            if frame % 2 == 0 and tx % 6 == 0:
                d.point((tx + wave, ty_end - 2), fill=VOID_CYAN)

        # Cosmic Cloak
        cloak_w = 18 + (5 if is_attack else 0)
        cloak_pts = [
            (cx - 10, cy - 4),
            (cx - cloak_w, cy + 18),
            (cx - cloak_w + 4, cy + 26),
            (cx + cloak_w - 4, cy + 26),
            (cx + cloak_w, cy + 18),
            (cx + 10, cy - 4)
        ]
        d.polygon(cloak_pts, fill=CLOAK_DARK, outline=OUTLINE)
        d.ellipse([cx - 12, cy + 6, cx + 12, cy + 24], fill=CLOAK_MID)
        d.ellipse([cx - 8, cy + 10, cx + 8, cy + 20], fill=CLOAK_LIT)
        # Nebula stars
        d.point((cx - 7, cy + 12), fill=VOID_CYAN)
        d.point((cx + 5, cy + 14), fill=VOID_WHITE)
        d.point((cx - 3, cy + 17), fill=VOID_MAGENTA)
        d.point((cx + 7, cy + 19), fill=VOID_CYAN)

        # Ornate Robe Body
        d.polygon([(cx - 7, cy - 4), (cx - 9, cy + 16), (cx + 9, cy + 16), (cx + 7, cy - 4)], fill=PLATE_DARK, outline=OUTLINE)
        d.polygon([(cx - 5, cy - 2), (cx - 7, cy + 14), (cx + 7, cy + 14), (cx + 5, cy - 2)], fill=PLATE_MID)
        d.line([(cx - 5, cy - 2), (cx - 7, cy + 14)], fill=GOLD_MID, width=1)
        d.line([(cx + 5, cy - 2), (cx + 7, cy + 14)], fill=GOLD_MID, width=1)
        d.line([(cx - 6, cy + 14), (cx + 6, cy + 14)], fill=GOLD_LIT, width=1)

        # Chest Singularity Eye Core
        core_y = cy + 4
        draw_disc(d, cx, core_y, 4, fill=VOID_DEEP, outline=OUTLINE)
        draw_disc(d, cx, core_y, 3, fill=VOID_MAGENTA if not is_charge else VOID_CYAN)
        draw_disc(d, cx, core_y, 2, fill=VOID_CYAN if not is_charge else VOID_WHITE)
        draw_disc(d, cx, core_y, 1, fill=VOID_WHITE)
        d.point((cx - 4, core_y), fill=GOLD_LIT)
        d.point((cx + 4, core_y), fill=GOLD_LIT)

        # Spiked Pauldrons
        lp = [(cx - 7, cy - 6), (cx - 16, cy - 10), (cx - 18, cy - 2), (cx - 9, cy + 2)]
        d.polygon(lp, fill=PLATE_LIT, outline=OUTLINE)
        d.line([(cx - 7, cy - 6), (cx - 16, cy - 10)], fill=GOLD_LIT, width=1)
        d.point((cx - 16, cy - 10), fill=VOID_MAGENTA)

        rp = [(cx + 7, cy - 6), (cx + 16, cy - 10), (cx + 18, cy - 2), (cx + 9, cy + 2)]
        d.polygon(rp, fill=PLATE_LIT, outline=OUTLINE)
        d.line([(cx + 7, cy - 6), (cx + 16, cy - 10)], fill=GOLD_LIT, width=1)
        d.point((cx + 16, cy - 10), fill=VOID_MAGENTA)

        # Head / Hood / Astral Crown
        head_y = cy - 10
        d.polygon([(cx - 7, head_y + 4), (cx - 8, head_y - 6), (cx, head_y - 9), (cx + 8, head_y - 6), (cx + 7, head_y + 4)], fill=COWL_DARK, outline=OUTLINE)
        d.polygon([(cx - 5, head_y + 2), (cx - 6, head_y - 4), (cx, head_y - 7), (cx + 6, head_y - 4), (cx + 5, head_y + 2)], fill=COWL_MID)
        d.rectangle([cx - 4, head_y - 3, cx + 4, head_y + 3], fill=OUTLINE)

        # Crown Spikes
        crown_spikes = [
            (cx - 7, head_y - 4, cx - 11, head_y - 12),
            (cx - 3, head_y - 6, cx - 4, head_y - 15),
            (cx, head_y - 7, cx, head_y - 17),
            (cx + 3, head_y - 6, cx + 4, head_y - 15),
            (cx + 7, head_y - 4, cx + 11, head_y - 12),
        ]
        for x0, y0, x1, y1 in crown_spikes:
            d.line([(x0, y0), (x1, y1)], fill=PLATE_HI, width=2)
            d.line([(x0, y0), (x1, y1)], fill=OUTLINE, width=1)
            d.point((x1, y1), fill=VOID_CYAN if is_charge else VOID_MAGENTA)

        # Eyes
        if is_charge:
            d.line([(cx - 4, head_y - 1), (cx - 2, head_y)], fill=VOID_WHITE, width=1)
            d.line([(cx + 2, head_y), (cx + 4, head_y - 1)], fill=VOID_WHITE, width=1)
            d.point((cx - 3, head_y - 1), fill=VOID_CYAN)
            d.point((cx + 3, head_y - 1), fill=VOID_CYAN)
        else:
            d.line([(cx - 4, head_y - 1), (cx - 2, head_y)], fill=VOID_CYAN, width=1)
            d.line([(cx + 2, head_y), (cx + 4, head_y - 1)], fill=VOID_CYAN, width=1)
            d.point((cx - 3, head_y), fill=VOID_WHITE)
            d.point((cx + 3, head_y), fill=VOID_WHITE)

        # Hands & Orb
        if is_charge:
            d.line([(cx - 8, cy - 2), (cx - 14, cy - 14), (cx - 10, cy - 20)], fill=PLATE_LIT, width=3)
            d.line([(cx + 8, cy - 2), (cx + 14, cy - 14), (cx + 10, cy - 20)], fill=PLATE_LIT, width=3)

            orb_x, orb_y = cx, max(7, head_y - 16)
            draw_disc(d, orb_x, orb_y, 7, fill=VOID_DEEP, outline=OUTLINE)
            draw_disc(d, orb_x, orb_y, 5, fill=VOID_MAGENTA)
            draw_disc(d, orb_x, orb_y, 3, fill=VOID_CYAN)
            draw_disc(d, orb_x, orb_y, 1, fill=VOID_WHITE)
            d.line([(orb_x - 9, orb_y - 3), (orb_x - 5, orb_y - 7), (orb_x - 1, orb_y - 9)], fill=VOID_CYAN, width=1)
            d.line([(orb_x + 9, orb_y - 3), (orb_x + 5, orb_y - 7), (orb_x + 1, orb_y - 9)], fill=VOID_CYAN, width=1)
            d.line([(orb_x - 7, orb_y + 6), (orb_x - 11, orb_y + 9)], fill=VOID_MAGENTA, width=1)
            d.line([(orb_x + 7, orb_y + 6), (orb_x + 11, orb_y + 9)], fill=VOID_MAGENTA, width=1)

        elif is_attack:
            d.line([(cx - 8, cy - 2), (cx - 15, cy + 4), (cx - 18, cy + 8)], fill=PLATE_LIT, width=3)
            d.line([(cx + 8, cy - 2), (cx + 15, cy + 4), (cx + 18, cy + 8)], fill=PLATE_LIT, width=3)

            bx = cx
            by = cy + 8
            d.ellipse([bx - 26, by - 12, bx + 26, by + 12], fill=VOID_DEEP)
            d.ellipse([bx - 18, by - 8, bx + 18, by + 8], fill=VOID_MAGENTA)
            d.ellipse([bx - 10, by - 4, bx + 10, by + 4], fill=VOID_CYAN)
            d.ellipse([bx - 4, by - 2, bx + 4, by + 2], fill=VOID_WHITE)

            d.point((bx - 14, by - 2), fill=VOID_WHITE)
            d.point((bx + 14, by - 2), fill=VOID_WHITE)
            d.line([(bx - 20, by - 10), (bx - 28, by - 16)], fill=VOID_CYAN, width=2)
            d.line([(bx + 20, by - 10), (bx + 28, by - 16)], fill=VOID_CYAN, width=2)
            d.line([(bx - 20, by + 10), (bx - 27, by + 16)], fill=VOID_MAGENTA, width=2)
            d.line([(bx + 20, by + 10), (bx + 27, by + 16)], fill=VOID_MAGENTA, width=2)

        else:
            d.line([(cx - 8, cy - 2), (cx - 13, cy + 4), (cx - 12, cy + 8)], fill=PLATE_LIT, width=2)
            d.point((cx - 12, cy + 8), fill=GOLD_LIT)

            d.line([(cx + 8, cy - 2), (cx + 14, cy + 2), (cx + 17, cy + 6)], fill=PLATE_LIT, width=2)
            d.point((cx + 17, cy + 6), fill=GOLD_LIT)

            orb_phase = frame * 1.57
            orb_ox = int(math.cos(orb_phase) * 3)
            orb_oy = int(math.sin(orb_phase) * 2)
            orb_x = cx + 18 + orb_ox
            orb_y = cy + 4 + orb_oy

            draw_disc(d, orb_x, orb_y, 5, fill=VOID_DEEP, outline=OUTLINE)
            draw_disc(d, orb_x, orb_y, 3, fill=VOID_MAGENTA)
            draw_disc(d, orb_x, orb_y, 2, fill=VOID_CYAN)
            draw_disc(d, orb_x, orb_y, 1, fill=VOID_WHITE)
            d.ellipse([orb_x - 6, orb_y - 2, orb_x + 6, orb_y + 2], outline=VOID_CYAN)

        sheet.paste(img, (frame * FW, 0))

    return sheet


# ==============================================================================
# 4. BOSS MAGMA COLOSSUS (384 x 64 -> 6 frames of 64x64)
# ==============================================================================
def generate_boss_magma_colossus():
    FW, FH = 64, 64
    sheet = create_canvas(FW * 6, FH)

    OUTLINE = (18, 8, 6, 255)
    BASALT_DARK = (36, 20, 18, 255)
    BASALT_MID = (62, 38, 32, 255)
    BASALT_LIT = (94, 62, 50, 255)
    BASALT_HI = (132, 92, 76, 255)

    MAGMA_CRUST = (165, 30, 8, 255)
    MAGMA_RED = (220, 50, 10, 255)
    MAGMA_ORANGE = (255, 115, 12, 255)
    MAGMA_GOLD = (255, 195, 30, 255)
    MAGMA_WHITE = (255, 255, 195, 255)

    SMOKE_DARK = (42, 32, 36, 210)
    SMOKE_MID = (75, 62, 66, 170)

    for frame in range(6):
        img = create_canvas(FW, FH)
        d = ImageDraw.Draw(img)

        is_charge = (frame == 4)
        is_attack = (frame == 5)

        step = frame % 4
        bob = [0, 1, 0, 1, -2, 2][frame]
        tilt = [0, -1, 0, 1, 0, 0][frame]

        cx = 32
        cy = 32 + bob

        # Volcanic Smoke puffs from shoulder chimneys
        smoke_phase = frame * 1.2
        for s_side in [-1, 1]:
            sx = cx + s_side * 17
            sy = cy - 16
            draw_disc(d, sx + int(math.sin(smoke_phase + s_side)*2), sy - 4, 3, fill=SMOKE_MID)
            draw_disc(d, sx + int(math.sin(smoke_phase + s_side)*3), sy - 8, 4, fill=SMOKE_DARK)
            if (frame + s_side) % 2 == 0:
                d.point((sx + s_side * 2, sy - 12), fill=MAGMA_ORANGE)

        # Thick Basalt Pillar Legs
        leg_l_y = cy + 16
        leg_r_y = cy + 16
        foot_l_y = 59
        foot_r_y = 59

        if is_attack:
            d.rectangle([cx - 18, leg_l_y, cx - 8, foot_l_y], fill=BASALT_MID, outline=OUTLINE)
            d.rectangle([cx + 8, leg_r_y, cx + 18, foot_r_y], fill=BASALT_MID, outline=OUTLINE)
        elif step == 1:
            d.rectangle([cx - 16, leg_l_y, cx - 6, foot_l_y - 2], fill=BASALT_LIT, outline=OUTLINE)
            d.rectangle([cx + 6, leg_r_y, cx + 16, foot_r_y], fill=BASALT_DARK, outline=OUTLINE)
        elif step == 3:
            d.rectangle([cx - 16, leg_l_y, cx - 6, foot_l_y], fill=BASALT_DARK, outline=OUTLINE)
            d.rectangle([cx + 6, leg_r_y, cx + 16, foot_r_y - 2], fill=BASALT_LIT, outline=OUTLINE)
        else:
            d.rectangle([cx - 16, leg_l_y, cx - 6, foot_l_y], fill=BASALT_MID, outline=OUTLINE)
            d.rectangle([cx + 6, leg_r_y, cx + 16, foot_r_y], fill=BASALT_MID, outline=OUTLINE)

        # Magma fissures running down legs
        d.line([(cx - 12, leg_l_y + 2), (cx - 10, leg_l_y + 6), (cx - 13, foot_l_y - 1)], fill=MAGMA_ORANGE, width=1)
        d.line([(cx + 12, leg_r_y + 2), (cx + 10, leg_r_y + 6), (cx + 13, foot_r_y - 1)], fill=MAGMA_ORANGE, width=1)

        # Colossal Stone Torso (V-shaped titanic rock mass)
        torso_pts = [
            (cx - 20 + tilt, cy - 12),
            (cx + 20 + tilt, cy - 12),
            (cx + 13 + tilt, cy + 16),
            (cx - 13 + tilt, cy + 16)
        ]
        d.polygon(torso_pts, fill=BASALT_DARK, outline=OUTLINE)

        inner_torso = [
            (cx - 18 + tilt, cy - 10),
            (cx + 18 + tilt, cy - 10),
            (cx + 11 + tilt, cy + 14),
            (cx - 11 + tilt, cy + 14)
        ]
        d.polygon(inner_torso, fill=BASALT_MID)
        d.line([(cx - 18 + tilt, cy - 10), (cx + 18 + tilt, cy - 10)], fill=BASALT_HI, width=1)
        d.line([(cx - 18 + tilt, cy - 10), (cx - 11 + tilt, cy + 14)], fill=BASALT_LIT, width=1)

        # Central Magma Furnace Core in chest
        furnace_y = cy + 2
        core_scale = 1.4 if is_charge else (1.2 if is_attack else 1.0)
        draw_disc(d, cx + tilt, furnace_y, int(6 * core_scale), fill=MAGMA_RED, outline=OUTLINE)
        draw_disc(d, cx + tilt, furnace_y, int(4 * core_scale), fill=MAGMA_ORANGE)
        draw_disc(d, cx + tilt, furnace_y, int(2 * core_scale), fill=MAGMA_GOLD)
        draw_disc(d, cx + tilt, furnace_y, max(1, int(1 * core_scale)), fill=MAGMA_WHITE)

        # Spreading Molten Veins
        veins = [
            [(cx + tilt, furnace_y - 4), (cx - 8 + tilt, furnace_y - 8), (cx - 14 + tilt, furnace_y - 10)],
            [(cx + tilt, furnace_y - 4), (cx + 8 + tilt, furnace_y - 8), (cx + 14 + tilt, furnace_y - 10)],
            [(cx + tilt, furnace_y + 4), (cx - 6 + tilt, furnace_y + 10), (cx - 9 + tilt, furnace_y + 14)],
            [(cx + tilt, furnace_y + 4), (cx + 6 + tilt, furnace_y + 10), (cx + 9 + tilt, furnace_y + 14)],
        ]
        for v in veins:
            d.line(v, fill=MAGMA_ORANGE, width=2)
            d.line(v, fill=MAGMA_GOLD, width=1)

        # Shoulder Chimneys
        lc = [(cx - 22 + tilt, cy - 6), (cx - 18 + tilt, cy - 16), (cx - 12 + tilt, cy - 16), (cx - 14 + tilt, cy - 6)]
        d.polygon(lc, fill=BASALT_LIT, outline=OUTLINE)
        d.line([(cx - 18 + tilt, cy - 16), (cx - 12 + tilt, cy - 16)], fill=MAGMA_GOLD, width=1)
        rc = [(cx + 14 + tilt, cy - 6), (cx + 12 + tilt, cy - 16), (cx + 18 + tilt, cy - 16), (cx + 22 + tilt, cy - 6)]
        d.polygon(rc, fill=BASALT_LIT, outline=OUTLINE)
        d.line([(cx + 12 + tilt, cy - 16), (cx + 18 + tilt, cy - 16)], fill=MAGMA_GOLD, width=1)

        # Head: Sunken Volcanic Crag Mask
        head_y = cy - 12
        d.polygon([(cx - 7 + tilt, head_y - 6), (cx + 7 + tilt, head_y - 6), (cx + 5 + tilt, head_y + 6), (cx - 5 + tilt, head_y + 6)], fill=BASALT_DARK, outline=OUTLINE)
        d.polygon([(cx - 5 + tilt, head_y - 4), (cx + 5 + tilt, head_y - 4), (cx + 4 + tilt, head_y + 4), (cx - 4 + tilt, head_y + 4)], fill=BASALT_MID)

        # Jagged Obsidian Magma Horns
        d.line([(cx - 6 + tilt, head_y - 4), (cx - 10 + tilt, head_y - 12), (cx - 14 + tilt, head_y - 15)], fill=BASALT_DARK, width=3)
        d.line([(cx - 6 + tilt, head_y - 4), (cx - 10 + tilt, head_y - 12), (cx - 14 + tilt, head_y - 15)], fill=MAGMA_ORANGE, width=1)
        d.point((cx - 14 + tilt, head_y - 15), fill=MAGMA_GOLD)

        d.line([(cx + 6 + tilt, head_y - 4), (cx + 10 + tilt, head_y - 12), (cx + 14 + tilt, head_y - 15)], fill=BASALT_DARK, width=3)
        d.line([(cx + 6 + tilt, head_y - 4), (cx + 10 + tilt, head_y - 12), (cx + 14 + tilt, head_y - 15)], fill=MAGMA_ORANGE, width=1)
        d.point((cx + 14 + tilt, head_y - 15), fill=MAGMA_GOLD)

        # Blazing Eyes & Mouth
        if is_charge:
            d.rectangle([cx - 4 + tilt, head_y - 2, cx - 1 + tilt, head_y], fill=MAGMA_WHITE)
            d.rectangle([cx + 1 + tilt, head_y - 2, cx + 4 + tilt, head_y], fill=MAGMA_WHITE)
            d.line([(cx - 3 + tilt, head_y + 3), (cx + 3 + tilt, head_y + 3)], fill=MAGMA_GOLD, width=1)
        else:
            d.rectangle([cx - 4 + tilt, head_y - 2, cx - 1 + tilt, head_y], fill=MAGMA_GOLD)
            d.rectangle([cx + 1 + tilt, head_y - 2, cx + 4 + tilt, head_y], fill=MAGMA_GOLD)
            d.point((cx - 2 + tilt, head_y - 1), fill=MAGMA_WHITE)
            d.point((cx + 2 + tilt, head_y - 1), fill=MAGMA_WHITE)
            d.line([(cx - 2 + tilt, head_y + 3), (cx + 2 + tilt, head_y + 3)], fill=MAGMA_ORANGE, width=1)

        # Arms & Boulder Fists
        if is_charge:
            d.line([(cx - 18, cy - 6), (cx - 22, cy - 18), (cx - 16, cy - 26)], fill=BASALT_MID, width=7)
            d.line([(cx - 18, cy - 6), (cx - 22, cy - 18), (cx - 16, cy - 26)], fill=OUTLINE, width=1)
            draw_disc(d, cx - 15, cy - 26, 7, fill=BASALT_LIT, outline=OUTLINE)
            d.line([(cx - 17, cy - 29), (cx - 13, cy - 23)], fill=MAGMA_GOLD, width=2)
            d.point((cx - 15, cy - 26), fill=MAGMA_WHITE)

            d.line([(cx + 18, cy - 6), (cx + 22, cy - 18), (cx + 16, cy - 26)], fill=BASALT_MID, width=7)
            d.line([(cx + 18, cy - 6), (cx + 22, cy - 18), (cx + 16, cy - 26)], fill=OUTLINE, width=1)
            draw_disc(d, cx + 15, cy - 26, 7, fill=BASALT_LIT, outline=OUTLINE)
            d.line([(cx + 13, cy - 29), (cx + 17, cy - 23)], fill=MAGMA_GOLD, width=2)
            d.point((cx + 15, cy - 26), fill=MAGMA_WHITE)

            d.polygon([(cx - 18, cy - 18), (cx - 15, cy - 26), (cx - 12, cy - 18)], fill=MAGMA_GOLD)
            d.polygon([(cx + 12, cy - 18), (cx + 15, cy - 26), (cx + 18, cy - 18)], fill=MAGMA_GOLD)

        elif is_attack:
            d.line([(cx - 18, cy - 6), (cx - 24, cy + 8), (cx - 20, 52)], fill=BASALT_MID, width=7)
            d.line([(cx - 18, cy - 6), (cx - 24, cy + 8), (cx - 20, 52)], fill=OUTLINE, width=1)
            draw_disc(d, cx - 20, 52, 8, fill=BASALT_DARK, outline=OUTLINE)

            d.line([(cx + 18, cy - 6), (cx + 24, cy + 8), (cx + 20, 52)], fill=BASALT_MID, width=7)
            d.line([(cx + 18, cy - 6), (cx + 24, cy + 8), (cx + 20, 52)], fill=OUTLINE, width=1)
            draw_disc(d, cx + 20, 52, 8, fill=BASALT_DARK, outline=OUTLINE)

            d.ellipse([cx - 28, 52, cx + 28, 62], fill=MAGMA_CRUST)
            d.ellipse([cx - 22, 54, cx + 22, 60], fill=MAGMA_ORANGE)
            d.ellipse([cx - 14, 55, cx + 14, 59], fill=MAGMA_GOLD)
            d.line([(cx - 8, 57), (cx + 8, 57)], fill=MAGMA_WHITE, width=2)

            d.point((cx - 26, 46), fill=MAGMA_GOLD)
            d.point((cx - 20, 42), fill=MAGMA_WHITE)
            d.point((cx - 14, 45), fill=MAGMA_ORANGE)
            d.point((cx + 14, 45), fill=MAGMA_ORANGE)
            d.point((cx + 20, 42), fill=MAGMA_WHITE)
            d.point((cx + 26, 46), fill=MAGMA_GOLD)

        else:
            arm_swing = [0, -3, 0, 3][step]

            d.line([(cx - 18, cy - 6), (cx - 22, cy + 6), (cx - 20, cy + 16 + arm_swing)], fill=BASALT_MID, width=6)
            d.line([(cx - 18, cy - 6), (cx - 22, cy + 6), (cx - 20, cy + 16 + arm_swing)], fill=OUTLINE, width=1)
            draw_disc(d, cx - 20, cy + 16 + arm_swing, 7, fill=BASALT_LIT, outline=OUTLINE)
            d.line([(cx - 23, cy + 18 + arm_swing), (cx - 17, cy + 18 + arm_swing)], fill=MAGMA_ORANGE, width=2)
            d.point((cx - 20, cy + 18 + arm_swing), fill=MAGMA_GOLD)
            if frame % 2 == 1:
                d.point((cx - 20, cy + 22 + arm_swing), fill=MAGMA_ORANGE)

            d.line([(cx + 18, cy - 6), (cx + 22, cy + 6), (cx + 20, cy + 16 - arm_swing)], fill=BASALT_MID, width=6)
            d.line([(cx + 18, cy - 6), (cx + 22, cy + 6), (cx + 20, cy + 16 - arm_swing)], fill=OUTLINE, width=1)
            draw_disc(d, cx + 20, cy + 16 - arm_swing, 7, fill=BASALT_LIT, outline=OUTLINE)
            d.line([(cx + 17, cy + 18 - arm_swing), (cx + 23, cy + 18 - arm_swing)], fill=MAGMA_ORANGE, width=2)
            d.point((cx + 20, cy + 18 - arm_swing), fill=MAGMA_GOLD)
            if frame % 2 == 0:
                d.point((cx + 20, cy + 22 - arm_swing), fill=MAGMA_ORANGE)

        sheet.paste(img, (frame * FW, 0))

    return sheet


def main():
    target_dir = os.path.join("assets", "new_monsters")
    os.makedirs(target_dir, exist_ok=True)

    print("Generating Chaos Imp V3...")
    imp = generate_chaos_imp()
    imp.save(os.path.join(target_dir, "chaos_imp.png"))

    print("Generating Void Spider V3...")
    spider = generate_void_spider()
    spider.save(os.path.join(target_dir, "void_spider.png"))

    print("Generating Boss Void Overlord V3...")
    overlord = generate_boss_void_overlord()
    overlord.save(os.path.join(target_dir, "boss_void_overlord.png"))

    print("Generating Boss Magma Colossus V3...")
    colossus = generate_boss_magma_colossus()
    colossus.save(os.path.join(target_dir, "boss_magma_colossus.png"))

    print("All 4 monster spritesheets successfully compiled!")

if __name__ == "__main__":
    main()
