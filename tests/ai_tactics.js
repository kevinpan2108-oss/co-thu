/* Kiem thu chien thuat AI chat che hon (thay cho bai 'Voi an Su tu' da noi long):
   (1) Nuoc thang ngay (vao hang) PHAI duoc choi -- nghiem ngat, tren moi vi tri mau.
   (2) Nuoc bat quan ro rang co loi: neu co nuoc bat quan m* ma gia tri tim kiem (do sau 3, bat bien) lon hon nuoc tot nhat
       khong bat quan > MARGIN, thi nuoc AI chon phai co gia tri >= v(m*) - TOL. Khong ep AI bat quan khi co nuoc tot hon.
   (3) Chong nhay: chay lai bo kiem tra voi 'AI ngu' (nuoc ngau nhien hop le) -- bo kiem tra PHAI bat duoc no, neu khong test vo nghia.
   Vi tri mau lay tu cac van choi co hat giong co dinh. */
const fs=require('fs'),path=require('path');
const E=new Function(fs.readFileSync(process.env.ENGINE||path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
const {N,ST,COLS}=E; const Z=[0,0,0,0,0,0,0,0,0,0];
let seed=20261028; const R=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
let rs=12345; Math.random=()=>{rs^=rs<<13;rs>>>=0;rs^=rs>>>17;rs^=rs<<5;rs>>>=0;return rs/4294967296;};
/* The corrected root-search window is always active. */ E.LEVELS[3].depth=+process.env.AIDEPTH||3; E.LEVELS[3].ms=1e6; E.LEVELS[2].depth=2; E.LEVELS[2].ms=1e6;
const DEPTH=3, MARGIN=150, TOL=60;
let pass=0,fails=0; const ok=(n,c)=>{if(c)pass++;else{fails++;console.log('FAIL',n);}};
const value=(c,side,m)=>{ const x=Int8Array.from(c); const cap=E.makeM(x,m); E.probe(x,-side);
  const cn=E.counts(x); if((side>0&&cn[1]===0)||(side<0&&cn[0]===0)) return 99999;
  return -E.negamax(x,-side,DEPTH-1,-1e9,1e9)*1; };
const isCap=(c,m)=>{const t=(m>>7)&127,k=(m>>14)&15; return k!==5&&c[t]!==0; };
const isWin=(c,side,m)=>((m>>14)&15)===0&&E.DEN[(m>>7)&127]===-side;
// thu thap vi tri mau
function samples(n){
  const out=[];
  for(let g=0;out.length<n&&g<40;g++){
    E.setClassic(false); const sq=Z.slice(); for(let r=2;r<=7;r++)sq[r]=R()*2|0; sq[9]=R()*3|0; E.SQ[0]=sq.slice(); E.SQ[1]=sq.slice(); E.setKeys(); E.clearTT();
    let c=E.initialCells(),side=1;
    for(let i=0;i<110&&out.length<n;i++){
      const all=E.genMoves(c,side); if(!all.length) break;
      if(i>12&&all.some(m=>isCap(c,m)||isWin(c,side,m))&&R()<.5) out.push({c:Int8Array.from(c),side,sq:sq.slice()});
      const r=(R()<.7)?E.search(c,side,2,[],[]):null; const m=r?r.m:all[(R()*all.length)|0];
      E.commitM(c,m); if(E.DEN[(m>>7)&127]===-side&&((m>>14)&15)===0) break; side=-side;
    }
  }
  return out;
}
function check(pos,pick){
  const all=E.genMoves(pos.c,pos.side); let res={win:null,cap:null};
  const wins=all.filter(m=>isWin(pos.c,pos.side,m));
  const m=pick(pos,all);
  if(wins.length) res.win=wins.indexOf(m)>=0;
  const caps=all.filter(x=>isCap(pos.c,x)); if(!caps.length) return res;
  const vs=new Map(all.map(x=>[x,value(pos.c,pos.side,x)]));
  const bestCap=Math.max(...caps.map(x=>vs.get(x))); const non=all.filter(x=>!isCap(pos.c,x)); const bestNon=non.length?Math.max(...non.map(x=>vs.get(x))):-1e9;
  if(bestCap>bestNon+MARGIN){ res.cap=vs.get(m)>=bestCap-TOL; if(!res.cap&&process.env.DBG) console.log('MISS side',pos.side,'AI move',m&127,(m>>7)&127,'k',(m>>14)&15,'v(AI)=',Math.round(vs.get(m)),'bestCap=',Math.round(bestCap),'bestNon=',Math.round(bestNon),'ncaps',caps.length);
    if(!res.cap&&process.env.DBG2&&!global.__done){ global.__done=1; require('fs').writeFileSync('/tmp/claude-0/-home-claude/f87ce562-7b16-5182-b0f9-97ac72b036d5/scratchpad/missed.json',JSON.stringify({c:Array.from(pos.c),side:pos.side,sq:pos.sq})); const tab={}; for(let q=0;q<30;q++){E.clearTT();const r=E.search(pos.c,pos.side,3,[],[]);const key=r.f+'>'+r.t+' k'+r.k;tab[key]=(tab[key]||0)+1;} console.log('repeat search distribution',JSON.stringify(tab)); const tab2={}; for(let q=0;q<30;q++){const r=E.search(pos.c,pos.side,3,[],[]);const key=r.f+'>'+r.t+' k'+r.k;tab2[key]=(tab2[key]||0)+1;} console.log('without clearTT',JSON.stringify(tab2)); }
    if(!res.cap&&process.env.DBG){ const capm=caps.reduce((b,x)=>vs.get(x)>vs.get(b)?x:b,caps[0]); E.clearTT(); const r1=E.search(pos.c,pos.side,3,[],[]); E.clearTT(); const r2=E.search(pos.c,pos.side,3,[],all.filter(x=>x!==capm)); console.log('   AI search:',r1.f,r1.t,'score',Math.round(r1.score),'depth',r1.depth,'| forced capture',capm&127,(capm>>7)&127,'k',(capm>>14)&15,'bf',(capm>>18)&127,(capm>>25)&127,'score',Math.round(r2.score),'depth',r2.depth); } }
  return res;
}
const aiPick=(pos,all)=>{E.setClassic(false);E.SQ[0]=pos.sq.slice();E.SQ[1]=pos.sq.slice();E.setKeys();E.clearTT();const r=E.search(pos.c,pos.side,3,[],[]);return r.m;};
const dumbPick=(pos,all)=>all[(R()*all.length)|0];
const S=samples(+process.argv[2]||60);
function run(label,pick){
  let wins=0,winMiss=0,caps=0,capMiss=0;
  S.forEach(p=>{E.SQ[0]=p.sq.slice();E.SQ[1]=p.sq.slice();E.setKeys();const r=check(p,pick); if(r.win!==null){wins++;if(!r.win)winMiss++;} if(r.cap!==null){caps++;if(!r.cap)capMiss++;}});
  console.log(label,'| vi tri:',S.length,'| co nuoc thang ngay:',wins,'bo lo:',winMiss,'| co nuoc bat ro rang co loi:',caps,'bo lo:',capMiss);
  return {wins,winMiss,caps,capMiss};
}
// (1b) nuoc thang ngay thu cong (bat buoc, moi cap do, ca hai phe), kem cac nuoc bat quan gay xao nhang
{ const cases=[
    [[1,4,4],[5,5,7],[5,6,-3],[8,0,3],[0,8,-3]],        // Cho canh hang, Su tu co the an Soi o noi khac
    [[0,3,1],[5,4,8],[5,5,-1],[8,8,3],[0,8,-3]],        // Chuot vao hang tu o bay, Chuot dich co the an Voi
    [[1,4,8],[2,4,-1],[7,0,3],[0,8,-3]],                // Voi vao hang, Chuot dich ke ben
    [[0,5,2],[4,3,6],[4,2,-1],[8,8,3],[0,0,-3]] ];      // Meo o canh hang
  let n=0,missed=0;
  [0,1].forEach(mir=>{ cases.forEach(pcs=>{ [1,2,3,4,5].forEach(level=>{
    E.setClassic(false); E.SQ[0]=Z.slice(); E.SQ[1]=Z.slice(); E.setKeys(); E.clearTT();
    const c=new Int8Array(N+ST); pcs.forEach(p=>{c[(mir?8-p[0]:p[0])*COLS+p[1]]=p[2]*(mir?-1:1);});
    const side=mir?-1:1; const r=E.search(c,side,level,[],[]); n++;
    if(!(r&&((r.k===0)&&E.DEN[r.t]===-side))) { missed++; console.log('  bo lo thang ngay: cap do',level,'phe',side,'quan',JSON.stringify(pcs)); } }); }); });
  ok('Nuoc thang ngay thu cong: khong bo lo ('+n+' tinh huong, cap do 1-5, hai phe)',n>0&&missed===0); }
const a=run('AI cap 3',aiPick);
ok('AI khong bo lo nuoc thang ngay',a.winMiss===0);
ok('AI khong bo qua nuoc bat quan ro rang co loi (>= 1 tinh huong duoc kiem tra)',a.caps>=1&&a.capMiss===0);
const d=run('AI ngu (nuoc ngau nhien)',dumbPick);
ok('chong nhay: bo kiem tra bat duoc AI ngu bo lo thang ngay hoac bat quan',d.winMiss+d.capMiss>=1);
console.log('ai_tactics pass',pass,'fail',fails); process.exit(fails?1:0);
