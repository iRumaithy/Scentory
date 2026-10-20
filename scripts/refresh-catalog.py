"""Build Scentory's factual catalogue from public, first-party product listings.

No community reviews, invented scores, or third-party fragrance databases.
Cache is untracked; the checked-in catalogue includes field-level provenance.
Run: python scripts/refresh-catalog.py (requires only Python's standard library).
"""
import concurrent.futures as futures
import datetime as dt
import hashlib
import html
import json
import re
import sys
import unicodedata
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.catalog-cache'
CACHE.mkdir(exist_ok=True)
TODAY = dt.datetime.now(dt.timezone.utc).date().isoformat()
SOURCES = [
    ('Parfums de Marly', 'https://parfums-de-marly.com', ['Masculine Fragrance', 'Feminine Fragrance'], 1),
    ('Amouage', 'https://amouage.com', ['EDP', 'EXTRAIT', 'ESSENCE', 'ATTAR'], 1),
    ('Xerjoff', 'https://www.xerjoff.com', ['Perfume', 'Attar & oil'], 2),
    ('Memo Paris', 'https://www.memoparis.com', ['Eau de Parfum', 'Night fragrances'], 1),
    ('BDK Parfums', 'https://bdkparfums.com', ['eau de parfum', 'Extrait de parfum', 'Extrait de Parfum'], 1),
    ("Etat Libre d’Orange", 'https://www.etatlibredorange.com', ['Fragrance'], 1),
    ('Goldfield & Banks', 'https://www.goldfieldandbanks.com', ['100ml'], 1),
    ('Roja', 'https://www.rojalondon.com', None, 1),
    ('Thameen', 'https://thameenfragrance.com', None, 1),
    ('Maison Crivelli', 'https://www.maisoncrivelli.com', None, 1),
    ('Tom Ford', 'https://www.tomfordbeauty.com', ['Fragrance'], 1),
]

class TextParser(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts = []; self.skip = 0
    def handle_starttag(self, tag, attrs):
        if tag in ('script', 'style'): self.skip += 1
        if tag in ('p', 'div', 'li', 'h2', 'h3', 'h4', 'h5', 'br'): self.parts.append('\n')
    def handle_endtag(self, tag):
        if tag in ('script', 'style'): self.skip = max(0, self.skip-1)
        if tag in ('p', 'div', 'li', 'h2', 'h3', 'h4', 'h5', 'strong'): self.parts.append('\n')
    def handle_data(self, text):
        if not self.skip: self.parts.append(text)

def text_of(s):
    p = TextParser(); p.feed(s or '')
    return '\n'.join(x.strip() for x in ''.join(p.parts).splitlines() if x.strip())

def slug(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return re.sub('[^a-z0-9]+', '-', s).strip('-')[:75]

def fetch(url):
    p = CACHE / (hashlib.sha256(url.encode()).hexdigest() + '.txt')
    if p.exists() and dt.datetime.fromtimestamp(p.stat().st_mtime, dt.timezone.utc).date().isoformat()==TODAY: return p.read_text()
    accept='application/json' if '.json?' in url else 'text/html'
    req = urllib.request.Request(url, headers={'User-Agent': 'ScentoryPersonalCatalog/2.0', 'Accept': accept})
    with urllib.request.urlopen(req, timeout=18) as res: t = res.read().decode()
    p.write_text(t)
    return t

def split_notes(s):
    s = re.sub(r'^(?:notes|notes de t[eê]te|head notes|top notes|heart notes|base notes)\s*[:：]?\s*', '', s.strip(), flags=re.I)
    return list(dict.fromkeys(x.strip(' \n\t.:;•-') for x in re.split(r',|;|\s+[&]\s+|\s+and\s+', s) if 1 < len(x.strip(' .:-')) < 65))[:15]

def extract_notes(page):
    # Brand-specific structured sections take precedence over marketing prose.
    out = {'top': [], 'middle': [], 'base': [], 'key': []}
    if page.lstrip().startswith('{'):
        try: page=json.loads(page).get('product',{}).get('body_html') or ''
        except ValueError: return out
    pdm = re.findall(r'product__olfactive-item__title[^>]*>(.*?)</p>\s*<p[^>]*>(.*?)</p>', page, re.S)
    for label, notes in pdm:
        key = 'top' if 'Top' in label else 'middle' if 'Heart' in label else 'base' if 'Base' in label else 'key'
        out[key] = split_notes(text_of(notes))
    # Amouage's ingredient accordion has unambiguous <li> headings.
    for label, notes in re.findall(r'<li>\s*<strong>(Top Notes|Heart Notes|Base Notes)</strong>\s*:?\s*(.*?)</li>', page, re.S|re.I):
        key = 'top' if 'top' in label.lower() else 'middle' if 'heart' in label.lower() else 'base'
        out[key] = split_notes(text_of(notes))
    if any(out.values()): return out
    lines = text_of(page).splitlines()
    # Xerjoff and several brands expose labelled note rows in their product page.
    labels = {'top': 'top', 'top notes': 'top', 'head notes': 'top', 'notes de tête': 'top',
              'heart': 'middle', 'heart notes': 'middle', 'middle notes': 'middle', 'notes de cœur': 'middle',
              'base': 'base', 'base notes': 'base', 'notes de fond': 'base', 'key notes': 'key', 'main notes': 'key'}
    for i, line in enumerate(lines):
        inline=re.match(r'^(?:(?:Sunrise|Summit|Sunset)\s*\()?\s*(Top|Head|Heart|Middle|Base)(?: Notes)?\)?\s*:\s*(.+)$',line,re.I)
        if inline:
            key='top' if inline[1].lower() in ('top','head') else 'middle' if inline[1].lower() in ('heart','middle') else 'base'
            out[key]=split_notes(inline[2]);continue
        label = line.strip(' :').lower()
        if label in labels and i+1 < len(lines):
            following = lines[i+1].strip(' :')
            if following.lower() not in labels and len(following) < 350 and not re.search(r'shop|price|add to|ingredients|delivery', following, re.I):
                notes = split_notes(following)
                if label.startswith('notes de '):
                    subsequent=[]
                    for value in lines[i+1:i+16]:
                        if value.lower().strip(' :') in labels or len(value)>85 or re.search(r'newsletter|ingredient|alcohol|voir|€|\$|ajouter',value,re.I):break
                        subsequent.extend(split_notes(value))
                    notes=subsequent
                if notes and (',' in following or len(following.split()) < 7): out[labels[label]] = notes
    return out

def keep_product(p, types, brand):
    name = p.get('title') or ''; handle = p.get('handle') or ''; kind = p.get('product_type') or ''
    if not p.get('images') or (types is not None and kind not in types): return False
    reject = r'sample|\bset\b|\bkit\b|\bduo\b|\btrio\b|bundle|coffret|discovery|collection\s+box|calendar|carousel|voucher|gift\s+card|candle|body|shower|soap|lotion|cream|deodorant|hair|hand\s|\b2ml\b|\b5ml\b|\b10ml\b|15ml|30ml|travel|refill|discontinued|atomiser|atomizer|tester'
    if re.search(reject, name+' '+handle+' '+kind, re.I): return False
    if re.search(r'bougie|blotter|trilogy|beard|\b1[. -]5[ -]?ml\b|\b(?:1|2|5)\s+ml\b', name+' '+handle, re.I): return False
    if brand == 'Roja' and not re.search(r'parfum|cologne|perfume', kind+' '+name, re.I): return False
    if brand == 'Thameen' and re.search(r'body|discovery|baby|hair|gift|set|sample', kind, re.I): return False
    return True

def build():
    legacy = json.loads((ROOT/'data/legacy-catalog.json').read_text())
    legacy_by_key = {(slug(p['brand']), slug(re.sub(r' EDP$| Eau de Parfum$', '', p['name']))): p for p in legacy}
    rows = []; errors = []
    for brand, origin, types, pages in SOURCES:
        seen = set()
        for page in range(1, pages+1):
            try: products = json.loads(fetch(origin+f'/products.json?limit=250&page={page}'))['products']
            except Exception as e: errors.append({'source':origin, 'error':str(e)}); continue
            for p in products:
                if not keep_product(p, types, brand): continue
                name = html.unescape(re.sub(r'\s+EDP\s+\d+ml|\s*[-–|]\s*(?:Eau de [Pp]arfum|Extrait de Parfum).*$', '', p['title'])).strip()
                key = slug(name)
                match_key=slug(re.sub(r'\s+Eau de (?:Parfum|Toilette)$','',name,flags=re.I))
                if key in seen: continue
                seen.add(key)
                prev = legacy_by_key.get((slug(brand), match_key))
                # Some legacy names differ from the current product's display name.
                for old in legacy:
                    if old['brand'] == brand and slug(old['name']) == key: prev = old
                image = p['images'][0]
                src = image['src']
                src += ('&' if '?' in src else '?') + 'width=900'
                rows.append({'id': prev['id'] if prev else slug(brand)+'-'+key,
                    'name':name, 'brand':brand, 'year': prev.get('year') if prev else None,
                    'image':src, 'imageOriginal':image['src'], 'imageWidth':image.get('width'), 'imageHeight':image.get('height'),
                    'imageStatus':'official', 'sourceUrl':origin+'/products/'+p['handle'],
                    'source':brand, 'checkedAt':TODAY, 'notes':{'top':[], 'middle':[], 'base':[], 'key':[]},
                    'concentration': 'Extrait de Parfum' if re.search('extrait|attar', p['product_type']+' '+p['title'], re.I) else 'Eau de Parfum' if re.search('edp|eau de parfum', p['product_type']+' '+p['title'], re.I) else '',
                    '_body':p.get('body_html') or '', '_tags':p.get('tags') or []})
    print('Official products:',len(rows), flush=True)
    def enrich(p):
        try:
            page = fetch(p['sourceUrl'])
            p['notes'] = extract_notes(page)
            # Xerjoff's public tags are a declared list of ingredients, not a note pyramid.
            if not any(p['notes'].values()) and p['brand']=='Xerjoff':
                omit = r'icons|oud stars|vibe|casamorati|join|club|collection|^1861$|^17/17$|^shooting|^online|^new|^limited|^gift|^exclusive'
                p['notes']['key']=[n for n in p['_tags'] if not re.search(omit,n,re.I) and len(n)<50][:18]
            # Extract clearly labelled perfumer metadata only.
            txt=text_of(page)
            m=re.search(r'(?:Perfumer|Parfumeur|Nose)\s*[:\n]\s*([A-ZÀ-Ž][A-Za-zÀ-ž .’\'-]{4,65})(?:\n|$)',txt)
            if m: p['perfumer']=m.group(1).strip()
            p['notesStatus']='official' if any(p['notes'].values()) else 'unavailable'
        except Exception as e:
            p['notesStatus']='unavailable'; p['fetchError']=str(e)
        p.pop('_body',None); p.pop('_tags',None)
        return p
    with futures.ThreadPoolExecutor(max_workers=7) as pool:
        for i,p in enumerate(pool.map(enrich,rows)):
            if i%30==0: print('Notes checked:',i+1,flush=True)
    # Preserve all existing IDs and personal-library compatibility. Clearly label legacy fields.
    official_keys={(slug(p['brand']),slug(p['name'])) for p in rows}
    ids={p['id'] for p in rows}
    for old in legacy:
        if old['id'] in ids: continue
        # Match older names to current source records before creating another entry.
        oldkey=slug(old['name'])
        match=next((p for p in rows if p['brand']==old['brand'] and (slug(p['name'])==oldkey or slug(p['name']).replace('-edp-100ml','')==oldkey)),None)
        if match:
            ids.discard(match['id']);match['id']=old['id'];ids.add(old['id']);continue
        rows.append({'id':old['id'],'name':old['name'],'brand':old['brand'],'year':old.get('year'),
                     'image':old.get('image') if 'placeholder' not in old.get('image','') else '',
                     'imageStatus':'legacy' if 'placeholder' not in old.get('image','') else 'unavailable',
                     'sourceUrl':old.get('sourceUrl',''),'source':old.get('source',''),
                     'checkedAt':None,'notes':{'top':[], 'middle':[], 'base':[], 'key':list(dict.fromkeys(sum(old.get('notes',{}).values(),[])))},
                     'notesStatus':'legacy','concentration':''})
    # Keep the index deterministic and small. The UI never fabricates missing facts.
    rows.sort(key=lambda p:(p['brand'].lower(),p['name'].lower()))
    overrides=ROOT/'data/media-overrides.json'
    if overrides.exists():
        for p in rows:
            media=json.loads(overrides.read_text()).get(p['id'])
            if media: p.update(media)
    data={'version':'2.0.0','updatedAt':TODAY,'sourcePolicy':'first-party-product-facts',
          'stats':{'fragrances':len(rows),'brands':len({p['brand'] for p in rows}),
                   'officialImages':sum(p['imageStatus']=='official' for p in rows),
                   'officialNotes':sum(p['notesStatus']=='official' for p in rows)},'items':rows,'sourceErrors':errors}
    (ROOT/'public/catalog.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
    print(json.dumps(data['stats']),flush=True)

if __name__=='__main__': build()
