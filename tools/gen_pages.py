#!/usr/bin/env python3
"""Emit src/pages/*.astro from src/data/pages.json — one page per reference route, wiring the
fragment, the page stylesheet(s), inline styles and the ported script."""
import json, os
pages=json.load(open('src/data/pages.json'))
CSS={'index':['index'],'about':['about'],'commercial':['gallery'],'engagements':['gallery'],'weddings':['gallery'],
     'editorials':['editorials'],'editorials_exchange':['exchange'],'stories':['stories'],'pricing':['pricing'],
     'weddings_abigail-mate':['story'],'weddings_reanna-hawkeye':['story'],'weddings_shawni-ben':['story']}
JS={'index':['../scripts/pages/index'],'about':['../scripts/pages/about'],'commercial':['../scripts/pages/commercial'],
    'engagements':['../scripts/pages/gallery'],'weddings':['../scripts/pages/gallery'],'editorials':['../scripts/pages/editorials'],
    'editorials_exchange':['../scripts/pages/exchange'],'stories':['../scripts/pages/stories'],
    'pricing':['../scripts/vendor/pricing-calculator.js','../scripts/pages/pricing'],'contact':['../scripts/pages/contact'],
    'weddings_abigail-mate':['../scripts/pages/story'],'weddings_reanna-hawkeye':['../scripts/pages/story'],'weddings_shawni-ben':['../scripts/pages/story']}
SVC=['commercial-photographer-dc','documentary-wedding-photographer-dc','editorial-photographer-dc','engagement-photographer-dc',
     'film-wedding-photographer-dc','film-wedding-photographer-nyc','maryland-virginia-wedding-photographer','moody-wedding-photographer-dc']
for s in SVC: CSS[s]=['svc']; JS[s]=['../scripts/pages/svc']
for p in pages:
    slug=p['slug']
    path=p['path']
    file='src/pages/'+('index' if path=='/' else path.strip('/'))+'.astro'
    depth=path.strip('/').count('/')
    up='../'*(depth+1)
    os.makedirs(os.path.dirname(file),exist_ok=True)
    css=''.join(f"import '{up}styles/pages/{c}.css';\n" for c in CSS.get(slug,[]))
    js=''.join(f"    import '{up}{j.replace('../','')}';\n" for j in JS.get(slug,[]))
    inline=''.join(f"<style is:global>{s}</style>\n" for s in p['inlineStyles'])
    props=[f'title={{p.title}}',f'description={{p.description}}',f'path="{path}"']
    if p['robots']: props.append(f'robots="{p["robots"]}"')
    props.append(f'cursor="{p["cursor"] or "menu"}"')
    props.append(f'navTheme="{p["navTheme"]}"')
    if not p['hasNav']: props.append('hasNav={false}')
    if not p['menu']: props.append('menu={false}')
    if p['back']: props.append(f'back={{{{ href: "{p["back"]["href"]}", label: "{p["back"]["label"]}" }}}}')
    if p['ctaPhone']: props.append('ctaPhone')
    if p['dockActive']: props.append(f'dockActive="{p["dockActive"]}"')
    if p['ogImage'] and p['ogImage']!='https://ffdev.studio/og-image.jpg': props.append(f'ogImage="{p["ogImage"]}"')
    src=f"""---
import Base from '{up}layouts/Base.astro';
import body from '{up}fragments/{slug}.html?raw';
{css}import pages from '{up}data/pages.json';
const p = pages.find((x) => x.slug === '{slug}')!;
---
<Base {' '.join(props)}>
  {inline.strip()}
  <Fragment set:html={{body}} />
{('  <script>\n'+js+'  </script>\n') if js else ''}</Base>
"""
    open(file,'w').write(src)
    print(file)
