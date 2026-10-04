"""Trace the supplied JORAK artwork into editable, font-independent 3D profiles.

Run with Pillow and NumPy. The output uses source-image coordinates, including
the transparent holes in the lettering, and never resizes a texture for rendering.
"""

from collections import defaultdict, deque
import json
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public/media/jorak-wordmark.png"
OUTPUT = ROOT / "public/media/jorak-logo-shapes.json"
EPSILON = 0.28
TRACE_SCALE = 4


def connected_regions(mask):
    height, width = mask.shape
    seen = np.zeros_like(mask, dtype=bool)
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]:
            continue
        queue = deque([(sx, sy)])
        seen[sy, sx] = True
        region = []
        touches_edge = False
        while queue:
            x, y = queue.popleft()
            region.append((x, y))
            touches_edge |= x == 0 or y == 0 or x == width - 1 or y == height - 1
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if 0 <= nx < width and 0 <= ny < height and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    queue.append((nx, ny))
        yield region, touches_edge


def fill_painted_holes(mask, alpha):
    """Keep transparent letter counters; fill only enclosed painted highlights."""
    result = mask.copy()
    for region, touches_edge in connected_regions(~mask):
        if not touches_edge and all(alpha[y, x] > 128 for x, y in region):
            for x, y in region:
                result[y, x] = True
    return result


def remove_specks(mask, minimum=5):
    result = mask.copy()
    for region, _ in connected_regions(mask):
        if len(region) < minimum:
            for x, y in region:
                result[y, x] = False
    return result


def area(points):
    return sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(points, points[1:] + points[:1])) / 2


def simplify_open(points, epsilon):
    if len(points) < 3:
        return points
    first = np.array(points[0], dtype=float)
    last = np.array(points[-1], dtype=float)
    middle = np.array(points[1:-1], dtype=float)
    delta = last - first
    length = np.linalg.norm(delta)
    if length == 0:
        distances = np.linalg.norm(middle - first, axis=1)
    else:
        projection = np.clip(((middle - first) @ delta) / (length * length), 0, 1)
        distances = np.linalg.norm(middle - (first + projection[:, None] * delta), axis=1)
    index = int(np.argmax(distances)) + 1
    if distances[index - 1] <= epsilon:
        return [points[0], points[-1]]
    return simplify_open(points[:index + 1], epsilon)[:-1] + simplify_open(points[index:], epsilon)


def simplify_closed(points, tolerance=EPSILON):
    start = min(range(len(points)), key=lambda i: (points[i][0], points[i][1]))
    points = points[start:] + points[:start]
    opposite = max(range(len(points)), key=lambda i: (points[i][0] - points[0][0]) ** 2 + (points[i][1] - points[0][1]) ** 2)
    first = simplify_open(points[:opposite + 1], tolerance)
    second = simplify_open(points[opposite:] + [points[0]], tolerance)
    return [[round(x, 3), round(y, 3)] for x, y in first[:-1] + second[:-1]]


def inside(point, polygon):
    x, y = point
    result = False
    for a, b in zip(polygon, polygon[1:] + polygon[:1]):
        if (a[1] > y) != (b[1] > y) and x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]:
            result = not result
    return result


def trace(mask, blur=0.35, min_area=2, tolerance=EPSILON, exact_pixels=False):
    # Supersampling interpolates the supplied anti-aliased boundary. The resulting
    # JSON contains polygons only; it is not a larger bitmap or an image texture.
    bitmap = Image.fromarray(np.uint8(mask) * 255)
    if blur:
        bitmap = bitmap.filter(ImageFilter.GaussianBlur(blur))
    bitmap = bitmap.resize((bitmap.width * TRACE_SCALE, bitmap.height * TRACE_SCALE), Image.Resampling.NEAREST if exact_pixels else Image.Resampling.BILINEAR)
    binary = np.asarray(bitmap) >= 128
    padded = np.pad(binary, 1)
    neighbors = (padded[:-2, 1:-1], padded[1:-1, 2:], padded[2:, 1:-1], padded[1:-1, :-2])
    edges = defaultdict(list)
    # Clockwise outer boundaries in image coordinates; counterclockwise holes.
    for side, neighbor in enumerate(neighbors):
        for y, x in zip(*np.nonzero(binary & ~neighbor)):
            x, y = int(x), int(y)
            vertices = ((x, y), (x + 1, y), (x + 1, y + 1), (x, y + 1))
            edges[vertices[side]].append(vertices[(side + 1) % 4])
    loops = []
    directions = {(1, 0): 0, (0, 1): 1, (-1, 0): 2, (0, -1): 3}
    while edges:
        start = next(iter(edges))
        point = start
        previous_direction = None
        loop = []
        while True:
            loop.append(point)
            candidates = edges[point]
            if previous_direction is None or len(candidates) == 1:
                nxt = candidates[0]
            else:
                def priority(candidate):
                    direction = directions[(candidate[0] - point[0], candidate[1] - point[1])]
                    return {1: 0, 0: 1, 3: 2, 2: 3}[(direction - previous_direction) % 4]
                nxt = min(candidates, key=priority)
            candidates.remove(nxt)
            if not candidates:
                del edges[point]
            previous_direction = directions[(nxt[0] - point[0], nxt[1] - point[1])]
            point = nxt
            if point == start:
                break
        points = [(x / TRACE_SCALE, y / TRACE_SCALE) for x, y in loop]
        if abs(area(points)) >= min_area:
            loops.append(simplify_closed(points, tolerance))
    outers = sorted((loop for loop in loops if area(loop) > 0), key=lambda loop: -area(loop))
    holes = [loop for loop in loops if area(loop) < 0]
    shapes = [{"outer": outer, "holes": []} for outer in outers]
    for hole in holes:
        containers = [shape for shape in shapes if inside(hole[0], shape["outer"])]
        if containers:
            min(containers, key=lambda shape: abs(area(shape["outer"]))) ["holes"].append(hole)
    return shapes


def rings_of(shapes):
    return [ring for shape in shapes for ring in [shape["outer"]] + shape["holes"]]


def sampled_boundary(rings, step=0.25):
    points = []
    for ring in rings:
        for first, last in zip(ring, ring[1:] + ring[:1]):
            start, end = np.array(first), np.array(last)
            count = max(1, int(np.ceil(np.linalg.norm(end - start) / step)))
            points.extend(start + (end - start) * t / count for t in range(count))
    return np.array(points)


def distance_to_boundary(points, rings):
    segments = np.array([(a, b) for ring in rings for a, b in zip(ring, ring[1:] + ring[:1])], dtype=float)
    starts = segments[:, 0]
    delta = segments[:, 1] - starts
    squared_length = np.maximum(np.sum(delta * delta, axis=1), 1e-12)
    maximum = 0.0
    for begin in range(0, len(points), 128):
        sample = points[begin:begin + 128]
        relative = sample[:, None, :] - starts[None, :, :]
        projection = np.clip(np.sum(relative * delta[None, :, :], axis=2) / squared_length, 0, 1)
        distances = np.linalg.norm(relative - projection[:, :, None] * delta[None, :, :], axis=2)
        maximum = max(maximum, float(np.max(np.min(distances, axis=1))))
    return maximum


def boundary_deviation(shapes, original):
    rings, source_rings = rings_of(shapes), rings_of(original)
    # Each segment is sampled at <= 0.25 px. Adding half that interval provides
    # a conservative upper bound between samples, rather than only a mean error.
    forward = distance_to_boundary(sampled_boundary(rings), source_rings)
    reverse = distance_to_boundary(sampled_boundary(source_rings), rings)
    return max(forward, reverse) + 0.125


def raster_mask(shapes, size, scale=4):
    bitmap = Image.new("L", (size[0] * scale, size[1] * scale), 0)
    draw = ImageDraw.Draw(bitmap)
    for shape in shapes:
        draw.polygon([(x * scale, y * scale) for x, y in shape["outer"]], fill=255)
        for hole in shape["holes"]:
            draw.polygon([(x * scale, y * scale) for x, y in hole], fill=0)
    return np.asarray(bitmap) > 128


def smooth_profile(mask, size, min_area, name="profile"):
    exact = trace(mask, blur=0, min_area=min_area, tolerance=0, exact_pixels=True)
    expected_topology = (len(exact), sum(len(shape["holes"]) for shape in exact))
    for sigma in (0.70, 0.65, 0.60, 0.55, 0.50, 0.45, 0.35, 0.25):
        result = trace(mask, blur=sigma, min_area=min_area)
        topology = (len(result), sum(len(shape["holes"]) for shape in result))
        if topology != expected_topology:
            continue
        deviation = boundary_deviation(result, exact)
        if deviation <= 0.75:
            original_mask = raster_mask(exact, size)
            smooth_mask = raster_mask(result, size)
            iou = np.count_nonzero(original_mask & smooth_mask) / np.count_nonzero(original_mask | smooth_mask)
            return result, exact, {"blurSigmaPx": sigma, "maxBoundaryDeviationPx": round(deviation, 4), "rasterIou4x": round(iou, 6), "topologyPreserved": True}
    raise ValueError("Could not smooth profile without exceeding 0.75 px or changing topology")


def draw_shapes(shapes, size, color, background=(0, 0, 0, 0)):
    image = Image.new("RGBA", size, background)
    draw = ImageDraw.Draw(image)
    for shape in shapes:
        draw.polygon([tuple(point) for point in shape["outer"]], fill=color)
        for hole in shape["holes"]:
            draw.polygon([tuple(point) for point in hole], fill=background)
    return image


def render_profiles(profiles, size, colors, scale=1, antialias=4):
    render_scale = scale * antialias
    panel = Image.new("RGBA", (size[0] * render_scale, size[1] * render_scale), (7, 15, 11, 255))
    for name, shapes in profiles.items():
        scaled = [{"outer": [[x * render_scale, y * render_scale] for x, y in shape["outer"]], "holes": [[[x * render_scale, y * render_scale] for x, y in ring] for ring in shape["holes"]]} for shape in shapes]
        panel.alpha_composite(draw_shapes(scaled, panel.size, colors[name]))
    return panel.resize((size[0] * scale, size[1] * scale), Image.Resampling.LANCZOS).convert("RGB")


def main():
    image = Image.open(SOURCE).convert("RGBA")
    pixels = np.asarray(image).astype(np.int16)
    r, g, b, alpha = [pixels[:, :, channel] for channel in range(4)]
    opaque = alpha > 128
    # The supplied PNG retains the banner underneath two letter counters. Their
    # background colors are disconnected from the green glyph faces and bounded
    # by the original white stroke. Remove only those painted background islands.
    counters = np.zeros_like(opaque)
    for left, top, right, bottom in ((192, 107, 214, 133), (284, 79, 306, 106)):
        region = np.zeros_like(opaque)
        region[top:bottom, left:right] = True
        background = region & (r > g * 0.43) & (g - r > 12) & (b < 185) & (np.minimum(r, b) < 180)
        island, _ = max(connected_regions(background), key=lambda item: len(item[0]))
        for x, y in island:
            counters[y, x] = True
    effective_alpha = np.where(counters, 0, alpha)
    opaque &= ~counters
    green = opaque & (g > 28) & (g - r > 8) & (g - b > 7)
    body = fill_painted_holes(remove_specks(green, minimum=1000), effective_alpha)
    bright_green = opaque & (g > 115) & (g - r > 10) & (g - b > 65) & (b < 120)
    face = fill_painted_holes(remove_specks(bright_green, minimum=100), effective_alpha)
    # The A's small white counter is intentional white artwork, not a transparent
    # banner island. Keep that inlay while excluding it from green/body surfaces.
    counter_a = np.zeros_like(opaque)
    counter_a[113:130, 400:421] = True
    for region, touches_edge in connected_regions(~green):
        if not touches_edge and any(counter_a[y, x] for x, y in region):
            for x, y in region:
                body[y, x] = False
    for region, touches_edge in connected_regions(~bright_green):
        if not touches_edge and any(counter_a[y, x] for x, y in region):
            for x, y in region:
                face[y, x] = False
    glints = remove_specks(face & (r > 140) & (g > 185) & (b > 115), minimum=10)
    masks = {"whiteBorder": (opaque, 4), "body": (body, 8), "greenFaces": (face, 12), "highlights": (glints, 3)}
    profiles, originals, metrics = {}, {}, {}
    for name, (mask, min_area) in masks.items():
        profiles[name], originals[name], metrics[name] = smooth_profile(mask, image.size, min_area, name)
    payload = {
        "version": 1,
        "source": "/media/jorak-wordmark.png",
        "width": image.width,
        "height": image.height,
        "coordinateSystem": "image-x-right-y-down",
        "simplificationTolerancePx": EPSILON,
        "maxContourDeviationPx": 0.75,
        "metrics": metrics,
        "materials": {
            "whiteBorder": "#F4FBF4",
            "body": "#084A2F",
            "greenFaces": "#4DBB19",
            "highlights": "#EAFFDA",
        },
        "profiles": profiles,
    }
    OUTPUT.write_text(json.dumps(payload, separators=(",", ":")), encoding="utf-8")
    preview = render_profiles(profiles, image.size, payload["materials"])
    preview_path = ROOT / "research/verification/logo-vector-preview.png"
    preview_path.parent.mkdir(parents=True, exist_ok=True)
    preview.convert("RGB").save(preview_path)
    audit = Image.new("RGB", (image.width * 8, image.height * 4), (7, 15, 11))
    for index, source in enumerate((originals, profiles)):
        panel = render_profiles(source, image.size, payload["materials"], scale=4, antialias=2)
        audit.paste(panel, (index * image.width * 4, 0))
    audit.save(preview_path.with_name("logo-contour-audit-4x.png"))
    report = {name: {"shapes": len(shapes), "holes": sum(len(shape["holes"]) for shape in shapes), "vertices": sum(len(shape["outer"]) + sum(len(hole) for hole in shape["holes"]) for shape in shapes)} for name, shapes in profiles.items()}
    print(json.dumps({"output": str(OUTPUT), "sizeBytes": OUTPUT.stat().st_size, "profiles": report, "metrics": metrics}, indent=2))


if __name__ == "__main__":
    main()
