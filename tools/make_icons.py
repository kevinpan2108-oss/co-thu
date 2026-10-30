#!/usr/bin/env python3
"""Sinh sprite icon thu (don sac, vien mau currentColor) -> src/icons.svg.html.
Moi icon: F = hinh dac (to bang currentColor), C = hinh khoet (mat/mui/van) lam lo nen.
Chay: python3 tools/make_icons.py  (build.py doc src/icons.svg.html)"""
import sys
def el(kind,a,cut=False):
    return '<%s %s/>'%(kind,a)
def circ(x,y,r): return ('circle','cx="%s" cy="%s" r="%s"'%(x,y,r))
def ell(x,y,rx,ry,rot=0): return ('ellipse','cx="%s" cy="%s" rx="%s" ry="%s"%s'%(x,y,rx,ry,' transform="rotate(%s %s %s)"'%(rot,x,y) if rot else ''))
def pth(d): return ('path','d="%s"'%d)
def stroke(d,w=1.6): return ('path','d="%s" fill="none" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round"'%(d,w))
ICONS={}
def icon(key,F,C,G=()): ICONS[key]=(F,C,G)
# --- Chuot
icon('rat',[circ(12,15,8.5),circ(36,15,8.5),ell(24,29,13.5,12.5),pth('M17 36 L24 46 L31 36Z')],
 [circ(12,15,4.2),circ(36,15,4.2),circ(19,27,1.9),circ(29,27,1.9),circ(24,41.5,2.2),stroke('M4 33 L15 35 M4 40 L15 38 M44 33 L33 35 M44 40 L33 38',1.3)])
# --- Meo
icon('cat',[ell(24,29,16,13.5),pth('M7 5 L21 16 L8 26Z'),pth('M41 5 L27 16 L40 26Z')],
 [ell(18,27,2.1,3.2),ell(30,27,2.1,3.2),pth('M21.5 33 L26.5 33 L24 36Z'),stroke('M24 36 L24 38.5 M24 38.5 Q21 41 18.5 39 M24 38.5 Q27 41 29.5 39',1.3),stroke('M2 28 L12 31 M2 34 L12 34 M46 28 L36 31 M46 34 L36 34',1.2),pth('M10 10 L16 15 L10.5 20Z'),pth('M38 10 L32 15 L37.5 20Z')])
# --- Cao
icon('fox',[pth('M3 4 L20 15 L28 15 L45 4 L43 29 L24 46 L5 29Z')],
 [ell(15.5,26,2.4,1.7,25),ell(32.5,26,2.4,1.7,-25),circ(24,43,2.4),pth('M24 20 L18 26 L24 31 L30 26Z'),stroke('M11 31 L19 34 M37 31 L29 34',1.3),pth('M8 9 L15 15 L9 22Z'),pth('M40 9 L33 15 L39 22Z')])
# --- Soi
icon('wolf',[pth('M4 3 L19 14 L29 14 L44 3 L46 20 L40 24 L44 31 L36 33 L36 41 L24 47 L12 41 L12 33 L4 31 L8 24 L2 20Z')],
 [pth('M12 21 L19 24 L12 27Z'),pth('M36 21 L29 24 L36 27Z'),pth('M20.5 38 L27.5 38 L24 43Z'),stroke('M24 28 L24 38',1.3),pth('M8 8 L14 14 L8.5 19Z'),pth('M40 8 L34 14 L39.5 19Z')])
# --- Lon rung
icon('boar',[ell(24,25,18,15),pth('M4 31 Q-1 40 8 43 Q4 37 9 33Z'),pth('M44 31 Q49 40 40 43 Q44 37 39 33Z'),pth('M8 12 L18 15 L10 22Z'),pth('M40 12 L30 15 L38 22Z')],
 [circ(15.5,22,1.9),circ(32.5,22,1.9),ell(24,34,9,6.3),circ(20.5,34,1.6),circ(27.5,34,1.6),stroke('M12 15 Q18 14 21 17 M36 15 Q30 14 27 17',1.4)])
# --- Cho
icon('dog',[ell(24,27,13,15),ell(8,27,6.5,13,12),ell(40,27,6.5,13,-12),ell(24,37,8.5,6.5)],
 [circ(18.5,22,2.1),circ(29.5,22,2.1),ell(24,34,3.8,2.8),stroke('M24 37 L24 41 M24 41 Q20 44 17.5 41.5 M24 41 Q28 44 30.5 41.5',1.3),stroke('M14 16 Q18 14 21 16 M34 16 Q30 14 27 16',1.2)])
# --- Gau
icon('bear',[circ(10.5,12,6.5),circ(37.5,12,6.5),circ(24,27,17),ell(24,35,8,6)],
 [circ(10.5,12,2.8),circ(37.5,12,2.8),circ(17,23,2.1),circ(31,23,2.1),ell(24,32.5,3.6,2.5),stroke('M24 35 L24 38.5 M24 38.5 Q21 41 18.5 39 M24 38.5 Q27 41 29.5 39',1.3)])
# --- Bao
icon('leo',[ell(24,28,16,14),circ(9,12,5.5),circ(39,12,5.5)],
 [circ(9,12,2.2),circ(39,12,2.2),ell(17.5,25,2.2,2.8),ell(30.5,25,2.2,2.8),pth('M21.5 31 L26.5 31 L24 34Z'),stroke('M24 34 L24 37 M24 37 Q21 39.5 18.5 37.5 M24 37 Q27 39.5 29.5 37.5',1.2),
  circ(11,28,1.5),circ(14,33,1.5),circ(37,28,1.5),circ(34,33,1.5),circ(18,15.5,1.4),circ(24,13.5,1.4),circ(30,15.5,1.4),circ(10,22,1.3),circ(38,22,1.3)])
# --- Ca sau (nhin tren xuong)
icon('croc',[ell(24,10,5.2,10),ell(24,24,10,7),ell(24,35,8.5,9),pth('M17 40 Q24 43 31 40 L26 47 L22 47Z'),ell(10,22,3.6,6.5,35),ell(38,22,3.6,6.5,-35),ell(10,38,3.6,6.5,-35),ell(38,38,3.6,6.5,35),circ(18,20,3.4),circ(30,20,3.4)],
 [circ(18,20,1.3),circ(30,20,1.3),circ(22,3.5,.9),circ(26,3.5,.9),stroke('M24 28 L24 44',1.1),stroke('M17 33 L31 33 M16 38 L32 38',1.1)])
# --- Ho
icon('tig',[ell(24,28,17.5,14.5),circ(9,11,5.5),circ(39,11,5.5)],
 [circ(9,11,2.2),circ(39,11,2.2),ell(17,25,2.2,2.6),ell(31,25,2.2,2.6),pth('M21 31 L27 31 L24 34.5Z'),stroke('M24 34.5 L24 38 M24 38 Q21 40.5 18.5 38.5 M24 38 Q27 40.5 29.5 38.5',1.2),
  stroke('M24 14 L24 20 M19 15 L20.5 20 M29 15 L27.5 20',1.8),stroke('M7 25 L13 27 M7 31 L13 31 M41 25 L35 27 M41 31 L35 31',1.8)])
# --- Dai bang
icon('eagle',[circ(22,21,14),pth('M32 19 Q46 20 44 33 Q40 28 34 29Z'),pth('M10 30 L16 42 L22 32 L28 43 L34 31 L36 44 L8 44Z')],
 [circ(24.5,18,2.6),stroke('M18 13 Q25 11 31 15',1.7),circ(40,24,1.2),stroke('M13 36 L16 41 M21 37 L24 43 M29 36 L31 42',1.2)])
# --- Su tu
mane=[circ(24+19*__import__('math').cos(i*0.5236),24+19*__import__('math').sin(i*0.5236),6) for i in range(12)]
icon('lio',[circ(24,24,20)]+mane,
 [circ(24,26,12.5)],
 [circ(18.5,23,1.9),circ(29.5,23,1.9),pth('M21.5 28.5 L26.5 28.5 L24 31.5Z'),stroke('M24 31.5 L24 34.5 M24 34.5 Q21 37.5 18.5 35 M24 34.5 Q27 37.5 29.5 35',1.3),stroke('M14.5 19 Q18 17.5 21 19.5 M33.5 19 Q30 17.5 27 19.5',1.2)])
# --- Bo rung
icon('bison',[ell(24,28,16.5,14.5),stroke('M9 18 Q0 14 4 3',4.2),stroke('M39 18 Q48 14 44 3',4.2),ell(24,39,8.5,5.8)],
 [circ(16.5,26,2),circ(31.5,26,2),circ(20.5,39,1.6),circ(27.5,39,1.6),stroke('M12 15 L16 20 L20 14 L24 20 L28 14 L32 20 L36 15',1.5)])
# --- Voi
icon('ele',[circ(24,22,12),circ(8.5,24,9),circ(39.5,24,9),stroke('M24 28 L24 38 Q24 46 31 44',7),stroke('M17.5 34 Q13 40 14.5 45 M30.5 34 Q35 40 33.5 45',2.6)],
 [circ(8.5,24,4),circ(39.5,24,4),circ(19,19,1.9),circ(29,19,1.9),stroke('M24 30 L24 37 M24 33 L24 34',0.01)])
# --- Khi
icon('mon',[circ(10,24,5.5),circ(38,24,5.5),circ(24,22,14),pth('M12 32 Q24 50 36 32Z')],
 [circ(10,24,2.4),circ(38,24,2.4),stroke('M14 21 Q16 17 20 19 Q24 21 28 19 Q32 17 34 21 Q36 30 30 34 Q24 37 18 34 Q12 30 14 21Z',1.4),circ(19.5,24,1.8),circ(28.5,24,1.8),circ(22.5,29,.9),circ(25.5,29,.9),stroke('M20 32 Q24 35 28 32',1.3)])
# --- Rua (nhin tren xuong)
icon('tur',[circ(24,27,13.5),circ(24,9.5,5.5),ell(9,17,4.2,6.5,-40),ell(39,17,4.2,6.5,40),ell(10,38,4.2,6.5,40),ell(38,38,4.2,6.5,-40),pth('M21 39 L24 46 L27 39Z')],
 [circ(22,8.5,1.2),circ(26,8.5,1.2),pth('M24 17 L31 21.5 L31 30.5 L24 35 L17 30.5 L17 21.5Z'),stroke('M24 17 L24 12 M31 21.5 L36 19 M31 30.5 L36 33 M24 35 L24 40 M17 30.5 L12 33 M17 21.5 L12 19',1.1)],
 [pth('M24 20 L28.5 22.8 L28.5 28.8 L24 31.6 L19.5 28.8 L19.5 22.8Z')])
def render(key):
    F,C,G=ICONS[key]
    g=''.join('<%s %s/>'%(k,a) for k,a in G)
    f=''.join('<%s %s/>'%(k,a) for k,a in F)
    cuts=''
    for k,a in C:
        if 'stroke-width' in a: cuts+='<%s %s stroke="#000"/>'%(k,a)
        else: cuts+='<%s %s fill="#000"/>'%(k,a)
    # trong ico dung 2 lop: nen to + khoet van tay bang mask
    return ('<symbol id="ic-%s" viewBox="0 0 48 48"><mask id="mk-%s" maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48"><rect width="48" height="48" fill="#fff"/>%s</mask>'
            '<g fill="currentColor" stroke="currentColor" mask="url(#mk-%s)">%s</g><g fill="currentColor" stroke="currentColor">%s</g></symbol>')%(key,key,cuts,key,f,g)
if __name__=='__main__':
    sprite='<svg class="defs" width="0" height="0" aria-hidden="true" style="position:absolute">'+''.join(render(k) for k in ICONS)+'</svg>\n'
    open('src/icons.svg.html','w').write(sprite)
    sheet='<meta charset=utf-8><style>body{margin:0;background:#f5f0e6;display:flex;flex-wrap:wrap;gap:14px;padding:16px;font:12px sans-serif}div{text-align:center}i{display:grid;place-items:center;width:110px;height:110px;border-radius:50%;margin-bottom:4px}svg{width:76px;height:76px;color:#fff}</style>'+sprite
    for n,k in enumerate(ICONS):
        sheet+='<div><i style="background:%s"><svg><use href="#ic-%s"/></svg></i>%s</div>'%('#c8402f' if n%2==0 else '#3d4d82',k,k)
    open('/tmp/claude-0/-home-claude/f87ce562-7b16-5182-b0f9-97ac72b036d5/scratchpad/icon_sheet.html','w').write(sheet)
    print('icons',len(ICONS))
