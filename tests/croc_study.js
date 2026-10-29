/* Nghien cuu Bao - Ca sau. node croc_study.js <crocLand 3|4> <seeds> <depth> <mode duel|mirror|leo> <seed> -> JSON
   Co dinh seed: Math.random thay bang PRNG co seed; AI choi o do sau co dinh nen tai lap duoc 100%. */
const fs=require('fs'),path=require('path');
const E=new Function(fs.readFileSync(process.env.ENGINE||path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
const CL=+process.argv[2]||3, S=+process.argv[3]||10, D=+process.argv[4]||5, MODE=process.argv[5]||'duel', SEED=+process.argv[6]||1;
E.setCrocLand(CL); if(process.env.FIXNOISE) E.setFixNoise(true); E.LEVELS[3].depth=D; E.LEVELS[3].ms=1e6;
let rs=SEED*2654435761>>>0; Math.random=()=>{rs^=rs<<13;rs>>>=0;rs^=rs>>>17;rs^=rs<<5;rs>>>=0;return rs/4294967296;};
let sq=SEED>>>0; const R=()=>{sq=(sq*1664525+1013904223)>>>0;return sq/4294967296;};
const {COLS}=E; const Z=[0,0,0,0,0,0,0,0,0,0];
const M={games:0,crocWin:0,draw:0,crocLoss:0,plies:0,firstWaterPlies:[],neverWater:0,crocGames:0,
  deaths:{land:0,water:0,marsh:0},killerByKind:{},ambush:0,ambushVictims:{},oppAmb:0,takenAmb:0,oppCap:0,takenCap:0,missedAmbWhileWin:0,
  plyOnLand:0,plyInWater:0,crocDeathPly:[],bottomWin:0,topWin:0};
const isCroc=(c,)=>c!==0&&Math.abs(c)===5&&E.HK[c+9]==='croc';
function game(a,b,cap){
  E.setClassic(false);E.SQ[0]=a.slice();E.SQ[1]=b.slice();E.setKeys();E.clearTT();
  let c=E.initialCells(),side=1,n=0,ph=[E.hashOf(c,1)]; const cnt=h=>ph.filter(x=>x===h).length;
  const seen={}; let crocIdx=[]; let res=null;
  const crocs=()=>{const o=[];for(let i=0;i<E.N;i++)if(isCroc(c[i]))o.push([i,c[i]>0?1:-1]);return o;};
  const hasCroc=crocs().length>0; if(hasCroc)M.crocGames++;
  const fw={};  // first water ply per croc code
  while(n<cap){
    const all=E.genMoves(c,side); if(!all.length){res={w:0,n,why:'stalemate'};break;}
    const ban=all.filter(m=>{const k=(m>>14)&15,t=(m>>7)&127;if(k===0&&E.DEN[t]===-side&&((m>>18)&127)===((m>>25)&127))return false;const cc=Int8Array.from(c);E.commitM(cc,m);return cnt(E.hashOf(cc,-side))>=2;});
    if(ban.length===all.length){res={w:0,n,why:'stalemate'};break;}
    // thong ke vi tri Ca sau truoc nuoc di
    crocs().forEach(([i,sg])=>{ if(E.inW(c,i)){M.plyInWater++; if(fw[sg]===undefined)fw[sg]=n;} else M.plyOnLand++; });
    // co hoi cua Ca sau nay (phe dang di)
    const legal=all.filter(m=>ban.indexOf(m)<0);
    const ambs=legal.filter(m=>((m>>14)&15)===6&&isCroc(c[m&127])); // phuc kich boi Ca sau
    const caps=legal.filter(m=>{const f=m&127,t=(m>>7)&127,k=(m>>14)&15;return isCroc(c[f])&&k!==5&&c[t]*side<0&&k!==6;});
    if(ambs.length)M.oppAmb++; if(caps.length)M.oppCap++;
    const r=E.search(c,side,3,ph.slice(-14),ban); if(!r){res={w:0,n,why:'null'};break;}
    const f=r.f,t=r.t,k=r.k, mover=c[f], victim=c[t];
    if(ambs.length&&k===6&&isCroc(mover)){M.takenAmb++;M.ambush++;const vk=E.HK[victim+9];M.ambushVictims[vk]=(M.ambushVictims[vk]||0)+1;}
    if(caps.length&&isCroc(mover)&&k!==6&&victim*side<0)M.takenCap++;
    // Ca sau bi bat
    if(victim!==0&&isCroc(victim)&&k!==5&&victim*side<0){
      const where=E.WATER[t]?'water':(E.MARSH[t]?'marsh':'land'); M.deaths[where]++; M.crocDeathPly.push(n);
      const kk=E.HK[mover+9]+(k===6?'(ban)':k===7?'(vo)':''); M.killerByKind[where+':'+kk]=(M.killerByKind[where+':'+kk]||0)+1;
    }
    E.commitM(c,r.m);
    if(E.DEN[t]===-side&&k===0){res={w:side,n:n+1,why:'den'};break;}
    const cn=E.counts(c); if((side>0&&cn[1]===0)||(side<0&&cn[0]===0)){res={w:side,n:n+1,why:'wipe'};break;}
    side=-side;n++;ph.push(E.hashOf(c,side));
  }
  if(!res)res={w:0,n,why:'cap'};
  Object.keys(fw).forEach(k=>M.firstWaterPlies.push(fw[k])); if(hasCroc&&Object.keys(fw).length===0)M.neverWater++;
  return res;
}
for(let g=0;g<S;g++){
  const base=Z.slice();for(let r=2;r<=7;r++)base[r]=R()*2|0;base[9]=R()*3|0;
  for(const sw of [0,1]){
    const a=base.slice(),b=base.slice();
    if(MODE==='duel'){a[5]=sw?1:0;b[5]=sw?0:1;} else if(MODE==='mirror'){a[5]=1;b[5]=1;} else {a[5]=0;b[5]=0;}
    const r=game(a,b,140); M.games++;M.plies+=r.n;
    if(r.w>0)M.bottomWin++;else if(r.w<0)M.topWin++;
    if(MODE==='duel'){const crocBottom=(a[5]===1); if(r.w===0)M.draw++; else if((r.w>0)===crocBottom)M.crocWin++; else M.crocLoss++;}
    else { if(r.w===0)M.draw++; }
  }
}
const mean=a=>a.length?+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1):null;
M.avgPlies=+(M.plies/M.games).toFixed(1); M.meanFirstWaterPly=mean(M.firstWaterPlies); M.meanCrocDeathPly=mean(M.crocDeathPly);
delete M.firstWaterPlies; delete M.crocDeathPly; M.crocLand=CL; M.mode=MODE; M.depth=D; M.seed=SEED;
console.log(JSON.stringify(M));
