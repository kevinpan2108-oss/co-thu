/* Kiem tra ban do bui E4/E6: bo tri, doi xung hai phe (sinh nuoc di + danh gia tren cac the ngau nhien), luat lach cheo. */
const fs=require('fs'),path=require('path');
const E=new Function(fs.readFileSync(path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
const {N,ST,COLS,ROWS,BUSH,WATER,ROCK,DEN,SL}=E;
let pass=0,fails=0;const ok=(n,c)=>{if(c)pass++;else{fails++;console.log('FAIL',n);}};
const at=(r,c)=>r*COLS+c;
// --- bo tri (E4/E6: cot E = chi so 4, hang 4 = chi so 3; hang 6 = chi so 5; I = cot 8)
ok('E4 la bui',BUSH[at(3,4)]===1);ok('E6 la bui',BUSH[at(5,4)]===1);
ok('I4 khong con la bui',BUSH[at(3,8)]===0);ok('I6 khong con la bui',BUSH[at(5,8)]===0);
ok('tong 8 o bui',BUSH.reduce((a,b)=>a+b,0)===8);
let sym=true;for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const m=at(ROWS-1-r,c),i=at(r,c);if(BUSH[i]!==BUSH[m]||WATER[i]!==WATER[m]||ROCK[i]!==ROCK[m]||DEN[i]!==-DEN[m]||E.TRAP[i]!==-E.TRAP[m]||E.OUTPOST[i]!==E.OUTPOST[m]||E.MARSH[i]!==E.MARSH[m]||E.BRIDGE[i]!==E.BRIDGE[m])sym=false;}
ok('ban do doi xung qua hang giua (bui, song, da, hang, bay, tien don, dam lay, cau)',sym);
ok('E4/E6 khong nam trong song/da/hang',![at(3,4),at(5,4)].some(i=>WATER[i]||ROCK[i]||DEN[i]));
// --- luat lach cheo tai tung o bui: dung chi cheo, o trong, khong nuoc/da/hang, khong an quan, khong thay buoc thang
for(let b=0;b<N;b++){if(!BUSH[b])continue;const r=(b/COLS)|0,c=b%COLS;
  for(const sg of [1,-1]){E.setClassic(false);E.SQ[0]=Array(10).fill(0);E.SQ[1]=Array(10).fill(0);E.setKeys();
    const cells=new Int8Array(N+ST);cells[b]=3*sg;
    const sl=E.genMoves(cells,sg).filter(m=>(m&127)===b&&((m>>14)&15)===10&&((m>>18)&127)===((m>>25)&127));
    const exp=[];for(const dr of[-1,1])for(const dc of[-1,1]){const nr=r+dr,nc=c+dc;if(nr<0||nr>=ROWS||nc<0||nc>=COLS)continue;const t=at(nr,nc);if(!WATER[t]&&!DEN[t]&&!ROCK[t])exp.push(t);}
    ok('bui '+r+','+c+' sg'+sg+': dung tap o lach',JSON.stringify(sl.map(m=>(m>>7)&127).sort((a,b)=>a-b))===JSON.stringify(exp.sort((a,b)=>a-b)));
    // khong an quan: dat dich o moi o cheo
    const c2=Int8Array.from(cells);exp.forEach(t=>{c2[t]=-1*sg;});
    ok('bui '+r+','+c+' sg'+sg+': khong lach de an quan',!E.genMoves(c2,sg).some(m=>(m&127)===b&&((m>>14)&15)===10));
  }}
// --- doi xung hai phe tren the ngau nhien
const mirror=a=>{const o=new Int8Array(a.length);for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)o[at(ROWS-1-r,c)]=-a[at(r,c)];
  for(let j=0;j<ST;j++){let v=a[SL+j];if(j>=12&&v>0){const q=v-1;v=at(ROWS-1-((q/COLS)|0),q%COLS)+1;}o[SL+(j^1)]=v;}return o;};
let seed=20261031;const R=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const canon=(ms,fn)=>ms.map(fn).sort((a,b)=>a-b).join(',');
const mcell=i=>at(ROWS-1-((i/COLS)|0),i%COLS);
const mm=m=>{const f=m&127,t=(m>>7)&127,k=(m>>14)&15,bf=(m>>18)&127,bt=(m>>25)&127;if(bf===bt)return mcell(f)|(mcell(t)<<7)|(k<<14);return mcell(f)|(mcell(t)<<7)|(k<<14)|(mcell(bf)<<18)|(mcell(bt)<<25);};
let posChecked=0,asymm=0,evalAsym=0;
for(let g=0;g<60;g++){
  E.setClassic(false);const sq=Array(10).fill(0);for(let r=2;r<=7;r++)sq[r]=R()*2|0;sq[9]=R()*3|0;E.SQ[0]=sq.slice();E.SQ[1]=sq.slice();E.setKeys();E.clearTT&&E.clearTT();
  let c=E.initialCells(),side=1;
  for(let p=0;p<90;p++){
    const ms=E.genMoves(c,side);if(!ms.length)break;
    const mc=mirror(c),mms=E.genMoves(mc,-side);posChecked++;
    if(canon(ms,mm)!==canon(mms,x=>x))asymm++;
    if(Math.abs(E.evaluate(c)+E.evaluate(mc))>1e-6){evalAsym++;if(process.env.DBG&&evalAsym<4)console.log('EVAL',E.evaluate(c),E.evaluate(mc),[...c.slice(0,81)].map((v,i)=>v?i+':'+v:'').filter(Boolean).join(' '));}
    const m=ms[(R()*ms.length)|0];E.commitM(c,m);
    if(E.DEN[(m>>7)&127]===-side&&((m>>14)&15)===0)break;
    side=-side;
  }}
ok('sinh nuoc di doi xung qua guong ('+posChecked+' the, lech '+asymm+')',asymm===0);
ok('ham danh gia doi xung qua guong (lech '+evalAsym+')',evalAsym===0);
console.log('PASS',pass,'FAIL',fails);process.exit(fails?1:0);
