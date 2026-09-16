#!/usr/bin/env python3
"""Pull every imagedelivery.net variant the reference references (width <= MAXW) into public/img.
URL: https://imagedelivery.net/<acct>/<folder>/<name>/w=<W>,q=<Q>,f=auto,fit=scale-down
Local: public/img/<folder>/<name>-w<W>.<ext>   (ext sniffed from bytes)
Writes docs/reference/2026-09-16/images-manifest.tsv"""
import sys, os, re, urllib.request, concurrent.futures, time
MAXW = int(sys.argv[2]) if len(sys.argv) > 2 else 2560
src = sys.argv[1]
urls = [l.strip() for l in open(src) if l.strip()]
pat = re.compile(r'https://imagedelivery\.net/[^/]+/(.+)/w=(\d+)(?:,q=(\d+))?[^ ]*$')
jobs = {}
for u in urls:
    m = pat.match(u)
    if not m: print('skip', u); continue
    path, w, q = m.group(1), int(m.group(2)), int(m.group(3) or 85)
    if w > MAXW: continue
    key = (path, w)
    if key not in jobs or q > jobs[key][1]: jobs[key] = (u, q)
print(len(jobs), 'files to fetch')
UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36'
def sniff(b):
    if b[:4]==b'RIFF' and b[8:12]==b'WEBP': return 'webp'
    if b[:3]==b'\xff\xd8\xff': return 'jpg'
    if b[:8]==b'\x89PNG\r\n\x1a\n': return 'png'
    if b[4:12] in (b'ftypavif',b'ftypavis'): return 'avif'
    if b[:6] in (b'GIF87a',b'GIF89a'): return 'gif'
    return 'bin'
def fetch(item):
    (path, w), (u, q) = item
    base = f'public/img/{path}-w{w}'
    for ext in ('webp','jpg','png','avif','gif'):
        if os.path.exists(base+'.'+ext) and os.path.getsize(base+'.'+ext)>0:
            return (u, 200, os.path.getsize(base+'.'+ext), base+'.'+ext, 'cached')
    os.makedirs(os.path.dirname(base), exist_ok=True)
    for attempt in range(3):
        try:
            req = urllib.request.Request(u, headers={'User-Agent':UA,'Accept':'image/webp,image/*,*/*;q=0.8','Referer':'https://ethanwong.photography/'})
            with urllib.request.urlopen(req, timeout=60) as r:
                b = r.read(); ct = r.headers.get('Content-Type','')
            ext = sniff(b)
            fn = base+'.'+ext
            open(fn,'wb').write(b)
            return (u, 200, len(b), fn, ct)
        except Exception as e:
            err = str(e); time.sleep(2*(attempt+1))
    return (u, 0, 0, '', err)
out = open('docs/reference/2026-09-16/images-manifest.tsv','a')
done = 0
with concurrent.futures.ThreadPoolExecutor(12) as ex:
    for res in ex.map(fetch, sorted(jobs.items())):
        out.write('\t'.join(map(str,res))+'\n'); out.flush()
        done += 1
        if done % 100 == 0: print(done, flush=True)
print('done')
