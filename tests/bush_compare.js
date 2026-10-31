// Mo phong AI doi xung (cung engine, cung doi hinh hai phe) de do tac dung cua bui/lau say.
// node bush_compare.js <engine.js> <slip|noslip> <so van> <seed> [depth=3] [cap=160]
const fs=require('fs');
const [EP,MODE,G,SEED,DEP,CAP]=[process.argv[2],process.argv[3],+process.argv[4],+process.argv[5],+(process.argv[6]||3),+(process.argv[7]||160)];
let code=fs.readFileSync(EP,'utf8'); if(MODE==='noslip') code=code.replace("if(!CLASSIC&&!lock&&BUSH[i]){","if(false&&BUSH[i]){");
const E=new Function(code+';return makeEngine();')();
E.setAI(4);const LV=3;E.LEVELS[LV].ms=1e9;E.LEVELS[LV].depth=DEP; // search(cells,side,LV,...) doc L.depth => DEP that su dung
if(E.LEVELS[LV].depth!==DEP)throw new Error('depth not applied');
let rs=SEED|1;Math.random=()=>{rs^=rs<<13;rs>>>=0;rs^=rs>>>17;rs^=rs<<5;rs>>>=0;return rs/4294967296;};
let seed=SEED;const R=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const Z=[0,0,0,0,0,0,0,0,0,0], BUSH=E.BUSH, N=E.N;
const bushCells=[];for(let i=0;i<N;i++)if(BUSH[i])bushCells.push(i);
const attacked=(c,cell,owner)=>E.genMoves(c,-owner).some(m=>((m>>7)&127)===cell);        // quan owner tai cell co bi an khong
const threatens=(c,cell,owner)=>E.genMoves(c,owner).some(m=>(m&127)===cell&&c[(m>>7)&127]*owner<0); // quan tai cell co nuoc an khong
const SLOTKEYS=[null,['rat'],['cat','fox'],['wolf','boar'],['dog','bear'],['leo','croc'],['tig','eagle'],['lio','bison'],['ele'],['','mon','tur']];
const PT={};const pt=k=>PT[k]||(PT[k]={slips:0,fromThreat:0,escImm:0,escOk:0,exposedImm:0,createsThreat:0,n1:0,alive1:0,reThreat:0,n3:0,alive3:0,escape:0,escapeFail:0,attack:0,reposition:0,harm:0,diedBy3:0});
let PEND=[];let curSq=null;
const M={regMiss:0,regWorse:0,regNeutral:0,regSum:0,regN:0,opp:0,oppSlipAvail:0,oppSlipAvailUsed:0,oppSlipOnly:0,oppSlipOnlyUsed:0,oppSlipOnlyOtherEsc:0,oppAnyMoveEsc:0,dSum:0,dN:0,dMax:0,games:0,plies:0,slip:0,avail:0,gamesWithSlip:0,escape:0,exposed:0,newThreat:0,hadThreat:0,bushOcc:0,enterBush:0,top:0,bot:0,draw:0,den:0,wipe:0,stalemate:0,cap:0};
function game(sq){
  E.setClassic(false);E.SQ[0]=sq.slice();E.SQ[1]=sq.slice();E.setKeys();E.clearTT();
  curSq=[sq,sq];PEND=[];let c=E.initialCells(),side=1,n=0,ph=[E.hashOf(c,1)],gs=0;
  const cnt=h=>ph.filter(x=>x===h).length;
  while(n<CAP){
    const all=E.genMoves(c,side);if(!all.length){M.stalemate++;return 0;}
    const ban=all.filter(m=>{const k=(m>>14)&15,t=(m>>7)&127;if(k===0&&E.DEN[t]===-side&&((m>>18)&127)===((m>>25)&127))return false;const cc=Int8Array.from(c);E.commitM(cc,m);return cnt(E.hashOf(cc,-side))>=2;});
    if(ban.length===all.length){M.stalemate++;return 0;}
    for(const b of bushCells)if(c[b]!==0)M.bushOcc++;
    M.avail+=all.filter(m=>((m>>14)&15)===10).length;
    const r=E.search(c,side,LV,ph.slice(-14),ban);if(!r){M.stalemate++;return 0;}
    M.dSum+=r.depth;M.dN++;if(r.depth>M.dMax)M.dMax=r.depth;
    const k=(r.m>>14)&15,from=r.m&127,to=(r.m>>7)&127;
    // co hoi: quan cua minh dung trong bui dang bi doa (truoc nuoc di nay)
    for(const b of bushCells){ if(c[b]*side<=0||!attacked(c,b,side))continue; M.opp++;
      const mv=all.filter(m=>(m&127)===b);
      const esc=m=>{const a=Int8Array.from(c);E.commitM(a,m);let t=-1;for(let i=0;i<N;i++)if(a[i]===c[b]){t=i;break;}return t>=0&&!attacked(a,t,side);};
      const slipEsc=mv.filter(m=>((m>>14)&15)===10&&esc(m)), othEsc=mv.filter(m=>((m>>14)&15)!==10&&esc(m));
      if(slipEsc.length){M.oppSlipAvail++; if(from===b&&k===10)M.oppSlipAvailUsed++;}
      if(slipEsc.length&&!othEsc.length){ if(!(from===b&&k===10)){ const ban2=all.filter(m=>slipEsc.indexOf(m)<0); const r2=ban2.length<all.length?E.search(c,side,LV,ph.slice(-14),ban2):null; if(r2){const d=r2.score-r.score;M.regN++;M.regSum+=d;if(d>50)M.regMiss++;else if(d<-50)M.regWorse++;else M.regNeutral++;} } M.oppSlipOnly++; if(from===b&&k===10)M.oppSlipOnlyUsed++; else if(from===b&&esc(r.m))M.oppSlipOnlyOtherEsc++;}
      if(slipEsc.length||othEsc.length){ if(from===b&&esc(r.m))M.oppAnyMoveEsc++; } }
    if(BUSH[to]&&!BUSH[from]&&c[to]===0)M.enterBush++;
    let pre=null; if(k===10){gs++;M.slip++;pre={att:attacked(c,from,side)};}
    const val=c[from], tkey=(curSq[0][Math.abs(val)]!==undefined?SLOTKEYS[Math.abs(val)][curSq[0][Math.abs(val)]||0]:'?')||('r'+Math.abs(val));
    E.commitM(c,r.m);
    for(const p of PEND){ if(p.done)continue; if(p.side===side&&from===p.cell)p.cell=to; }
    if(pre){const T=pt(tkey),nowAtt=attacked(c,to,side),nt=threatens(c,to,side);T.slips++;
      if(pre.att&&!nowAtt)M.escape++;if(!pre.att&&nowAtt)M.exposed++;if(pre.att)M.hadThreat++;if(nt)M.newThreat++;
      if(pre.att)T.fromThreat++; if(pre.att&&!nowAtt)T.escImm++; if(!pre.att&&nowAtt)T.exposedImm++; if(nt)T.createsThreat++;
      PEND.push({side,cell:to,val,key:tkey,step:0,hadT:pre.att,nowAtt,nt,done:false});}
    for(const p of PEND){ if(p.done||(p.step===0&&p.justMade))continue; }
    for(const p of PEND){ if(p.done)continue; if(p.born===undefined){p.born=n;continue;}
      const st=n-p.born; // so nuoc da di ke tu luc lach (n chua tang cho nuoc hien tai)
      if(st===1){const T=pt(p.key);T.n1++;const al=c[p.cell]===p.val;if(al){T.alive1++;if(attacked(c,p.cell,p.side))T.reThreat++;if(p.hadT&&!p.nowAtt)T.escOk++;}p.al1=al;
        // phan loai muc dich cua nuoc lach
        if(p.hadT){ if(!p.nowAtt&&al)T.escape++; else T.escapeFail++; }
        else if(p.nowAtt||!al) T.harm++;
        else if(p.nt) T.attack++;
        else T.reposition++;}
      if(st===3){const T=pt(p.key);T.n3++;if(c[p.cell]===p.val)T.alive3++;else if(p.al1)T.diedBy3++;p.done=true;}
    }
    n++;M.plies++;
    if(E.DEN[r.t]===-side&&r.k===0){M.den++;M.games++;if(gs)M.gamesWithSlip++;return side;}
    const cn=E.counts(c);if((side>0&&cn[1]===0)||(side<0&&cn[0]===0)){M.wipe++;M.games++;if(gs)M.gamesWithSlip++;return side;}
    side=-side;ph.push(E.hashOf(c,side));
  }
  M.cap++;return 0;
}
for(let i=0;i<G;i++){
  const sq=Z.slice();for(let r=2;r<=7;r++)sq[r]=R()*2|0;sq[9]=R()*3|0;
  const w=game(sq); if(w>0)M.top++;else if(w<0)M.bot++;else M.draw++;
  if(!(M.games>i)){M.games++;} // van hoa/het gioi han van duoc tinh
}
const per=x=>+(x/M.games).toFixed(2);
console.log(JSON.stringify({engine:EP.split('/').slice(-3).join('/'),mode:MODE,depth:DEP,games:M.games,seed:SEED,
 avgPlies:+(M.plies/M.games).toFixed(1),topWin:M.top,botWin:M.bot,draw:M.draw,den:M.den,wipe:M.wipe,
 slipPerGame:per(M.slip),slipPctOfMoves:+(100*M.slip/M.plies).toFixed(2),slipAvailPerGame:per(M.avail),gamesWithSlip:M.gamesWithSlip,
 slipEscapePct:M.hadThreat?+(100*M.escape/M.hadThreat).toFixed(0):null,slipFromThreat:M.hadThreat,avgDepthReached:+(M.dSum/M.dN-1).toFixed(2),maxDepthReached:M.dMax,perType:PT,opp:{threatenedInBush:M.opp,slipEscapeAvailable:M.oppSlipAvail,slipChosenWhenAvailable:M.oppSlipAvailUsed,slipIsOnlyEscape:M.oppSlipOnly,slipChosenWhenOnlyEscape:M.oppSlipOnlyUsed,anyEscapeChosen:M.oppAnyMoveEsc,notSlip_regretN:M.regN,slipBetterBy50plus:M.regMiss,slipWorseBy50plus:M.regWorse,within50:M.regNeutral,avgSlipMinusChosen:M.regN?+(M.regSum/M.regN).toFixed(1):null},slipExposed:M.exposed,slipCreatesThreatPct:M.slip?+(100*M.newThreat/M.slip).toFixed(0):null,
 bushOccupancyPctOfPlies:+(100*M.bushOcc/(M.plies*bushCells.length)).toFixed(2),enterBushPerGame:per(M.enterBush)}));
