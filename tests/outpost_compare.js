/* Paired-seed comparison: baseline evaluator vs AI mask 4 (outpost-control heuristic).
   Usage: node tests/outpost_compare.js [seedPairs=6] [ms=10] [seed=2026102807] [plyCap=120]
   Each squad seed is played twice, swapping which side uses the outpost heuristic.
   This is a heuristic experiment, not a proof of overall game balance. */
const fs=require('fs'),path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();';
const make=()=>new Function(src)();
const base=make(), improved=make();
base.setAI(false); improved.setAI(4);
const pairs=+process.argv[2]||6, ms=+process.argv[3]||10;
let seed=+process.argv[4]||2026102807;
const cap=+process.argv[5]||120;
for(const E of [base,improved]){E.LEVELS[3].ms=ms;E.clearTT();}
const {COLS,N,OUTPOST,ADJ,DEN}=improved;
const Z=[0,0,0,0,0,0,0,0,0,0], originalRandom=Math.random;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const stats=()=>({left:0,center:0,right:0,totalMoves:0,enteredOutpost:0,bonusSteps:0,occupiedOutpostPly:0,adjacentOutpostPly:0,contestedOutpostPly:0});
const out={seedPairs:pairs,games:0,ms,plyCap:cap,baseWins:0,improvedWins:0,draws:0,totalPlies:0,endReasons:{},base:stats(),improved:stats()};
const outposts=[];for(let i=0;i<N;i++)if(OUTPOST[i])outposts.push(i);
function samplePosition(cells,side,st){
  for(const o of outposts){
    if(cells[o]*side>0&&Math.abs(cells[o])!==9)st.occupiedOutpostPly++;
    let own=false,foe=false;
    for(let d=0;d<4;d++){
      const n=ADJ[o*4+d];if(n<0)continue;
      const v=cells[n];
      if(v*side>0&&Math.abs(v)!==9)own=true;
      if(v*side<0&&Math.abs(v)!==9)foe=true;
    }
    if(own)st.adjacentOutpostPly++;
    if(own&&foe)st.contestedOutpostPly++;
  }
}
function play(squad,improvedSide){
  for(const E of [base,improved]){
    E.setClassic(false);E.SQ[0]=squad.slice();E.SQ[1]=squad.slice();E.setKeys();E.clearTT();
  }
  const cells=base.initialCells();let side=1,n=0,history=[base.hashOf(cells,1)];
  while(n<cap){
    const useImproved=side===improvedSide,E=useImproved?improved:base;
    const st=useImproved?out.improved:out.base;
    const moves=E.genMoves(cells,side);
    if(!moves.length)return{winner:0,n,why:'stalemate'};
    const banned=moves.filter(m=>{
      const k=(m>>14)&15,t=(m>>7)&127;
      if(k===0&&DEN[t]===-side&&((m>>18)&127)===((m>>25)&127))return false;
      const next=Int8Array.from(cells);E.commitM(next,m);
      const hash=E.hashOf(next,-side);
      return history.filter(h=>h===hash).length>=2;
    });
    if(banned.length===moves.length)return{winner:0,n,why:'repeat'};
    const result=E.search(cells,side,3,history.slice(-14),banned);
    if(!result)return{winner:0,n,why:'null'};
    const to=result.t,col=to%COLS;
    if(col<=2)st.left++;else if(col>=6)st.right++;else st.center++;
    st.totalMoves++;
    if(OUTPOST[to]&&cells[to]*side<=0)st.enteredOutpost++;
    if(result.bf!==result.bt)st.bonusSteps++;
    E.commitM(cells,result.m);
    samplePosition(cells,improvedSide,out.improved);
    samplePosition(cells,-improvedSide,out.base);
    if(DEN[to]===-side&&result.k===0)return{winner:side,n:n+1,why:'den'};
    const counts=E.counts(cells);
    if((side>0&&counts[1]===0)||(side<0&&counts[0]===0))return{winner:side,n:n+1,why:'wipe'};
    side=-side;n++;history.push(E.hashOf(cells,side));
  }
  return{winner:0,n,why:'cap'};
}
const started=Date.now();
Math.random=()=>rnd();
try{
  for(let g=0;g<pairs;g++){
    const squad=Z.slice();
    for(let r=2;r<=7;r++)squad[r]=rnd()<0.5?0:1;
    squad[9]=rnd()<0.33?0:(rnd()<0.5?1:2);
    for(const improvedSide of [1,-1]){
      const r=play(squad,improvedSide);
      out.games++;out.totalPlies+=r.n;
      out.endReasons[r.why]=(out.endReasons[r.why]||0)+1;
      if(r.winner===0)out.draws++;
      else if(r.winner===improvedSide)out.improvedWins++;
      else out.baseWins++;
    }
  }
}finally{Math.random=originalRandom;}
out.avgPlies=+(out.totalPlies/out.games).toFixed(1);
out.runtimeSeconds=+((Date.now()-started)/1000).toFixed(1);
console.log(JSON.stringify(out));
