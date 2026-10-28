/* Tran tu choi that giua hai cau hinh AI: node match.js <games> <ms> [seed]
   A = AI v2 (setAI(true)), B = AI cu (setAI(false)). Moi cap quan (doi hinh) choi ca hai phe. */
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();';
const G=+process.argv[2]||10, MS=+process.argv[3]||150; let seed=+process.argv[4]||7;
const A=new Function(src)(), B=new Function(src)(); const MASK=process.argv[5]===undefined?true:+process.argv[5]; A.setAI(MASK); B.setAI(false);
const DEP=+process.argv[6]||0; [A,B].forEach(E=>{E.LEVELS[3].ms=DEP?60000:MS; if(DEP)E.LEVELS[3].depth=DEP;});
const {COLS}=A; const Z=[0,0,0,0,0,0,0,0,0,0];
const R=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const rsq=()=>{const s=Z.slice();for(let r=2;r<=7;r++)s[r]=R()*2|0;s[9]=R()*3|0;return s;};
function game(sq,aSide,cap){
  [A,B].forEach(E=>{E.setClassic(false);E.SQ[0]=sq.slice();E.SQ[1]=sq.slice();E.setKeys();});
  let c=A.initialCells(),side=1,n=0,ph=[A.hashOf(c,1)];
  const cnt=h=>ph.filter(x=>x===h).length;
  while(n<cap){
    const E=side===aSide?A:B;
    const all=E.genMoves(c,side); if(!all.length) return {w:0,n,why:'stalemate'};
    const ban=all.filter(m=>{const k=(m>>14)&15,t=(m>>7)&127;if(k===0&&E.DEN[t]===-side&&((m>>18)&127)===((m>>25)&127))return false;const cc=Int8Array.from(c);E.commitM(cc,m);return cnt(E.hashOf(cc,-side))>=2;});
    if(ban.length===all.length) return {w:0,n,why:'stalemate'};
    const r=E.search(c,side,3,ph.slice(-14),ban); if(!r) return {w:0,n,why:'null'};
    E.commitM(c,r.m);
    if(E.DEN[r.t]===-side&&r.k===0) return {w:side,n:n+1,why:'den'};
    const cn=E.counts(c); if((side>0&&cn[1]===0)||(side<0&&cn[0]===0)) return {w:side,n:n+1,why:'wipe'};
    side=-side;n++;ph.push(E.hashOf(c,side));
  }
  return {w:0,n,why:'cap'};
}
let a=0,b=0,d=0,plies=0,whys={};
for(let g=0;g<G;g++){
  const sq=rsq();
  for(const aSide of [1,-1]){
    const r=game(sq,aSide,140); plies+=r.n; whys[r.why]=(whys[r.why]||0)+1;
    if(r.w===0)d++; else if(r.w===aSide)a++; else b++;
  }
}
console.log(JSON.stringify({games:G*2,v2_wins:a,old_wins:b,draws:d,avgPlies:+(plies/(G*2)).toFixed(1),whys,ms:MS,mask:MASK,depth:DEP}));
