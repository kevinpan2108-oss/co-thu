import json,sys
G={'Voi':['ele'],'Cao':['fox'],'Meo':['cat'],'Khi':['mon'],'Quan thap (Chuot,Soi,Lon,Cho,Gau)':['rat','wolf','boar','dog','bear'],'Con lai (Bao,Ca sau,Ho,Dai bang,Su tu,Bo rung,Rua)':['leo','croc','tig','eagle','lio','bison','tur']}
for f in sys.argv[1:]:
    r=json.load(open(f));print('\n##',f,'games',r['games'],'slip/van',r['slipPerGame'],'ply',r['avgPlies'],'top/bot/hoa',r['topWin'],r['botWin'],r['draw'])
    tot={k:0 for k in ['slips','escape','escapeFail','attack','reposition','harm','diedBy3','n1','alive1','n3','alive3','reThreat']}
    for g,ks in G.items():
        a={k:0 for k in tot}
        for k in ks:
            x=r['perType'].get(k)
            if x:
                for q in a:a[q]+=x[q]
        for q in a:tot[q]+=a[q]
        s=a['slips'] or 1
        pc=lambda v:f"{100*v/s:.0f}%"
        print(f"{g[:34]:34} lach {a['slips']:4} | thoat nguy {a['escape']:3} ({pc(a['escape'])}) thoat hut {a['escapeFail']:3} ({pc(a['escapeFail'])}) | doi cho tan cong {a['attack']:3} ({pc(a['attack'])}) doi cho thuan {a['reposition']:3} ({pc(a['reposition'])}) | bat loi {a['harm']:3} ({pc(a['harm'])}) | chet trong 2 luot {a['n3']-a['alive3']}/{a['n3']}")
    s=tot['slips'];print('TONG lach',s,{k:f"{100*tot[k]/s:.0f}%" for k in ['escape','escapeFail','attack','reposition','harm']},'song 2 luot',f"{100*tot['alive3']/max(1,tot['n3']):.0f}%")
