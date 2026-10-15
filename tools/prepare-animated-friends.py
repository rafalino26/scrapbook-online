"""Convert selected existing community stickers into small, looping desk GIFs."""
import json
import urllib.request
from pathlib import Path
from PIL import Image, ImageSequence

root = Path(__file__).resolve().parents[1]
dest = root / 'public/nailong/animated'
dest.mkdir(exist_ok=True)
urls = [entry['source'] for entry in json.loads((dest / 'sources.json').read_text(encoding='utf-8'))]
sources = [dict(file=f'friend-{i+1:02}.webp', name=f'Nailong gerak {i+1}', source=url, pack='https://soylanet.com/en/pack/A5F3W/') for i, url in enumerate(urls)]
chosen = range(len(sources))
manifest = []
for index in chosen:
    entry = sources[index]
    stem = entry['file'].removesuffix('.webp').replace('sticker-', '')
    original = dest / (stem + '-source.webp')
    if not original.exists():
        req = urllib.request.Request(entry['source'], headers={'User-Agent': 'Mozilla/5.0'})
        original.write_bytes(urllib.request.urlopen(req, timeout=30).read())
    with Image.open(original) as im:
        if getattr(im, 'n_frames', 1) < 2:
            print(stem, 'static, skipped')
            continue
        frames, durations = [], []
        bounds = None
        for frame in ImageSequence.Iterator(im):
            rgba = frame.convert('RGBA')
            box = rgba.getchannel('A').getbbox()
            if box:
                bounds = box if bounds is None else (min(bounds[0], box[0]), min(bounds[1], box[1]), max(bounds[2], box[2]), max(bounds[3], box[3]))
            frames.append(rgba.copy())
            durations.append(max(40, frame.info.get('duration', 100)))
        gifs = []
        for rgba in frames:
            rgba = rgba.crop(bounds)
            rgba.thumbnail((128, 128), Image.Resampling.LANCZOS)
            pal = rgba.convert('RGB').quantize(colors=127)
            pal.paste(127, mask=rgba.getchannel('A').point(lambda a: 255 if a < 128 else 0))
            pal.info.clear()
            gifs.append(pal)
        gif = dest / (stem + '.gif')
        gifs[0].save(gif, save_all=True, append_images=gifs[1:], duration=durations, loop=0, transparency=127, disposal=2, optimize=False)
        still = frames[0].crop(bounds)
        still.thumbnail((128, 128), Image.Resampling.LANCZOS)
        still.save(dest / (stem + '-still.webp'))
        manifest.append(dict(name=entry['name'], src='public/nailong/animated/' + gif.name, still='public/nailong/animated/' + stem + '-still.webp', source=entry['source'], pack=entry.get('pack', 'https://soylanet.com/en/pack/Z7G5A/'), frames=len(frames), bytes=gif.stat().st_size))
        print(stem, len(frames), gif.stat().st_size)
(dest / 'sources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
