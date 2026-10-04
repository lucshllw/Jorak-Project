"""Extract the supplied illustration without redrawing it or replacing its identity."""
import argparse, pathlib, shutil
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

ROOT = pathlib.Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('source')
args = parser.parse_args()
source = pathlib.Path(args.source)
image = Image.open(source).convert('RGB')
pixels = np.asarray(image).astype(np.float32)
h, w = pixels.shape[:2]
neutral = pixels.max(axis=2)-pixels.min(axis=2) < 20
candidate = neutral & (pixels.min(axis=2) > 150)
background = np.zeros((h,w), dtype=bool)
queue = deque()
for x in range(w): queue.extend(((0,x),(h-1,x)))
for y in range(h): queue.extend(((y,0),(y,w-1)))
# The visible gap between the trouser legs is background, not the white zipper.
queue.append((int(h*.837),int(w*.54)))
while queue:
    y,x=queue.popleft()
    if y<0 or x<0 or y>=h or x>=w or background[y,x] or not candidate[y,x]: continue
    background[y,x]=True
    queue.extend(((y-1,x),(y+1,x),(y,x-1),(y,x+1)))
alpha=np.where(background,0,255).astype(np.uint8)
edge=np.asarray(Image.fromarray((background*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(3)))>0
# Remove only checkerboard colour contamination on the one-pixel outer edge.
for y,x in zip(*np.where(edge & ~background & neutral & (pixels.min(axis=2)>45))):
    neighbours=[pixels[yy,xx].mean() for yy in range(max(0,y-1),min(h,y+2)) for xx in range(max(0,x-1),min(w,x+2)) if background[yy,xx]]
    if not neighbours: continue
    base=float(np.median(neighbours)); value=float(pixels[y,x].mean())
    coverage=max(.05,min(1,(base-value)/max(1,base-20)))
    if coverage<1:
        alpha[y,x]=int(255*coverage)
        pixels[y,x]=np.clip((pixels[y,x]-(1-coverage)*base)/coverage,0,255)
rgba=np.dstack((pixels.astype(np.uint8),alpha))
output=Image.fromarray(rgba).crop(Image.fromarray(alpha).getbbox())
directory=ROOT/'public/media/character';directory.mkdir(parents=True,exist_ok=True)
original=directory/'jorak-reference-original.png'
if not original.exists(): shutil.copy2(source,original)
output.save(directory/'jorak-standing.png',optimize=True)
verification=ROOT/'research/verification';verification.mkdir(parents=True,exist_ok=True)
sheet=Image.new('RGB',(output.width*2,output.height),'#06140f')
sheet.paste(output,(0,0),output)
green=Image.new('RGBA',output.size,'#28c78b');green.alpha_composite(output)
sheet.paste(green.convert('RGB'),(output.width,0))
sheet.save(verification/'character-transparency.png')
print({'output':str(directory/'jorak-standing.png'),'size':output.size,'transparentPixels':int((alpha==0).sum()),'partialEdgePixels':int(((alpha>0)&(alpha<255)).sum())})
