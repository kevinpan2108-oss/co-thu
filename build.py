#!/usr/bin/env python3
"""Ghép src/ thành dist/game.html (bản phát hành) và dist/game_local.html (bản có hook kiểm thử).
Chạy: python3 build.py"""
import os
D=os.path.dirname(os.path.abspath(__file__)); S=os.path.join(D,'src'); O=os.path.join(D,'dist')
os.makedirs(O,exist_ok=True)
rd=lambda f:open(os.path.join(S,f),encoding='utf8').read()
h=rd('head.html'); body=rd('icons.svg.html')+rd('body.html')
js=rd('engine.js')+'\n'
for f in ['ui_a.js','ui_b.js','ui_c.js','ui_d.js','online.js']: js+=rd(f)+'\n'
out=h+'\n'+body+'\n<script>\n(function(){\n\'use strict\';\n'+js+'\n})();\n</script>\n'
open(os.path.join(O,'game.html'),'w',encoding='utf8').write(out)
skel='<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box}body{margin:0;padding:0;font:14px -apple-system,sans-serif;background:#fff;color:#000}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>'
# bản kiểm thử: thêm window.__E để test truy cập biến bên trong IIFE (không có trong game.html)
out_t=out.replace('\n})();\n</script>','\nwindow.__E=function(c){return eval(c);};\n})();\n</script>')
open(os.path.join(O,'game_local.html'),'w',encoding='utf8').write(skel+out_t+'</body></html>')
print('ok')
