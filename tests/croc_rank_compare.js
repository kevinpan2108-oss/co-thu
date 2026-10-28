/* Paired-seed crocodile effective-rank experiment.
   Compare current land rank 3 / water rank 6 against land rank 4 / water rank 6, using the full experimental AI flags (7).
   Each randomized squad is played twice with sides swapped; AI settings are identical.
   Usage: node tests/croc_rank_compare.js [seedPairs=25] [ms=25] [seed=2026102808] [plyCap=140]
*/
const fs=require('fs'),path=require('path');
const originalSource=fs.readFileSync(path.join(__dirname,'..','src','engine.js'),'utf8');
const rankRule="if(k==='croc') return inW(cells,i)?6:3;";
if(originalSource.split(rankRule).length!==2) throw new Error('Expected exactly one crocodile rank rule');
const rank4Source=originalSource.replace(rankRule,"if(k==='croc') return inW(cells,i)?6:4;");
const make=source=>new Function(source+';return makeEngine();')();
const current=make(originalSource), rank4=make(rank4Source);
for(const E of [current,rank4]) { E.setClassic(false); E.setAI(true); E.SQ[0][5]=1; E.SQ[1][5]=1; E.setKeys(); }
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
if(!rankCheck.landRank3to4||!rankCheck.waterRankRemains6) throw new Error('Crocodile rank variant sanity check failed: '+JSON.stringify(rankCheck));
const pairs=Math.max(1,+process.argv[2]||25), ms=Math.max(1,+process.argv[3]||25);
let seed=+process.argv[4]||2026102808;
const cap=Math.max(1,+process.argv[5]||140);
for(const E of [current,rank4]) { E.LEVELS[3].ms=ms; E.clearTT(); }
const {COLS,N,DEN}=current;
const ZERO=[0,0,0,0,0,0,0,0,0,0], originalRandom=Math.random;
const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const stats=()=>({left:0,center:0,right:0,totalMoves:0,crocCaptures:0,crocDeaths:0,crocAliveSamples:0,crocAliveAtGameEnd:0});
const out={seedPairs:pairs,games:0,ms,plyCap:cap,rankCheck,currentWins:0,rank4Wins:0,draws:0,totalPlies:0,endReasons:{},current:stats(),rank4:stats()};
function crocPresent(cells,side,squad){
  if(squad[5]!==1)return false;
  for(let i=0;i<N;i++)if(cells[i]*side>0&&Math.abs(cells[i])===5)return true;
  return false;
}
function sample(cells,currentSide,squad){
  if(crocPresent(cells,currentSide,squad))out.current.crocAliveSamples++;
  if(crocPresent(cells,-currentSide,squad))out.rank4.crocAliveSamples++;
}
function play(squad,rank4Side){
  for(const E of [current,rank4]){
    E.setClassic(false);E.SQ[0]=squad.slice();E.SQ[1]=squad.slice();E.setKeys();E.clearTT();
  }
  const cells=current.initialCells();let side=1,n=0,history=[current.hashOf(cells,1)];
  while(n<cap){
    const usesRank4=side===rank4Side,E=usesRank4?rank4:current;
    const st=usesRank4?out.rank4:out.current;
    const moves=E.genMoves(cells,side);
    if(!moves.length)return finish(0,n,'stalemate',cells,squad,rank4Side);
    const banned=moves.filter(m=>{
      const k=(m>>14)&15,t=(m>>7)&127;
      if(k===0&&DEN[t]===-side&&((m>>18)&127)===((m>>25)&127))return false;
      const next=Int8Array.from(cells);E.commitM(next,m);
      const hash=E.hashOf(next,-side);
      return history.filter(h=>h===hash).length>=2;
    });
    if(banned.length===moves.length)return finish(0,n,'repeat',cells,squad,rank4Side);
    const result=E.search(cells,side,3,history.slice(-14),banned);
    if(!result)return finish(0,n,'null',cells,squad,rank4Side);
    const to=result.t,col=to%COLS;
    if(col<=2)st.left++;else if(col>=6)st.right++;else st.center++;
    st.totalMoves++;
    const target=cells[to];
    if(squad[5]===1&&target*side<0&&Math.abs(target)===5){
      st.crocCaptures++;
      if(target*rank4Side>0)out.rank4.crocDeaths++;else out.current.crocDeaths++;
    }
    E.commitM(cells,result.m);
    sample(cells,rank4Side,squad);
    if(DEN[to]===-side&&result.k===0)return finish(side,n+1,'den',cells,squad,rank4Side);
    const counts=E.counts(cells);
    if((side>0&&counts[1]===0)||(side<0&&counts[0]===0))return finish(side,n+1,'wipe',cells,squad,rank4Side);
    side=-side;n++;history.push(E.hashOf(cells,side));
  }
  return finish(0,n,'cap',cells,squad,rank4Side);
}
function finish(winner,n,why,cells,squad,rank4Side){
  out.totalPlies+=n;
  out.endReasons[why]=(out.endReasons[why]||0)+1;
  if(winner===0)out.draws++;
  else if(winner===rank4Side)out.rank4Wins++;
  else out.currentWins++;
  if(crocPresent(cells,rank4Side,squad))out.rank4.crocAliveAtGameEnd++;
  if(crocPresent(cells,-rank4Side,squad))out.current.crocAliveAtGameEnd++;
  return {winner,n,why};
}
const started=Date.now();
Math.random=()=>rnd();
try{
  for(let g=0;g<pairs;g++){
    const squad=ZERO.slice();
    for(let r=2;r<=7;r++)squad[r]=rnd()<0.5?0:1;
    squad[5]=1; // Ensure both teams actually use the crocodile for this rule comparison.
    squad[9]=rnd()<0.33?0:(rnd()<0.5?1:2);
    for(const rank4Side of [1,-1]){
      play(squad,rank4Side);
      out.games++;
    }
  }
}finally{Math.random=originalRandom;}
out.avgPlies=+(out.totalPlies/out.games).toFixed(1);
out.runtimeSeconds=+((Date.now()-started)/1000).toFixed(1);
console.log(JSON.stringify(out));
