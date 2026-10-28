const fs=require('fs'),path=require('path');
const E=new Function(fs.readFileSync(path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
const {N,ST,COLS,OUTPOST}=E;
const empty=()=>new Int8Array(N+ST);
let pass=0,fail=0;
const ok=(name,condition)=>{if(condition)pass++;else{fail++;console.log('FAIL',name);}};
const evalDelta=cells=>{E.setAI(false);const base=E.evaluate(cells);E.setAI(4);return E.evaluate(cells)-base;};
const outposts=[];for(let i=0;i<N;i++)if(OUTPOST[i])outposts.push(i);
ok('map has two outposts',outposts.length===2);
if(outposts.length===2){
  const outpost=outposts[0], adjacent=outpost-COLS;
  let cells=empty();cells[outpost]=4;
  const safeOccupied=evalDelta(cells);
  ok('safe friendly occupation earns a positive bonus',safeOccupied>0);

  cells=empty();cells[outpost]=-4;
  const enemyOccupied=evalDelta(cells);
  ok('enemy occupation is negative for the bottom side',enemyOccupied<0);

  cells=empty();cells[adjacent]=4;
  const approach=evalDelta(cells);
  ok('approaching an empty outpost has a positive bonus',approach>0);
  ok('safe occupation is valued above approach',safeOccupied>approach);

  cells=empty();cells[outpost]=4;cells[adjacent]=-8;
  const contested=evalDelta(cells);
  ok('a threatened outpost holder loses part of the holding bonus',contested<safeOccupied);

  console.log('outpost-ai metrics',JSON.stringify({safeOccupied,enemyOccupied,approach,contested}));
}
console.log('outpost-ai pass',pass,'fail',fail);
process.exit(fail?1:0);
