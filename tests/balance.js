/* Can bang sau cap quan tuy chon (bac 2..7, moi bac hai bien the: 0 va 1).
   Voi moi bac r va moi doi hinh ngau nhien (cac bac con lai giong nhau hai phe): bien the 0 o phe duoi, bien the 1 o phe tren,
   roi DOI PHE. AI v2 choi ca hai phe. node balance.js <ranks vd 2,3,4> <seeds> <ms> [seed]  -> in JSON */
const fs=require('fs'),path=require('path');
const E=new Function(fs.readFileSync(process.env.ENGINE||path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
const ranks=(process.argv[2]||'2,3,4,5,6,7').split(',').map(Number), S=+process.argv[3]||4, MS=+process.argv[4]||100; let seed=+process.argv[5]||1234;
E.LEVELS[3].ms=MS; const {COLS}=E; const Z=[0,0,0,0,0,0,0,0,0,0];
const R=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const band=c=>c<=2?'L':c<=5?'C':'R';
function game(sq0,sq1,cap,st){
  E.setClassic(false);E.SQ[0]=sq0.slice();E.SQ[1]=sq1.slice();E.setKeys();
  let c=E.initialCells(),side=1,n=0,ph=[E.hashOf(c,1)];
  const cnt=h=>ph.filter(x=>x===h).length;
  while(n<cap){
    const all=E.genMoves(c,side); if(!all.length) return {w:0,n,why:'stalemate'};
    const ban=all.filter(m=>{const k=(m>>14)&15,t=(m>>7)&127;if(k===0&&E.DEN[t]===-side&&((m>>18)&127)===((m>>25)&127))return false;const cc=Int8Array.from(c);E.commitM(cc,m);return cnt(E.hashOf(cc,-side))>=2;});
    if(ban.length===all.length) return {w:0,n,why:'stalemate'};
    const r=E.search(c,side,3,ph.slice(-14),ban); if(!r) return {w:0,n,why:'null'};
    const fr=(r.f/COLS)|0,tr=(r.t/COLS)|0,tc=r.t%COLS;
    if((fr<4&&tr>=4)||(fr>4&&tr<=4)||(fr===4&&tr!==4)) st.cross[band(tc)]++;   // vuot song theo cot dich den
    if(c[r.t]!==0&&r.k!==5) st.cap[band(tc)]++;
    if(r.bf!==undefined&&r.bf!==r.bt) st.bonus++;
    if(E.MARSH[r.t]) st.marsh++;
    E.commitM(c,r.m);
    if(E.DEN[r.t]===-side&&r.k===0) return {w:side,n:n+1,why:'den'};
    const cn=E.counts(c); if((side>0&&cn[1]===0)||(side<0&&cn[0]===0)) return {w:side,n:n+1,why:'wipe'};
    side=-side;n++;ph.push(E.hashOf(c,side));
  }
  return {w:0,n,why:'cap'};
}
const out={ms:MS,seeds:S,pairs:{}};
for(const rk of ranks){
  const P={v0:0,v1:0,draw:0,games:0,plies:0,bottomWins:0,topWins:0,whys:{},cross:{L:0,C:0,R:0},cap:{L:0,C:0,R:0},bonus:0,marsh:0};
  for(let g=0;g<S;g++){
    const base=Z.slice();for(let r=2;r<=7;r++)base[r]=R()*2|0;base[9]=R()*3|0;
    for(const sw of [0,1]){
      const a=base.slice(),b=base.slice(); a[rk]=sw?1:0; b[rk]=sw?0:1;   // a: phe duoi, b: phe tren
      const r=game(a,b,140,P); P.games++;P.plies+=r.n;P.whys[r.why]=(P.whys[r.why]||0)+1;
      if(r.w===0)P.draw++; else{ const bottomWon=r.w>0; if(bottomWon)P.bottomWins++;else P.topWins++;
        const v0won=(bottomWon&&!sw)||(!bottomWon&&sw); if(v0won)P.v0++;else P.v1++; }
    }
  }
  out.pairs[rk]=P;
}
console.log(JSON.stringify(out));
