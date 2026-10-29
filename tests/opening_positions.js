/* Paired tournament for opening formations.
 * Compares candidate placements against the current setup with matched squads,
 * and swaps candidate/baseline between bottom and top sides. No rules are changed.
 * Usage: node tests/opening_positions.js [seedPairs=8] [thinkMs=8] [seed=2026102901] [plyCap=110]
 */
const fs=require('fs'),path=require('path');
const source=fs.readFileSync(path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();';
const E=new Function(source)();
const {N,ST,COLS,ROWS,DEN,ROCK,STARTS,EXTRA}=E;
const pairs=Math.max(1,+process.argv[2]||8);
const ms=Math.max(1,+process.argv[3]||8);
const initialSeed=(+process.argv[4]||2026102901)>>>0;
const cap=Math.max(1,+process.argv[5]||110);
const ZERO=[0,0,0,0,0,0,0,0,0,0];
const originalRandom=Math.random;

function rng(seed){
  let x=seed>>>0;
  return ()=>{x=(Math.imul(x,1664525)+1013904223)>>>0;return x/4294967296;};
}
function cloneLayout(){
  return {
    starts:Object.fromEntries(Object.keys(STARTS).map(k=>[k,STARTS[k].slice()])),
    extra:EXTRA.slice()
  };
}
function swapStarts(layout,a,b){
  const t=layout.starts[a];layout.starts[a]=layout.starts[b];layout.starts[b]=t;
}
const base=cloneLayout();
const candidates={};
function candidate(name,edit){const x=cloneLayout();edit(x);candidates[name]=x;}
candidate('rank7_forward_one_row',x=>swapStarts(x,7,2));
candidate('rank6_forward_one_row',x=>swapStarts(x,6,1));
candidate('rank3_boar_marsh_edge',x=>swapStarts(x,3,5));
candidate('extra_left_flank',x=>{x.extra=[7,0];});
candidate('extra_forward_left',x=>{x.extra=[6,0];});
candidate('elephant_other_ford',x=>swapStarts(x,8,3));

function validateLayout(layout){
  const seen=new Set();
  for(let r=1;r<=8;r++){
    const p=layout.starts[r];
    if(!p||p[0]<5||p[0]>8||p[1]<0||p[1]>=COLS)throw Error('Invalid start coordinate for rank '+r);
    const i=p[0]*COLS+p[1];
    if(seen.has(i)||ROCK[i]||DEN[i])throw Error('Overlapping/blocked start square for rank '+r+': '+p);
    seen.add(i);
  }
  const e=layout.extra, ei=e[0]*COLS+e[1];
  if(e[0]<5||e[0]>8||e[1]<0||e[1]>=COLS||seen.has(ei)||ROCK[ei]||DEN[ei])
    throw Error('Invalid extra-piece start: '+e);
}
Object.entries(candidates).forEach(([name,l])=>validateLayout(l));
validateLayout(base);

function lineUp(master){
  const s=ZERO.slice();
  for(let r=2;r<=7;r++)s[r]=master()<.5?0:1;
  s[9]=master()<1/3?0:(master()<.5?1:2);
  return s;
}
function makePosition(bottom,top,squad){
  E.SQ[0]=squad.slice();E.SQ[1]=squad.slice();E.setKeys();
  const c=new Int8Array(N+ST);
  for(let r=1;r<=8;r++){
    const bp=bottom.starts[r],tp=top.starts[r];
    c[bp[0]*COLS+bp[1]]=r;
    c[(ROWS-1-tp[0])*COLS+tp[1]]=-r;
  }
  if(squad[9]){
    c[bottom.extra[0]*COLS+bottom.extra[1]]=9;
    c[(ROWS-1-top.extra[0])*COLS+top.extra[1]]=-9;
  }
  return c;
}
function historyBan(moves,cells,side,hist){
  return moves.filter(m=>{
    const k=(m>>14)&15,t=(m>>7)&127;
    if(k===0&&DEN[t]===-side&&((m>>18)&127)===((m>>25)&127))return false;
    const next=Int8Array.from(cells);E.commitM(next,m);
    const h=E.hashOf(next,-side);
    return hist.filter(x=>x===h).length>=2;
  });
}
function play(candidateLayout,candidateSide,squad,seed){
  const bottom=candidateSide===1?candidateLayout:base;
  const top=candidateSide===-1?candidateLayout:base;
  E.setClassic(false);E.setAI(true);E.LEVELS[3].ms=ms;E.clearTT();
  const cells=makePosition(bottom,top,squad);
  let side=1,plies=0,hist=[E.hashOf(cells,1)];
  Math.random=rng(seed);
  while(plies<cap){
    const moves=E.genMoves(cells,side);
    if(!moves.length)return{winner:0,plies,reason:'no-moves'};
    const banned=historyBan(moves,cells,side,hist);
    if(banned.length===moves.length)return{winner:0,plies,reason:'repetition'};
    const result=E.search(cells,side,3,hist.slice(-14),banned);
    if(!result)return{winner:0,plies,reason:'no-result'};
    E.commitM(cells,result.m);
    plies++;
    if(result.k===0&&DEN[result.t]===-side)return{winner:side,plies,reason:'den'};
    const count=E.counts(cells);
    if((side>0&&count[1]===0)||(side<0&&count[0]===0))return{winner:side,plies,reason:'wipe'};
    side=-side;hist.push(E.hashOf(cells,side));
  }
  return{winner:0,plies,reason:'ply-cap'};
}
function initEval(candidateLayout,candidateSide,squad){
  const bottom=candidateSide===1?candidateLayout:base;
  const top=candidateSide===-1?candidateLayout:base;
  E.setClassic(false);E.setAI(true);
  const c=makePosition(bottom,top,squad);
  return E.evaluate(c)*candidateSide;
}
const result={
  seedPairs:pairs,gamesPerCandidate:pairs*2,thinkMs:ms,plyCap:cap,initialSeed,
  note:'Candidate placement is compared with the baseline; each paired squad plays from both sides. This is a screening experiment, not proof of a globally optimal setup.',
  currentStarts:base.starts,currentExtra:base.extra,candidates:{}
};
const master=rng(initialSeed);
const squads=Array.from({length:pairs},()=>lineUp(master));
try{
  for(const [name,layout] of Object.entries(candidates)){
    const st={games:0,wins:0,losses:0,draws:0,points:0,totalPlies:0,initialEval:0,reasons:{}};
    for(let i=0;i<pairs;i++){
      const squad=squads[i],seed=(initialSeed^Math.imul(i+1,0x9e3779b1))>>>0;
      for(const cs of [1,-1]){
        const score=initEval(layout,cs,squad);
        st.initialEval+=score;
        const r=play(layout,cs,squad,(seed^(cs===1?0xa341316c:0xc8013ea4))>>>0);
        st.games++;st.totalPlies+=r.plies;st.reasons[r.reason]=(st.reasons[r.reason]||0)+1;
        if(r.winner===cs){st.wins++;st.points+=1;}
        else if(r.winner===-cs){st.losses++;}
        else {st.draws++;st.points+=.5;}
      }
    }
    st.avgPlies=+(st.totalPlies/st.games).toFixed(1);
    st.pointsRate=+(st.points/st.games).toFixed(3);
    st.winRateDecisive=+(st.wins/Math.max(1,st.wins+st.losses)).toFixed(3);
    st.initialEvalMean=+(st.initialEval/st.games).toFixed(1);
    delete st.initialEval;
    result.candidates[name]=st;
  }
} finally {Math.random=originalRandom;}
console.log(JSON.stringify(result,null,2));
