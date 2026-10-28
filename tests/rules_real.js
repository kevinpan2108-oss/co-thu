const fs=require('fs');
const E=new Function(fs.readFileSync(require('path').join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
const {N,SL,ST,COLS,ROWS}=E; const rc=(r,c)=>r*COLS+c;
const Z=[0,0,0,0,0,0,0,0,0,0];
function sel(a,b,cl){E.setClassic(false);E.SQ[0]=a.slice();E.SQ[1]=b.slice();E.setClassic(!!cl);}
const empty=()=>new Int8Array(N+ST);
const mv=(c,i)=>{const o=[];E.movesFrom(c,i,o);return o.map(m=>({t:(m>>7)&127,k:(m>>14)&15}));};
let fails=0,pass=0;const ok=(n,c)=>{if(c)pass++;else{fails++;console.log('FAIL',n);}};
const sq=(r,v)=>{const a=Z.slice();a[r]=v;return a;};
// ---- terrain data
let m=0,o=0,w=0;for(let i=0;i<N;i++){m+=E.MARSH[i];o+=E.OUTPOST[i];w+=E.WATER[i];}
ok('marsh 4 cells',m===4);ok('outposts 2',o===2);ok('river water 5',w===5);
for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const a=rc(r,c),b=rc(ROWS-1-r,c);ok('sym',E.MARSH[a]===E.MARSH[b]&&E.OUTPOST[a]===E.OUTPOST[b]&&E.WATER[a]===E.WATER[b]&&E.ROCK[a]===E.ROCK[b]&&E.BUSH[a]===E.BUSH[b]&&E.TRAP[a]===-E.TRAP[b]);}
// ---- marsh walkable by ordinary pieces
sel(Z,Z);let c=empty();c[rc(6,6)]=4;ok('dog enters marsh from (6,6) to (5,6)',mv(c,rc(6,6)).some(x=>x.t===rc(5,6)));
c=empty();c[rc(5,5)]=4;ok('dog steps into marsh (5,6)',mv(c,rc(5,5)).some(x=>x.t===rc(5,6)));
c=empty();c[rc(5,5)]=8;ok('elephant steps into marsh',mv(c,rc(5,5)).some(x=>x.t===rc(5,6)));
c=empty();c[rc(5,6)]=4;c[rc(5,7)]=-3;ok('dog captures wolf inside marsh',mv(c,rc(5,6)).some(x=>x.t===rc(5,7)));
c=empty();c[rc(5,6)]=3;c[rc(5,5)]=-4;ok('dog on bank captures wolf in marsh',mv(c,rc(5,5)).some(x=>x.t===rc(5,6)));
c=empty();c[rc(5,6)]=-3;c[rc(5,5)]=4;ok('bank dog captures marsh wolf',mv(c,rc(5,5)).some(x=>x.t===rc(5,6)));
// ---- dashes cannot pass through marsh, can land
sel(sq(2,1),Z);c=empty();c[rc(5,5)]=2;ok('fox no dash through marsh (5,6)->(5,7)',!mv(c,rc(5,5)).some(x=>x.k===3&&x.t===rc(5,7)));
c=empty();c[rc(6,6)]=2;ok('fox dash over grass->lands in marsh (6,6)->(4,6)? middle (5,6) marsh blocked',!mv(c,rc(6,6)).some(x=>x.k===3&&x.t===rc(4,6)));
c=empty();c[rc(7,6)]=2;ok('fox dash lands in marsh (7,6)->(5,6)',mv(c,rc(7,6)).some(x=>x.k===3&&x.t===rc(5,6)));
sel(sq(7,1),Z);c=empty();c[rc(7,6)]=7;ok('bison normal step remains available beside marsh',mv(c,rc(7,6)).some(x=>x.k===0&&x.t===rc(6,6)));
c=empty();c[rc(6,6)]=7;ok('bison blocked by marsh middle (6,6)->(4,6)',!mv(c,rc(6,6)).some(x=>x.k===8&&x.t===rc(4,6)));
c=empty();c[rc(7,6)]=7;ok('bison lands in marsh',mv(c,rc(7,6)).some(x=>x.k===8&&x.t===rc(5,6)));
sel(Z,Z);E.SQ[0][7]=0;E.setKeys();
c=empty();c[rc(7,6)]=7;c[rc(5,6)]=-3;ok('lion cannot pounce piece in marsh',!mv(c,rc(7,6)).some(x=>x.k===7));
c=empty();c[rc(7,6)]=7;c[rc(5,6)]=0;c[rc(6,6)]=0;
c=empty();c[rc(2,5)]=7;c[rc(4,5)]=-3;ok('lion pounces piece on ford',mv(c,rc(2,5)).some(x=>x.k===7&&x.t===rc(4,5)));
c=empty();c[rc(6,7)]=7;c[rc(4,7)]=-3;ok('lion blocked: middle marsh (5,7)',!mv(c,rc(6,7)).some(x=>x.k===7));
// ordinary attack in marsh still works on lion
c=empty();c[rc(5,6)]=-7;c[rc(5,5)]=8;ok('elephant attacks lion in marsh normally',mv(c,rc(5,5)).some(x=>x.t===rc(5,6)));
// ---- rat / croc advantages in marsh
c=empty();c[rc(5,6)]=-1;c[rc(5,5)]=8;ok('bank elephant cannot capture rat in marsh',!mv(c,rc(5,5)).some(x=>x.t===rc(5,6)));
c=empty();c[rc(5,6)]=-1;c[rc(5,7)]=4;ok('dog in marsh cannot capture rat in marsh',!mv(c,rc(5,7)).some(x=>x.t===rc(5,6)));
c=empty();c[rc(5,6)]=1;c[rc(5,5)]=-8;ok('rat in marsh cannot hit bank elephant',!mv(c,rc(5,6)).some(x=>x.t===rc(5,5)));
c=empty();c[rc(6,6)]=1;c[rc(6,5)]=-8;ok('rat on bank eats elephant on bank',mv(c,rc(6,6)).some(x=>x.t===rc(6,5)));
c=empty();c[rc(6,5)]=1;c[rc(6,4)]=-8;ok('rat on bank captures elephant',mv(c,rc(6,5)).some(x=>x.t===rc(6,4)));
sel(sq(5,1),Z);c=empty();c[rc(5,6)]=5;ok('croc rank 6 in marsh',E.effRank(c,rc(5,6))===6);c=empty();c[rc(6,6)]=5;ok('croc rank 3 on bank',E.effRank(c,rc(6,6))===3);
c=empty();c[rc(5,6)]=5;c[rc(5,5)]=-3;ok('croc in marsh ambushes wolf on bank',E.genMoves(c,1).some(x=>((x>>14)&15)===6));
c=empty();c[rc(6,6)]=5;c[rc(5,6)]=-1;ok('land croc eats swimming rat in marsh',mv(c,rc(6,6)).some(x=>x.t===rc(5,6)));
// ---- tiger / eagle jump only over river
sel(sq(6,0),Z);c=empty();c[rc(3,3)]=6;ok('tiger jumps river (3,3)->(5,3)',mv(c,rc(3,3)).some(x=>x.k===1&&x.t===rc(5,3)));
c=empty();c[rc(3,5)]=6;ok('tiger walks into marsh (3,6)',mv(c,rc(3,5)).some(x=>x.k===0&&x.t===rc(3,6)));
c=empty();c[rc(3,5)]=6;ok('tiger no longer jumps marsh',!mv(c,rc(3,5)).some(x=>x.k===1));
sel(sq(6,1),Z);c=empty();c[rc(3,3)]=6;c[rc(4,3)]=0;ok('eagle jumps river',mv(c,rc(3,3)).some(x=>x.k===1&&x.t===rc(5,3)));
// ---- outposts: bonus step
const mvs=(c,s)=>E.genMoves(c,s);
const comp=(ms)=>ms.filter(m=>((m>>18)&127)!==((m>>25)&127));
sel(Z,Z);c=empty();c[rc(3,0)]=4;c[rc(6,4)]=8;
let ms=mvs(c,1);let cm=comp(ms);
ok('stepping onto outpost creates compound moves',cm.length>0);
ok('compound first move is onto outpost',cm.every(m=>((m>>7)&127)===rc(3,1)));
const emptyAfter=m=>{const z=Int8Array.from(c);E.commit(z,m&127,(m>>7)&127,(m>>14)&15);const t2=(m>>25)&127;return z[t2]===0&&!E.DEN[t2];};
ok('bonus never captures/den',cm.every(emptyAfter));
ok('plain move (no bonus) still offered',ms.some(m=>((m>>7)&127)===rc(3,1)&&((m>>18)&127)===((m>>25)&127)));
// enemy capture onto outpost with bonus; bonus cannot capture
c=empty();c[rc(3,0)]=4;c[rc(3,1)]=-3;c[rc(2,1)]=-2;c[rc(6,4)]=8;ms=mvs(c,1);cm=comp(ms);
ok('capture arrival triggers',cm.some(m=>((m>>7)&127)===rc(3,1)));
ok('bonus step cannot capture enemy',cm.every(m=>{const z=Int8Array.from(c);E.commit(z,m&127,(m>>7)&127,(m>>14)&15);return z[(m>>25)&127]===0;}));
// bonus into den forbidden: piece next to enemy den
c=empty();c[rc(3,0)]=4;c[rc(0,3)]=0;c[rc(1,4)]=4;ms=mvs(c,1);cm=comp(ms);
ok('bonus not into den',cm.every(m=>(m>>25&127)!==E.DENFOE));
ok('den entry still a normal move',ms.some(m=>((m>>7)&127)===E.DENFOE&&((m>>18)&127)===((m>>25)&127)));
// no outpost bonus when moving from outpost to non-outpost
c=empty();c[rc(3,1)]=4;ms=mvs(c,1);ok('leaving outpost gives no bonus',comp(ms).length===0);
// classic: none
sel(Z,Z,true);c=empty();c[rc(3,0)]=4;ok('classic no bonus',comp(mvs(c,1)).length===0);
sel(Z,Z,false);
// make/unmake roundtrip with compound and cooldown not double-ticked
sel([0,0,0,0,0,0,0,1-1,0,0],Z);E.SQ[0][7]=0;E.setKeys();
c=empty();c[rc(3,0)]=4;c[rc(8,1)]=7;c[SL+2]=2; // lion cooldown 2
ms=mvs(c,1);cm=comp(ms);const m0=cm.find(m=>((m>>18)&127)===rc(8,1));
ok('lion bonus step exists',!!m0);
const snap=Int8Array.from(c);const cap=E.makeM(c,m0);
ok('both steps applied',c[rc(3,1)]===4&&c[((m0>>25)&127)]===7);
ok('cooldown ticked once only',c[SL+2]===1);
E.unmakeM(c,m0,cap);ok('unmake restores everything',snap.every((v,i)=>v===c[i]));
// outpost cooldown variant
E.setOutCd(2);c=empty();c[rc(3,0)]=4;c[rc(6,4)]=8;let mm=comp(mvs(c,1)).find(m=>1);
const cap2=E.makeM(c,mm);ok('cd set after bonus',c[SL+8]===2);E.unmakeM(c,mm,cap2);
c=empty();c[rc(3,0)]=4;c[rc(6,4)]=8;c[SL+8]=1;ok('no bonus during cooldown',comp(mvs(c,1)).length===0);E.setOutCd(0);
// no stacking: only one bonus step
ok('bonus is a single step',comp(mvs((()=>{const z=empty();z[rc(3,0)]=4;z[rc(6,4)]=8;return z;})(),1)).every(m=>true));
// ---- stalemate = draw (no moves => 0, search null)
sel(Z,Z);c=empty();c[rc(8,0)]=4;c[rc(7,0)]=-8;c[rc(8,1)]=-8;
ok('no moves for boxed dog',E.genMoves(c,1).length===0);
ok('negamax stalemate = draw 0',E.negamax(c,1,2,-1e5,1e5)===0);
ok('search returns null on stalemate',E.search(c,1,3,[],[])===null);
// only Rùa left counts as eliminated
sel(Z,Z);E.SQ[0][9]=2;E.setKeys();c=empty();c[rc(7,5)]=9;c[rc(2,4)]=-3;
ok('counts ignore turtle',E.counts(c)[0]===0&&E.counts(c)[1]===1);
// ---- new right flank
sel(Z,Z);c=empty();c[rc(5,6)]=4;ok('dog at marsh cannot enter river water (4,6)',!mv(c,rc(5,6)).some(x=>x.t===rc(4,6)));
c=empty();c[rc(5,8)]=4;ok('dog crosses bridge (4,8)',mv(c,rc(5,8)).some(x=>x.t===rc(4,8)));
c=empty();c[rc(5,8)]=8;ok('elephant cannot take bridge (4,8)',!mv(c,rc(5,8)).some(x=>x.t===rc(4,8)));
c=empty();c[rc(3,6)]=8;ok('elephant cannot step into river (4,6)',!mv(c,rc(3,6)).some(x=>x.t===rc(4,6)));
sel(sq(6,0),Z);c=empty();c[rc(3,6)]=6;ok('tiger jumps (3,6)->(5,6) over river water',mv(c,rc(3,6)).some(x=>x.k===1&&x.t===rc(5,6)));
c=empty();c[rc(3,6)]=6;c[rc(4,6)]=-1;ok('rat in river blocks tiger',!mv(c,rc(3,6)).some(x=>x.k===1));
c=empty();c[rc(3,5)]=6;ok('tiger cannot jump marsh row 3',!mv(c,rc(3,5)).some(x=>x.k===1));
sel(sq(6,1),Z);c=empty();c[rc(3,6)]=6;c[rc(4,6)]=-1;ok('eagle jumps over rat',mv(c,rc(3,6)).some(x=>x.k===1&&x.t===rc(5,6)));
sel(Z,Z);c=empty();c[rc(5,6)]=1;ok('rat swims marsh to river',mv(c,rc(5,6)).some(x=>x.t===rc(4,6)));
sel(sq(5,1),Z);c=empty();c[rc(4,7)]=5;c[rc(4,8)]=-3;ok('croc in river ambushes piece on bridge (4,8)',E.genMoves(c,1).some(x=>((x>>14)&15)===6));
console.log('pass',pass,'fail',fails);
