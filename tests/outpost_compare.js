/* So sanh co che tien don: node outpost_compare.js <mode 0=cu(hoi chieu) | 1=kiem soat> <so cap doi hinh> <do sau> <seed> [aiMask]
   Moi cap doi hinh (A,B) choi 2 van doi phe: A duoi/B tren, roi A tren/B duoi. Seed co dinh (Math.random thay bang PRNG); AI do sau co dinh nen tai lap duoc. In JSON. */
const fs=require('fs'),path=require('path');
const E=new Function(fs.readFileSync(process.env.ENGINE||path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
const MODE=+process.argv[2]||0, P=+process.argv[3]||25, D=+process.argv[4]||5, SEED=+process.argv[5]||1, MASK=+process.argv[6]||0;
E.setOutMode(MODE); E.setAI(MASK); if(process.env.FIXNOISE) E.setFixNoise(true); E.LEVELS[3].depth=D; E.LEVELS[3].ms=1e6;
let rs=SEED*2654435761>>>0; Math.random=()=>{rs^=rs<<13;rs>>>=0;rs^=rs>>>17;rs^=rs<<5;rs>>>=0;return rs/4294967296;};
let sq=SEED>>>0; const R=()=>{sq=(sq*1664525+1013904223)>>>0;return sq/4294967296;};
const {COLS}=E; const Z=[0,0,0,0,0,0,0,0,0,0]; const band=c=>c<=2?'L':c<=5?'C':'R';
const OUT=[3*COLS+1,5*COLS+1];
const T={mode:MODE,depth:D,seed:SEED,mask:MASK,games:0,bottomWin:0,topWin:0,draw:0,firstSqWin:0,secondSqWin:0,plies:0,whys:{},
  occupy:{bottom:0,top:0},lostToEnemy:0,leftVoluntarily:0,holdLens:[],cross:{L:0,C:0,R:0},cap:{L:0,C:0,R:0},
  bonusSteps:0,bonusFollowCap:0,winBonusGames:0,gamesWithBonus:0,winnerHadBonus:0,winlen:[],
  winWin:0,wnd:{bonusWin:0,bonusTot:0,baseWin:0,baseTot:0}};
const rsq=()=>{const s=Z.slice();for(let r=2;r<=7;r++)s[r]=R()*2|0;s[9]=R()*3|0;return s;};
function game(sqB,sqT,cap){
  E.setClassic(false);E.SQ[0]=sqB.slice();E.SQ[1]=sqT.slice();E.setKeys();E.clearTT();
  let c=E.initialCells(),side=1,n=0,ph=[E.hashOf(c,1)],res=null; const cnt=h=>ph.filter(x=>x===h).length;
  const start=[-1,-1], capTurns={1:[],'-1':[]}, bon=[], own={1:0,'-1':0}; let hadBonus={1:false,'-1':false};
  while(n<cap){
    const all=E.genMoves(c,side); if(!all.length){res={w:0,n,why:'stalemate'};break;}
    const ban=all.filter(m=>{const k=(m>>14)&15,t=(m>>7)&127;if(k===0&&E.DEN[t]===-side&&((m>>18)&127)===((m>>25)&127))return false;const cc=Int8Array.from(c);E.commitM(cc,m);return cnt(E.hashOf(cc,-side))>=2;});
    if(ban.length===all.length){res={w:0,n,why:'stalemate'};break;}
    const r=E.search(c,side,3,ph.slice(-14),ban); if(!r){res={w:0,n,why:'null'};break;}
    const fr=(r.f/COLS)|0,tr=(r.t/COLS)|0,tc=r.t%COLS;
    if((fr<4&&tr>=4)||(fr>4&&tr<=4)||(fr===4&&tr!==4)) T.cross[band(tc)]++;
    const captured=(r.k===6||r.k===7)?c[r.t]!==0:(r.k!==5&&c[r.t]!==0);
    if(captured){T.cap[band(tc)]++; capTurns[side].push(own[side]);}
    const before=OUT.map(o=>c[o]);
    const isBonus=r.bf!==r.bt; if(isBonus){T.bonusSteps++;bon.push([side,own[side]]);hadBonus[side]=true;}
    E.commitM(c,r.m);
    OUT.forEach((o,i)=>{const b=before[i],a=c[o];
      if(a!==b){
        if(b!==0&&!E.isTur(b)){ const L=n-start[i]; T.holdLens.push(L); if(side!==(b>0?1:-1)) T.lostToEnemy++; else T.leftVoluntarily++; }
        if(a!==0&&!E.isTur(a)){ start[i]=n; T.occupy[a>0?'bottom':'top']++; }
      }});
    own[side]++;
    if(E.DEN[r.t]===-side&&r.k===0&&!isBonus){res={w:side,n:n+1,why:'den'};break;}
    if(E.DEN[r.t]===-side&&r.k===0&&isBonus){res={w:side,n:n+1,why:'den'};break;}
    const cn=E.counts(c); if((side>0&&cn[1]===0)||(side<0&&cn[0]===0)){res={w:side,n:n+1,why:'wipe'};break;}
    side=-side;n++;ph.push(E.hashOf(c,side));
  }
  if(!res)res={w:0,n,why:'cap'};
  // hieu qua buoc thuong (thuoc do thay the): co an quan trong 3 luot ke tiep cua chinh phe do khong; so voi moi cua so 3 luot khac
  const bonSet=new Set(bon.map(b=>b[0]+':'+b[1]));
  [1,-1].forEach(sd=>{
    const total=own[sd], caps=new Set(capTurns[sd]);
    for(let j=0;j+3<total;j++){ let any=false; for(let q=1;q<=3;q++) if(caps.has(j+q)) any=true;
      if(bonSet.has(sd+':'+j)){T.wnd.bonusTot++; if(any)T.wnd.bonusWin++;} else {T.wnd.baseTot++; if(any)T.wnd.baseWin++;} }
  });
  if(hadBonus[1]||hadBonus[-1]){T.gamesWithBonus++; if(res.w!==0&&hadBonus[res.w])T.winnerHadBonus++;}
  return res;
}
for(let g=0;g<P;g++){
  const A=rsq(),B=rsq();
  for(const sw of [0,1]){
    const r=game(sw?B:A,sw?A:B,140); T.games++;T.plies+=r.n;T.whys[r.why]=(T.whys[r.why]||0)+1;
    if(r.w>0)T.bottomWin++;else if(r.w<0)T.topWin++;else T.draw++;
    if(r.w!==0){ const aIsBottom=!sw; const aWon=(r.w>0)===aIsBottom; if(aWon)T.firstSqWin++;else T.secondSqWin++; }
  }
}
const mean=a=>a.length?+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1):null;
T.avgPlies=+(T.plies/T.games).toFixed(1); T.meanHoldPlies=mean(T.holdLens); T.maxHold=T.holdLens.length?Math.max(...T.holdLens):0; T.holdCount=T.holdLens.length; delete T.holdLens;
console.log(JSON.stringify(T));
