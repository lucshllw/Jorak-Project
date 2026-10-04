"""Owner-only artwork maintenance. Preserves sources; never stretches thumbnail pixels."""
import argparse, hashlib, io, json, pathlib, urllib.request
from PIL import Image, ImageStat

ROOT = pathlib.Path(__file__).resolve().parents[1]

def border_crop(image):
    rgb = image.convert('RGB')
    w, h = rgb.size
    def black(box):
        strip = rgb.crop(box)
        stats = ImageStat.Stat(strip)
        return max(stats.mean) < 12 and max(stats.stddev) < 10
    top, bottom, left, right = 0, h, 0, w
    while top < int(h * .19) and black((0, top, w, top + 1)): top += 1
    while bottom > int(h * .81) and black((0, bottom - 1, w, bottom)): bottom -= 1
    while left < int(w * .12) and black((left, top, left + 1, bottom)): left += 1
    while right > int(w * .88) and black((right - 1, top, right, bottom)): right -= 1
    return (left, top, right, bottom)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--execute', action='store_true')
    args = parser.parse_args()
    catalog = json.loads((ROOT / 'data/catalog.json').read_text('utf-8'))
    projects = [p for p in catalog['portfolio']['projects'] if p['coverSource'] == 'youtube']
    if not args.execute:
        print(json.dumps({'mode': 'dry-run', 'youtubeThumbnails': len(projects)})); return
    originals = ROOT / '.local-data/artwork/originals'
    originals.mkdir(parents=True, exist_ok=True)
    entries = []
    for p in projects:
        video_id = p['youtubeUrl'].split('v=')[1].split('&')[0]
        candidates = []
        for version in ('maxresdefault', 'sddefault', 'hqdefault'):
            url = f'https://i.ytimg.com/vi/{video_id}/{version}.jpg'
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'JORAK-artwork-maintenance'}), timeout=20) as response:
                    payload = response.read(10 * 1024 * 1024)
                image = Image.open(io.BytesIO(payload)); image.load()
                if image.width < 480: continue  # YouTube's unavailable-thumbnail placeholder is small.
                bounds = border_crop(image)
                area = (bounds[2]-bounds[0]) * (bounds[3]-bounds[1])
                candidates.append((area, image, payload, url, bounds))
            except Exception as error:
                print(f'{p["slug"]}: {version} unavailable ({type(error).__name__})')
        if not candidates: raise RuntimeError(f'No usable original thumbnail: {p["slug"]}')
        _, image, payload, url, bounds = max(candidates, key=lambda item: item[0])
        source = originals / f'{p["slug"]}.jpg'
        if source.exists() and source.read_bytes() != payload:
            backup = originals / f'{p["slug"]}-{hashlib.sha256(source.read_bytes()).hexdigest()[:12]}.jpg'
            if not backup.exists(): backup.write_bytes(source.read_bytes())
        source.write_bytes(payload)
        target = ROOT / 'public' / p['coverUrl'].lstrip('/')
        if bounds == (0, 0, image.width, image.height): target.write_bytes(payload)
        else: image.crop(bounds).convert('RGB').save(target, quality=96, subsampling=0, optimize=True)
        output = Image.open(target)
        entries.append({'slug':p['slug'], 'originalUrl':p['youtubeUrl'], 'thumbnailUrl':url,
                        'sourceSize':list(image.size), 'crop':list(bounds), 'outputSize':list(output.size),
                        'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),
                        'position':p['coverPosition'], 'upscaled':False})
        print(f'{p["slug"]}: {image.size} -> {output.size}')
    (ROOT / 'data/artwork.json').write_text(json.dumps({'version':1, 'method':'Original public YouTube thumbnails; only outer solid black strips removed. Original sources retained in .local-data/artwork/originals; no upscaling.', 'entries':entries},ensure_ascii=False,indent=2)+'\n','utf-8')

if __name__ == '__main__': main()
