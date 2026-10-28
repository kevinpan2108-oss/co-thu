/* Paired-seed crocodile effective-rank rule experiment.
   Compare two GLOBAL rulesets: current land rank 3 / water rank 6 vs
   land rank 4 / water rank 6. Every game uses one rule set for both sides.
   Each seed is played with both starting sides under each rule, using the full
   experimental AI flags (7) and matched random seeds. This measures game outcomes,
   crocodile captures and survival; it is not a head-to-head match between rule sets.
   Usage: node tests/croc_rank_compare.js [seedPairs=25] [ms=25] [seed=2026102808] [plyCap=140]
*/
const fs=require('fs'),path=require('path');
const originalSource=fs.readFileSync(path.join(__dirname,'..','src','engine.js'),'utf8');
const rankRule="if(k==='croc') return inW(cells,i)?6:3;";
if(originalSource.split(rankRule).length!==2) throw new Error('Expected exactly one crocodile rank rule');
const rank4Source=originalSource.replace(rankRule,"if(k==='croc') return inW(cells,i)?6:4;");
const make=source=>new Function(source+';return makeEngine();')();
const current=make(originalSource), rank4=make(rank4Source);
for(const E of [current,rank4]) {
  E.setClassic(false); E.setAI(true);
  E.SQ[0][5]=1; E.SQ[1][5]=1; E.setKeys();
}
function checkRanks(){
  let land=null,water=null;
  for(let i=0;i<current.N;i++){
    const cells=new Int8Array(current.N);cells[i]=5;
    const a=current.effRank(cells,i),b=rank4.effRank(cells,i);
    if(a===3&&b===4&&land===null)land=i;
    if(a===6&&b===6&&water===null)water=i;
  }
  return {landRank3to4:land!==null,waterRankRemains6:water!==null};
}
const rankCheck=checkRanks();
if(!rankCheck.landRank3to4||!rankCheck.waterRankRemains6)
  throw new Error('Crocodile rank variant sanity check failed: '+JSON.stringify(rankCheck));
const pairs=Math.max(1,+process.argv[2]||25), ms=Math.max(1,+process.argv[3]||25);
const initialSeed=(+process.argv[4]||2026102808)>>>0, cap=Math.max(1,+process.argv[5]||140);
for(const E of [current,rank4]) E.LEVELS[3].ms=ms;
const {COLS,N,DEN}=current;
const ZERO=[0,0,0,0,0,0,0,0,0,0], originalRandom=Math.random;
function rng(seed){
  let value=seed>>>0;
  return ()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
}
const stats=()=>({
  games:0,firstWins:0,secondWins:0,plusWins:0,minusWins:0,draws:0,
  totalPlies:0,endReasons:{},crocCaptures:0,
  plusCrocAlivePlySamples:0,minusCrocAlivePlySamples:0,
  plusCrocAliveAtEnd:0,minusCrocAliveAtEnd:0
});
const out={
  seedPairs:pairs,games:0,gamesPerRule:pairs*2,ms,plyCap:cap,aiMask:7,
  initialSeed,rankCheck,current:stats(),rank4:stats()
};
function crocPresent(cells,side){
  for(let i=0;i<N;i++)if(cells[i]*side>0&&Math.abs(cells[i])===5)return true;
  return false;
}
function finish(st,winner,n,why,startSide,cells){
  st.games++;out.games++;st.totalPlies+=n;
  st.endReasons[why]=(st.endReasons[why]||0)+1;
  if(winner===0)st.draws++;
  else {
    if(winner===startSide)st.firstWins++;else st.secondWins++;
    if(winner>0)st.plusWins++;else st.minusWins++;
  }
  if(crocPresent(cells,1))st.plusCrocAliveAtEnd++;
  if(crocPresent(cells,-1))st.minusCrocAliveAtEnd++;
  return {winner,n,why};
}
function play(E,squad,startSide,st,searchSeed){
  E.setClassic(false);E.setAI(true);
  E.SQ[0]=squad.slice();E.SQ[1]=squad.slice();E.setKeys();E.clearTT();
  E.LEVELS[3].ms=ms;
  Math.random=rng(searchSeed);
  const cells=E.initialCells();
  let side=startSide,n=0,history=[E.hashOf(cells,side)];
  while(n<cap){
    const moves=E.genMoves(cells,side);
    if(!moves.length)return finish(st,0,n,'stalemate',startSide,cells);
    const banned=moves.filter(m=>{
      const k=(m>>14)&15,t=(m>>7)&127;
      if(k===0&&DEN[t]===-side&&((m>>18)&127)===((m>>25)&127))return false;
      const next=Int8Array.from(cells);E.commitM(next,m);
      const hash=E.hashOf(next,-side);
      return history.filter(h=>h===hash).length>=2;
    });
    if(banned.length===moves.length)return finish(st,0,n,'repeat',startSide,cells);
    const result=E.search(cells,side,3,history.slice(-14),banned);
    if(!result)return finish(st,0,n,'null',startSide,cells);
    const to=result.t;
    if(cells[to]*side<0&&Math.abs(cells[to])===5)st.crocCaptures++;
    E.commitM(cells,result.m);
    if(crocPresent(cells,1))st.plusCrocAlivePlySamples++;
    if(crocPresent(cells,-1))st.minusCrocAlivePlySamples++;
    if(DEN[to]===-side&&result.k===0)return finish(st,side,n+1,'den',startSide,cells);
    const counts=E.counts(cells);
    if((side>0&&counts[1]===0)||(side<0&&counts[0]===0))
      return finish(st,side,n+1,'wipe',startSide,cells);
    side=-side;n++;history.push(E.hashOf(cells,side));
  }
  return finish(st,0,n,'cap',startSide,cells);
}
const started=Date.now();
try{
  const master=rng(initialSeed);
  for(let g=0;g<pairs;g++){
    const squad=ZERO.slice();
    for(let r=2;r<=7;r++)squad[r]=master()<0.5?0:1;
    squad[5]=1; // Use a crocodile on both sides in every game.
    squad[9]=master()<0.33?0:(master()<0.5?1:2);
    for(const [E,st] of [[current,out.current],[rank4,out.rank4]]){
      for(const startSide of [1,-1]){
        const searchSeed=(initialSeed ^ Math.imul(g+1,0x9e3779b1) ^ (startSide>0?0xa341316c:0xc8013ea4))>>>0;
        play(E,squad,startSide,st,searchSeed);
      }
    }
  }
}finally{Math.random=originalRandom;}
for(const st of [out.current,out.rank4])st.avgPlies=+(st.totalPlies/st.games).toFixed(1);
out.runtimeSeconds=+((Date.now()-started)/1000).toFixed(1);
console.log(JSON.stringify(out));
