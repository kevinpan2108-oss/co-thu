/* So sanh AI voi luat lau say co an quan (B) va luat hien tai (A).
   node tests/reed_capture_compare.js [pairs=6] [ms=100] [seed=20261030] */
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();';
const A=new Function(src)(),B=new Function(src)();
const G=+process.argv[2]||6,MS=+process.argv[3]||100;let seed=+process.argv[4]||20261030;
[A,B].forEach((E,i)=>{E.setClassic(false);E.setAI(true);E.setReedCapture(i===1);E.LEVELS[3].ms=MS;});
const Z=[0,0,0,0,0,0,0,0,0,0],R=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
function formation(){const s=Z.slice();for(let r=2;r<=7;r++)s[r]=R()*2|0;s[9]=R()*3|0;return s;}
function game(aSide,sq){
 [A,B].forEach(E=>{E.SQ[0]=sq.slice();E.SQ[1]=sq.slice();E.setKeys();});
 let c=A.initialCells(),side=1,n=0,history=[A.hashOf(c,1)];
 const repeats=h=>history.filter(x=>x===h).length;
 while(n<120){
  const E=side===aSide?A:B, all=E.genMoves(c,side);
  if(!all.length)return {w:0,n,why:'stalemate'};
  const ban=all.filter(m=>{const k=(m>>14)&15,t=(m>>7)&127;if(k===0&&E.DEN[t]===-side&&((m>>18)&127)===((m>>25)&127))return false;const cc=Int8Array.from(c);E.commitM(cc,m);return repeats(E.hashOf(cc,-side))>=2;});
  if(ban.length===all.length)return {w:0,n,why:'repetition'};
  const r=E.search(c,side,3,history.slice(-14),ban);if(!r)return {w:0,n,why:'null'};
  E.commitM(c,r.m);
  if(E.DEN[r.t]===-side&&r.k===0)return {w:side,n:n+1,why:'den'};
  const counts=E.counts(c);if((side>0&&counts[1]===0)||(side<0&&counts[0]===0))return {w:side,n:n+1,why:'wipe'};
  side=-side;n++;history.push(E.hashOf(c,side));
 }
 return {w:0,n,why:'cap'};
}
let winA=0,winB=0,draw=0,plies=0,reedCaptures=0,reasons={};
for(let g=0;g<G;g++)for(const aSide of [1,-1]){
 const r=game(aSide,formation());plies+=r.n;reasons[r.why]=(reasons[r.why]||0)+1;
 if(!r.w)draw++;else if(r.w===aSide)winA++;else winB++;
}
console.log(JSON.stringify({games:G*2,baselineWins:winA,reedCaptureWins:winB,draws:draw,avgPlies:+(plies/(G*2)).toFixed(1),reasons,ms:MS,seed}));
