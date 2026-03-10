#!/usr/bin/env python3
"""Generate LectureRecorder app icon as PNG, then build ICNS using iconutil."""
import struct, zlib, math, os, subprocess, shutil

def make_png(size):
    """Draw a mic-in-circle icon at the given pixel size."""
    pixels = []
    cx = cy = size / 2
    r = size / 2

    for y in range(size):
        row = []
        for x in range(size):
            dx = x - cx
            dy = y - cy
            dist = math.sqrt(dx*dx + dy*dy)
            nx = dx / r
            ny = dy / r

            # ── background gradient (dark indigo → dark slate)
            t = (ny + 1) / 2  # 0 top → 1 bottom
            bg_r = int(18 + t * 12)
            bg_g = int(18 + t * 8)
            bg_b = int(30 + t * 10)

            # ── circular clip (anti-alias at edge)
            edge = dist - (r - 1.5)
            if edge > 1.5:
                row.append((0, 0, 0, 0))
                continue

            alpha = 255
            if edge > -0.5:
                alpha = int(255 * (1.5 - edge) / 2)

            # ── accent ring (outer glow)
            ring_w = size * 0.015
            ring_r = r * 0.88
            ring_dist = abs(dist - ring_r)
            ring_glow = max(0, 1 - ring_dist / (ring_w * 2))

            # ── microphone body (rounded rectangle)
            mic_w  = size * 0.14
            mic_h  = size * 0.26
            mic_cr = mic_w * 0.5  # corner radius
            mic_x  = abs(dx) - (mic_w / 2 - mic_cr)
            mic_y_top = cy - size * 0.24
            mic_y_bot = cy + size * 0.02
            in_mic = False
            if mic_y_top <= y <= mic_y_bot and abs(dx) <= mic_w / 2:
                in_mic = True
            # rounded top cap
            cap_cy = mic_y_top + mic_cr
            cap_dist = math.sqrt(dx*dx + (y - cap_cy)**2)
            if y < mic_y_top + mic_cr and cap_dist <= mic_cr:
                in_mic = True
            # rounded bottom cap
            bot_cy = mic_y_bot - mic_cr
            bot_dist = math.sqrt(dx*dx + (y - bot_cy)**2)
            if y > mic_y_bot - mic_cr and bot_dist <= mic_cr:
                in_mic = True

            # ── arc below mic body
            arc_r  = size * 0.21
            arc_cy = cy - size * 0.10
            arc_w  = size * 0.025
            arc_dist = abs(math.sqrt(dx*dx + (y - arc_cy)**2) - arc_r)
            in_arc = arc_dist < arc_w and y > arc_cy and abs(dx) < arc_r * 0.96

            # ── stem line
            stem_x = size * 0.018
            stem_y0 = cy + size * 0.11
            stem_y1 = cy + size * 0.22
            in_stem = abs(dx) <= stem_x and stem_y0 <= y <= stem_y1

            # ── base line
            base_w = size * 0.15
            base_h = size * 0.018
            in_base = abs(dx) <= base_w and abs(y - stem_y1) <= base_h

            # ── colours
            if in_mic:
                pr, pg, pb = 255, 255, 255
            elif in_arc or in_stem or in_base:
                pr, pg, pb = 200, 200, 220
            else:
                # background + accent ring glow
                pr = min(255, bg_r + int(ring_glow * 80))
                pg = min(255, bg_g + int(ring_glow * 70))
                pb = min(255, bg_b + int(ring_glow * 180))

            row.append((pr, pg, pb, alpha))
        pixels.append(row)

    return encode_png(size, size, pixels)


def encode_png(w, h, pixels):
    def chunk(t, d):
        c = t + d
        return struct.pack('>I', len(d)) + c + struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0))  # RGBA

    raw = b''
    for row in pixels:
        raw += b'\x00'
        for r, g, b, a in row:
            raw += bytes([r, g, b, a])
    idat = chunk(b'IDAT', zlib.compress(raw, 9))
    iend = chunk(b'IEND', b'')
    return sig + ihdr + idat + iend


def build_icns(out_dir):
    iconset = os.path.join(out_dir, 'AppIcon.iconset')
    os.makedirs(iconset, exist_ok=True)

    sizes = [16, 32, 64, 128, 256, 512, 1024]
    for s in sizes:
        png = make_png(s)
        fname = f'icon_{s}x{s}.png'
        with open(os.path.join(iconset, fname), 'wb') as f:
            f.write(png)
        # @2x variants
        if s <= 512:
            fname2 = f'icon_{s}x{s}@2x.png'
            png2 = make_png(s * 2)
            with open(os.path.join(iconset, fname2), 'wb') as f:
                f.write(png2)

    icns_path = os.path.join(out_dir, 'icon.icns')
    subprocess.run(['iconutil', '-c', 'icns', iconset, '-o', icns_path], check=True)
    shutil.rmtree(iconset)
    print(f'Icon written to {icns_path}')


if __name__ == '__main__':
    out = os.path.join(os.path.dirname(__file__), '..', 'build')
    os.makedirs(out, exist_ok=True)
    build_icns(out)
