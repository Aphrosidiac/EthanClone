#!/usr/bin/env python3
"""Turn the captured reference pages into build fragments.

For every page in docs/reference/2026-09-16/split/*.content.html:
  * imagedelivery.net URLs -> /img/<folder>/<name>-w<W>.webp   (3840w srcset candidates dropped)
  * reference identity -> FF Dev Studio (see BRAND below; image file names are left alone)
  * written to src/fragments/<slug>.html
Also writes src/data/pages.json with the per-page head data (title, description, canonical
path, robots, body data-cursor, header variant, dock active tab, stylesheets, inline styles).
"""
import re, os, glob, json, html
SPLIT='docs/reference/2026-09-16/split'; FRAG='src/fragments'
os.makedirs(FRAG, exist_ok=True)

IMG=re.compile(r'https://imagedelivery\.net/[^/]+/([A-Za-z0-9_./-]+)/w=(\d+)[^ "\'&,)]*(?:,[a-z]+=[a-z0-9-]+)*')
def img_local(m):
    return f'/img/{m.group(1)}-w{m.group(2)}.webp'
def rewrite_srcset(m):
    # drop candidates wider than 2560 (we did not mirror the 3840 tier)
    parts=[p.strip() for p in m.group(2).split(',') if p.strip()]
    keep=[]
    for p in parts:
        bits=p.split()
        if len(bits)==2 and bits[1].endswith('w') and int(bits[1][:-1])>2560: continue
        keep.append(p)
    return m.group(1)+', '.join(keep)+'"'
def _drop_wide(candidates, sep=', '):
    keep=[]
    for c in [x.strip() for x in candidates.split(',') if x.strip()]:
        bits=c.split()
        if len(bits)==2 and bits[1].endswith('w') and int(bits[1][:-1])>2560: continue
        keep.append(c)
    return sep.join(keep)
def rewrite_images(s):
    # 1. CDN URL -> local file (this also removes the commas inside the CDN parameters)
    s=IMG.sub(img_local, s)
    # 2. drop srcset candidates wider than we mirrored (3840w)
    s=re.sub(r'((?:srcset|data-srcset)=")([^"]*)"', lambda m: m.group(1)+_drop_wide(m.group(2))+'"', s)
    s=re.sub(r'("ss":")([^"]*)"', lambda m: m.group(1)+_drop_wide(m.group(2))+'"', s)
    s=re.sub(r'(&#34;ss&#34;:&#34;)(.*?)(&#34;)', lambda m: m.group(1)+_drop_wide(m.group(2))+m.group(3), s)
    return s

BRAND=[
 ('Ethan W Photography','FF Dev Studio'),
 ('Ethan Wong Photography','FF Dev Studio'),
 ('Ethan Wong','FF'),
 ('Ethan W','FF Dev'),
 ("Ethan's","FF's"),
 ('Ethan','FF'),
 ('mailto:ethan@ethanwong.photography','mailto:hello@ffdev.studio'),
 ('ethan@ethanwong.photography','hello@ffdev.studio'),
 ('https://app.ethanwong.photography','https://app.ffdev.studio'),
 ('https://galleries.ethanwong.photography','https://galleries.ffdev.studio'),
 ('https://www.instagram.com/ethanwong.photography/','https://www.instagram.com/ffdev.studio/'),
 ('https://instagram.com/ethanwong.photography','https://instagram.com/ffdev.studio'),
 ('ethanwong.photography','ffdev.studio'),
]
def brand(s):
    for a,b in BRAND: s=s.replace(a,b)
    return s

def main():
  pages=[]
  for f in sorted(glob.glob(SPLIT+'/*.content.html')):
      slug=os.path.basename(f)[:-len('.content.html')]
      content=open(f).read()
      head=open(f'{SPLIT}/{slug}.head.html').read()
      header=open(f'{SPLIT}/{slug}.header.html').read()
      tail=open(f'{SPLIT}/{slug}.tail.html').read()
      body=rewrite_images(brand(content))
      # module scripts are ported to src/scripts; the reference's inline ones are captured in pages.json
      body=re.sub(r'\s*<script type="module"(?: src="[^"]*")?>.*?</script>','',body,flags=re.S)
      body=re.sub(r'\s*<script>.*?</script>','',body,flags=re.S)
      # pages without the menu overlay carry the page-shell's closing </div> inside the content slice
      if len(re.findall(r'<div\b',body))<len(re.findall(r'</div>',body)):
        body=body.rstrip(); assert body.endswith('</div>'); body=body[:-6].rstrip()
      assert 'imagedelivery' not in body, slug
      open(f'{FRAG}/{slug}.html','w').write(body)
      title=html.unescape(re.search(r'<title>(.*?)</title>',head).group(1))
      desc=html.unescape((re.search(r'<meta name="description" content="([^"]*)"',head) or [None,''])[1])
      canon=(re.search(r'<link rel="canonical" href="https://ethanwong.photography([^"]*)"',head) or [None,'/'])[1] or '/'
      robots=(re.search(r'<meta name="robots" content="([^"]*)"',head) or [None,''])[1]
      ogimg=(re.search(r'<meta property="og:image" content="([^"]*)"',head) or [None,''])[1]
      bodytag=re.search(r'<body[^>]*>',open(f'docs/reference/2026-09-16/raw/ethanwong.photography_{"" if slug=="index" else slug}.html').read()).group(0)
      cursor=(re.search(r'data-cursor="([^"]*)"',bodytag) or [None,''])[1]
      styles=[open(x).read() for x in sorted(glob.glob(f'{SPLIT}/{slug}.style*.css'))]
      links=[l.split('/')[-1] for l in re.findall(r'<link rel="stylesheet" href="(/_astro/[^"]+)"',head)]
      scripts=[l.split('/')[-1] for l in re.findall(r'<script type="module" src="(/_astro/[^"]+)"',head+content+tail)]
      inline=[m.strip()[:60] for m in re.findall(r'<script type="module">(.*?)</script>',content,re.S)]
      navtheme='dark' if 'nav-on-dark' in header else 'light'
      hasnav='data-nav' in header
      menu='menu-btn' in header
      back=re.search(r'<a href="([^"]+)" class="lab h-link">([^<]+)</a>',header)
      ctaphone='nav-cta--phone' in header
      dock=(re.search(r'data-active="([^"]*)"',tail) or [None,''])[1]
      pages.append(dict(slug=slug,path=canon,title=brand(title),description=brand(desc),robots=robots,ogImage=rewrite_images(brand(ogimg)),cursor=cursor,
          navTheme=navtheme,hasNav=hasnav,menu=menu,back=({'href':back.group(1),'label':html.unescape(back.group(2))} if back else None),ctaPhone=ctaphone,dockActive=dock,
          pageCss=[l for l in links if not l.startswith('about.BHBFHBM9')],inlineStyles=[rewrite_images(brand(s)) for s in styles],scripts=scripts,inlineScripts=inline))
  json.dump(pages,open('src/data/pages.json','w'),indent=1)
  for p in pages: print(p['slug'],p['path'],p['navTheme'],p['menu'],p['back'],p['dockActive'],p['pageCss'],p['scripts'],len(p['inlineStyles']))

def menu():
  """The menu overlay is identical on every page that has one; take it from /about."""
  t=open(f'{SPLIT}/about.tail.html').read()
  m=t[:t.index('<div class="dock-scrim"')]
  m=rewrite_images(brand(m)).rstrip()
  assert m.endswith('</div>'); m=m[:-6].rstrip()   # the page-shell's closing tag rides along
  assert len(re.findall(r'<div\b',m))==len(re.findall(r'</div>',m))
  open(f'{FRAG}/_menu.html','w').write(m)

if __name__=="__main__": main(); menu()
