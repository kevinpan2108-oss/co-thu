import json,sys,glob
D=sys.argv[1]
for v in sys.argv[2:]:
    r=json.load(open(f'{D}_{v}.json'))
    print(v,{k:r[k] for k in ['games','avgPlies','topWin','botWin','draw','den','avgDepthReached','slipPerGame','slipPctOfMoves','slipFromThreat','slipEscapePct','slipExposed','slipCreatesThreatPct','bushOccupancyPctOfPlies','enterBushPerGame','gamesWithSlip']})
    if v.endswith('_slip'):
        for t,x in sorted(r['perType'].items(),key=lambda a:-a[1]['slips']):
            f=lambda a,b:f"{100*a/b:.0f}%" if b else '-'
            print('   ',t.ljust(6),'slip',x['slips'],'| tu nguy',x['fromThreat'],'thoat tuc thi',x['escImm'],'thoat that(song sau doi thu di)',x['escOk'],'| lo ra ngay',x['exposedImm'],'| tao de doa',f(x['createsThreat'],x['slips']),'| song sau 1 luot',f(x['alive1'],x['n1']),'bi de doa lai',f(x['reThreat'],x['alive1']),'| song sau 2 luot',f(x['alive3'],x['n3']))
