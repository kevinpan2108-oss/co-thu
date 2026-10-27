const E=new Function(require('fs').readFileSync(require('path').join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
const {N,SL,ST,COLS}=E;const rc=(r,c)=>r*COLS+c;const Z=[0,0,0,0,0,0,0,0,0,0];
let fails=0,pass=0;const ok=(n,c)=>{if(c)pass++;else{fails++;console.log('FAIL',n);}};
E.SQ[0]=Z.slice();E.SQ[1]=Z.slice();E.setClassic(false);E.setOutCd(2);
const empty=()=>new Int8Array(N+ST);
const comp=ms=>ms.filter(m=>((m>>18)&127)!==((m>>25)&127));
const find=(ms,f,t,bonus)=>ms.find(m=>(m&127)===f&&((m>>7)&127)===t&&(bonus?((m>>18)&127)!==((m>>25)&127):((m>>18)&127)===((m>>25)&127)));
const cd=(c,s)=>E.outCd(c,s);
// scenario A: grant at T, off T+1, other piece T+2, arrive again T+3 => allowed
let c=empty();c[rc(3,0)]=4;c[rc(6,4)]=8;c[rc(2,4)]=-8;c[rc(1,7)]=-4;
let ms=E.genMoves(c,1);let m=comp(ms).find(x=>(x&127)===rc(3,0)&&((x>>7)&127)===rc(3,1)&&((x>>18)&127)===rc(6,4));
ok('T: compound available',!!m);E.commitM(c,m);ok('cd bottom=2',cd(c,1)===2);ok('cd top=0 (independent)',cd(c,-1)===0);
// top moves (decrements only its own)
let tm=E.genMoves(c,-1).find(x=>((x>>18)&127)===((x>>25)&127));E.commitM(c,tm);ok('top cd stays 0',cd(c,-1)===0&&cd(c,1)===2);
// T+1 dog leaves
ms=E.genMoves(c,1);let off=find(ms,rc(3,1),rc(3,0),false);ok('T+1 leave outpost exists',!!off);E.commitM(c,off);ok('cd=1 after T+1',cd(c,1)===1);
tm=E.genMoves(c,-1).find(x=>((x>>18)&127)===((x>>25)&127));E.commitM(c,tm);
// scenario B inside: T+2 arrival would be blocked
ms=E.genMoves(c,1);ok('T+2 arrival has NO compound (blocked)',comp(ms).length===0&&!!find(ms,rc(3,0),rc(3,1),false));
// T+2 other piece moves
const other=ms.find(x=>(x&127)!==rc(3,0)&&((x>>18)&127)===((x>>25)&127));E.commitM(c,other);ok('cd=0 after T+2',cd(c,1)===0);
tm=E.genMoves(c,-1).find(x=>((x>>18)&127)===((x>>25)&127));E.commitM(c,tm);
ms=E.genMoves(c,1);ok('T+3 arrival eligible again',!!find(ms,rc(3,0),rc(3,1),true));
// skipped bonus does not start cooldown
c=empty();c[rc(3,0)]=4;c[rc(6,4)]=8;c[rc(2,4)]=-8;ms=E.genMoves(c,1);E.commitM(c,find(ms,rc(3,0),rc(3,1),false));ok('skip: no cooldown',cd(c,1)===0);
// top side has its own outpost (5,1) and own cooldown
c=empty();c[rc(5,0)]=-4;c[rc(6,4)]=8;c[rc(2,4)]=-8;ms=E.genMoves(c,-1);m=find(ms,rc(5,0),rc(5,1),true);ok('top outpost compound',!!m);E.commitM(c,m);ok('top cd=2,bottom 0',cd(c,-1)===2&&cd(c,1)===0);
// classic: no outposts bonus & no cd
E.setClassic(true);c=empty();c[rc(3,0)]=4;ok('classic none',comp(E.genMoves(c,1)).length===0);E.setClassic(false);
// make/unmake keeps cooldown state consistent in search
c=empty();c[rc(3,0)]=4;c[rc(6,4)]=8;c[rc(2,4)]=-8;const snap=Int8Array.from(c);
const r=E.search(c,1,3,[],[]);ok('search ok',!!r);ok('search leaves board untouched',snap.every((v,i)=>v===c[i]));
// hash differs with cooldown
c=empty();c[rc(6,4)]=8;const h0=E.hashOf(c,1);c[SL+8]=2;ok('hash includes outpost cooldown',E.hashOf(c,1)!==h0);
// win conditions: den, wipe (only turtle), stalemate draw
E.SQ[0][9]=0;E.SQ[1][9]=2;E.setKeys();c=empty();c[rc(1,4)]=4;ok('den entry move',E.genMoves(c,1).some(x=>((x>>7)&127)===E.DENFOE));
c=empty();c[rc(2,2)]=-9;c[rc(5,5)]=3;ok('only-turtle counts as none',E.counts(c)[0]===1&&E.counts(c)[1]===0);
E.SQ[1][9]=0;E.setKeys();
c=empty();c[rc(0,0)]=-4;c[rc(1,0)]=8;c[rc(0,1)]=8;ok('stalemate: no moves for top',E.genMoves(c,-1).length===0);
ok('stalemate eval draw',E.negamax(c,-1,2,-1e5,1e5)===0);
console.log('t16 pass',pass,'fail',fails);
