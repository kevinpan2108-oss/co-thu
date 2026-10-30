/* Thu nghiem nuoc cheo tu lau say co the an quan. */
const fs=require('fs'),path=require('path');
const E=new Function(fs.readFileSync(path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
const {N,ST,COLS,ROWS}=E, Z=[0,0,0,0,0,0,0,0,0,0];
let pass=0,fail=0;
const ok=(n,v)=>{if(v)pass++;else{fail++;console.log('FAIL',n);}};
function setup(mirror){
  E.setClassic(false); E.setReedCapture(true);
  const sq=Z.slice(); sq[2]=0; sq[3]=0; sq[4]=0;
  E.SQ[0]=sq.slice(); E.SQ[1]=sq.slice(); E.setKeys();
  const cells=new Int8Array(N+ST), sg=mirror?-1:1;
  const row=r=>mirror?ROWS-1-r:r, I=(r,c)=>row(r)*COLS+c;
  cells[I(2,1)]=3*sg; cells[I(1,0)]=-2*sg;
  return {cells,sg,I};
}
for(const mirror of [false,true]){
  const {cells,sg,I}=setup(mirror), moves=E.genMoves(cells,sg);
  const m=moves.find(x=>(x&127)===I(2,1)&&((x>>7)&127)===I(1,0)&&((x>>14)&15)===10);
  ok('cho phep an quan bang buoc cheo '+(mirror?'phe tren':'phe duoi'),!!m);
  if(m){ E.commitM(cells,m); ok('quan tan cong chiem o dich, quan bi an bien mat',cells[I(1,0)]===3*sg&&cells[I(2,1)]===0); }
  const off=setup(mirror); E.setReedCapture(false);
  const no=E.genMoves(off.cells,off.sg).some(x=>(x&127)===off.I(2,1)&&((x>>7)&127)===off.I(1,0)&&((x>>14)&15)===10);
  ok('tat thu nghiem thi khong an duoc',!no);
}
E.setReedCapture(true);
{
  const {cells,sg,I}=setup(false); cells[I(1,0)]=sg*2;
  ok('khong an quan dong minh',!E.genMoves(cells,sg).some(x=>(x&127)===I(2,1)&&((x>>7)&127)===I(1,0)&&((x>>14)&15)===10));
}
{
  const {cells,sg,I}=setup(false); cells[I(1,0)]=-sg*8;
  ok('van ap dung gioi han cap bac',!E.genMoves(cells,sg).some(x=>(x&127)===I(2,1)&&((x>>7)&127)===I(1,0)&&((x>>14)&15)===10));
}
{
  const sq=Z.slice();sq[4]=0;E.SQ[0]=sq.slice();E.SQ[1]=sq.slice();E.setKeys();
  const cells=new Int8Array(N+ST),sg=1,I=(r,c)=>r*COLS+c;cells[I(2,2)]=3;cells[I(1,2)]=-4;
  ok('Dog lock van vo hieu hoa buoc cheo',!E.genMoves(cells,sg).some(x=>(x&127)===I(2,2)&&((x>>14)&15)===10));
}
console.log('reed capture tests',pass,'pass',fail,'fail');
process.exit(fail?1:0);
