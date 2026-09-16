#!/usr/bin/env python3
"""Split each captured reference page into head / header / page content / tail so the shared shell
can be diffed across pages and the per-page content extracted."""
import re, os, glob, json, hashlib
RAW='docs/reference/2026-09-16/raw'; OUT='docs/reference/2026-09-16/split'
os.makedirs(OUT, exist_ok=True)
summary=[]
for f in sorted(glob.glob(RAW+'/*.html')):
    h=open(f).read()
    slug=os.path.basename(f).replace('ethanwong.photography_','').replace('.html','') or 'index'
    if slug=='': slug='index'
    head=h[h.index('<head>')+6:h.index('</head>')]
    bodytag=re.search(r'<body[^>]*>',h).group(0)
    body=h[h.index(bodytag)+len(bodytag):h.rindex('</body>')]
    # header
    m=re.search(r'<header class="site[^"]*"[^>]*>.*?</header>',body,re.S)
    header=m.group(0) if m else ''
    # page-shell contents after header until the closing of page-shell: find the '<div class="page-shell">' start
    ps=body.index('<div class="page-shell">')
    after_header=body[m.end():] if m else body[ps:]
    # tail starts at menu overlay or dock scrim
    tm=re.search(r'<div class="mo" id="menu-overlay"|<div class="cursor|<div class="dock-scrim"',after_header)
    content=after_header[:tm.start()] if tm else after_header
    tail=after_header[tm.start():] if tm else ''
    # scripts in head
    links=re.findall(r'<link rel="stylesheet" href="([^"]+)"',head)
    styles=re.findall(r'<style>(.*?)</style>',head,re.S)
    title=re.search(r'<title>(.*?)</title>',head).group(1)
    desc=re.search(r'<meta name="description" content="([^"]*)"',head)
    canon=re.search(r'<link rel="canonical" href="([^"]*)"',head)
    robots=re.search(r'<meta name="robots" content="([^"]*)"',head)
    d=dict(slug=slug,title=title,desc=desc.group(1) if desc else '',canonical=canon.group(1) if canon else '',robots=robots.group(1) if robots else '',
           bodytag=bodytag,links=links,style_len=[len(s) for s in styles],header_hash=hashlib.md5(header.encode()).hexdigest()[:8],tail_hash=hashlib.md5(tail.encode()).hexdigest()[:8],
           content_len=len(content), tail_len=len(tail))
    summary.append(d)
    base=OUT+'/'+slug
    open(base+'.head.html','w').write(head)
    open(base+'.header.html','w').write(header)
    open(base+'.content.html','w').write(content.strip())
    open(base+'.tail.html','w').write(tail)
    for i,s in enumerate(styles): open(f'{base}.style{i}.css','w').write(s)
json.dump(summary,open(OUT+'/summary.json','w'),indent=1)
for d in summary: print(f"{d['slug']:45s} {d['bodytag']:28s} hdr={d['header_hash']} tail={d['tail_hash']} content={d['content_len']:7d} tail={d['tail_len']:6d} links={[l.split('/')[-1] for l in d['links']]} styles={d['style_len']}")
