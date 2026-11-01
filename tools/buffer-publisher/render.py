"""Exact typography cards; only scale supplied artwork, never recreate logos."""
import hashlib
import json
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
EXPECTED_LOGO = '3ce931c79be005ed0fcbb513a14c169364e67bfa17073e068483eebb28584647'
STAGES = {'target':'SASARAN','buyer':'FAHAMI PEMBELI','offer':'TAWARAN','lead':'PERTANYAAN','qualify':'KESESUAIAN','value':'NILAI','close':'KEPUTUSAN','follow-up':'SUSULAN','multiply':'SELEPAS JUALAN','operate':'CARA KERJA'}
GOLD = '#F0CA50'
WHITE = '#F4F4F1'
MUTED = '#BCC0C8'

def wrapped(text, font, width):
    words = text.replace('“','"').replace('”','"').split()
    lines, line = [], ''
    for word in words:
        test = f'{line} {word}'.strip()
        if font.getlength(test) <= width:
            line = test
        else:
            if not line:
                raise ValueError('Word too wide')
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines

def block(draw, text, box, size, color, stroke=0):
    x,y,w,h = box
    for current in range(size,33,-2):
        font = ImageFont.load_default(size=current)
        lines = wrapped(text,font,w)
        leading = int(current*1.30)
        if len(lines)*leading <= h:
            for line in lines:
                draw.text((x,y),line,font=font,fill=color,stroke_width=stroke,stroke_fill=color)
                y += leading
            return y
    raise ValueError(f'Text does not fit: {text}')

def render(package, destination):
    logo_path = ROOT/'assets'/'official-logo.jpg'
    if hashlib.sha256(logo_path.read_bytes()).hexdigest() != EXPECTED_LOGO:
        raise ValueError('Official artwork checksum mismatch')
    logo = Image.open(logo_path).convert('RGB')
    assert logo.size == (1536,1536)
    seed = package['seed']
    output = Path(destination)
    output.mkdir(parents=True,exist_ok=True)
    manifest = []
    for shape,height in [('portrait',1350),('vertical',1920)]:
        top = 80 if height == 1350 else 230
        start = top+285
        footer = height-175 if height == 1350 else height-390
        for number in range(1,4):
            image = Image.new('RGB',(1080,height),'#07090D')
            draw = ImageDraw.Draw(image)
            # Use full official image without crop, tint or distortion.
            mark = logo.resize((216,216),Image.Resampling.LANCZOS)
            image.paste(mark,(780,top-30))
            draw.text((84,top+30),'NOTA JUALAN',font=ImageFont.load_default(size=28),fill=MUTED)
            draw.text((84,top+95),STAGES[seed['stage']],font=ImageFont.load_default(size=34),fill=GOLD)
            draw.line((84,top+215,996,top+215),fill=GOLD,width=3)
            draw.text((84,top+244),f'0{number} / 03   ·   Contoh situasi jualan',font=ImageFont.load_default(size=25),fill=MUTED)
            available = footer-start-60
            if number == 1:
                end = block(draw,seed['hook'],(84,start,880,available*0.55),78,WHITE,1)
                block(draw,seed['reframe'],(84,end+45,880,footer-end-115),42,MUTED)
            elif number == 2:
                end = block(draw,seed['step'],(84,start,880,available*0.50),67,WHITE,1)
                draw.text((84,end+34),'CONTOH AYAT / SOALAN',font=ImageFont.load_default(size=27),fill=GOLD)
                block(draw,'"'+seed['question']+'"',(84,end+90,880,footer-end-160),43,MUTED)
            else:
                end = block(draw,seed['lesson'],(84,start,880,available*0.62),74,WHITE,1)
                block(draw,'Simpan untuk rujukan perbualan seterusnya.',(84,end+55,850,footer-end-120),39,MUTED)
            draw.line((84,footer-18,996,footer-18),fill='#30343B',width=2)
            draw.text((84,footer+12),'Menjelaskan, bukan Memujuk.',font=ImageFont.load_default(size=33),fill=GOLD)
            draw.text((84,footer+62),'Panduan & Alat Jualan Praktikal',font=ImageFont.load_default(size=27),fill=MUTED)
            path = output/f'{shape}-{number}.jpg'
            image.save(path,quality=93,optimize=True,subsampling=0)
            size = path.stat().st_size
            assert size < 8_000_000
            manifest.append({'file':path.name,'width':1080,'height':height,'bytes':size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    (output/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    return manifest

if __name__ == '__main__':
    package = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8-sig'))
    render(package,sys.argv[2])
