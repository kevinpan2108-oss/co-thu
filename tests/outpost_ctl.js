/* Kiem thu che do tien don THU NGHIEM 'kiem soat' (OUTMODE=1). Moi kich ban chay cho CA HAI PHE (guong doc).
   Luat: giu 1 quan tren tien don den het luot cua minh; sau 2 luot lien lien con giu -> 1 buoc thuong (quan cot 0-2, 1 o thuong,
   khong an, khong vao hang, khong chieu). Mat chot -> tien trinh ve 0. Khong cong don. Cham roi di khong duoc thuong. */
const fs=require('fs'),path=require('path');
const E=new Function(fs.readFileSync(path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
const {N,ST,SL,COLS,ROWS}=E; const Z=[0,0,0,0,0,0,0,0,0,0];
let pass=0,fails=0; const ok=(n,c)=>{if(c)pass++;else{fails++;console.log('FAIL',n);}};
E.setOutMode(1);
function scn(name,sqv,pieces,fn){
  [0,1].forEach(mir=>{
    E.setClassic(false); E.setOutMode(1); const a=Z.slice(); Object.keys(sqv).forEach(k=>a[k]=sqv[k]); E.SQ[0]=a.slice(); E.SQ[1]=a.slice(); E.setKeys(); E.clearTT();
    const sg=mir?-1:1, R=r=>mir?ROWS-1-r:r, I=(r,c)=>R(r)*COLS+c;
    const cells=new Int8Array(N+ST); pieces.forEach(p=>{cells[I(p[0],p[1])]=p[2]*sg;});
    const tag=mir?' [phe tren]':' [phe duoi]';
    const prog=side=>E.ctlProgress(cells,side);
    const gen=side=>E.genMoves(cells,side);
    const base=(side,fr,fc,tr,tc,kind)=>gen(side).filter(m=>(m&127)===I(fr,fc)&&((m>>7)&127)===I(tr,tc)&&((m>>14)&15)===(kind||0));
    const plain=(side,fr,fc,tr,tc)=>base(side,fr,fc,tr,tc).find(m=>((m>>18)&127)===((m>>25)&127));
    const comp=(side,fr,fc,tr,tc)=>base(side,fr,fc,tr,tc).filter(m=>((m>>18)&127)!==((m>>25)&127));
    const play=m=>E.commitM(cells,m);
    fn({cells,sg,I,prog,gen,base,plain,comp,play,ck:(n,c)=>ok(name+' | '+n+tag,c),side:sg,foe:-sg});
  });
}
// 1) den luot 1: chiem tien don -> tien trinh 1, chua co thuong
scn('arrive',{},[[5,0,4],[6,0,3],[0,0,-3],[8,8,3]],c=>{
  c.ck('chua giu chot: tien trinh 0',c.prog(c.side)===0);
  const m=c.plain(c.side,5,0,5,1); c.ck('co nuoc vao tien don',!!m);
  c.ck('khong co nuoc kep khi moi chiem',c.comp(c.side,5,0,5,1).length===0);
  c.play(m); c.ck('cuoi luot: tien trinh 1',c.prog(c.side)===1&&E.controls(c.cells,c.side));});
// 2) luot thu 2 van giu -> co nuoc kep (cot 0-2), sau do tien trinh ve 0
scn('hold 2',{},[[5,1,4],[6,0,3],[7,6,3],[0,0,-3],[8,8,3]],c=>{
  c.cells[SL+(c.side>0?8:9)]=1; // da giu 1 luot
  // quan khac (6,0) di 1 o, tien don van duoc giu
  const cm=c.comp(c.side,6,0,7,0); c.ck('co nuoc kep khi giu du 2 luot',cm.length>0);
  c.ck('nuoc kep: moi buoc thuong deu o cot 0-2',cm.every(m=>((m>>18)&127)%COLS<=2));
  const keep=cm.find(m=>((m>>18)&127)!==c.I(5,1)); c.ck('co nuoc kep khong dung toi quan giu chot',!!keep);
  c.play(keep); c.ck('sau khi nhan thuong tien trinh ve 0 (khong cong don)',c.prog(c.side)===0&&E.controls(c.cells,c.side));});
// 3) buoc thuong chi co o cot 0-2; quan o cot >=3 khong duoc
scn('left only',{},[[5,1,4],[6,0,3],[7,6,3],[0,0,-3],[8,8,3]],c=>{
  c.cells[SL+(c.side>0?8:9)]=1;
  const cm=c.comp(c.side,6,0,7,0); const bf=new Set(cm.map(m=>(m>>18)&127));
  c.ck('quan cot 6 (7,6) khong co buoc thuong',![...bf].some(i=>i===c.I(7,6)));
  c.ck('quan o cot 0-2 co buoc thuong',[...bf].some(i=>i%COLS<=2));});
// 4) khong an quan, khong vao hang, chi buoc thuong (kind 0)
scn('no capture/den',{},[[5,1,4],[6,0,3],[1,4,4],[0,3,-2],[2,1,-1],[0,0,-3],[8,8,3]],c=>{
  c.cells[SL+(c.side>0?8:9)]=1;
  const cm=c.comp(c.side,6,0,7,0); c.ck('co nuoc kep',cm.length>0);
  c.ck('o dich cua buoc thuong luon trong (khong an quan) tren ban co sau nuoc chinh',cm.every(m=>{const x=Int8Array.from(c.cells); E.commit(x,m&127,(m>>7)&127,(m>>14)&15); return x[(m>>25)&127]===0;}));
  c.ck('buoc thuong khong vao hang',cm.every(m=>!E.DEN[(m>>25)&127]));
  c.ck('moi buoc thuong la buoc thuong 1 o',cm.every(m=>{const f=(m>>18)&127,t=(m>>25)&127;return Math.abs((f/COLS|0)-(t/COLS|0))+Math.abs(f%COLS-t%COLS)===1;}));});
// 5) cham roi di: chiem o luot 1, roi di o luot 2 -> khong thuong, tien trinh 0
scn('touch and leave',{},[[5,1,4],[6,0,3],[0,0,-3],[8,8,3]],c=>{
  c.cells[SL+(c.side>0?8:9)]=1;
  const leave=c.base(c.side,5,1,5,0); c.ck('co nuoc roi chot',leave.length>0);
  c.ck('roi chot khong co nuoc kep',leave.every(m=>((m>>18)&127)===((m>>25)&127)));
  c.play(leave[0]); c.ck('tien trinh ve 0',c.prog(c.side)===0&&!E.controls(c.cells,c.side));});
// 6) mat chot do bi an: tien trinh ve 0 ngay
scn('lose by capture',{},[[5,1,4],[6,1,-8],[0,0,-3],[8,8,3]],c=>{
  c.cells[SL+(c.side>0?8:9)]=1;
  const cap=c.base(c.foe,6,1,5,1); c.ck('Voi dich an quan giu chot',cap.length>0);
  c.play(cap[0]); c.ck('phe mat chot: tien trinh ve 0 ngay',c.prog(c.side)===0&&!E.controls(c.cells,c.side));
  c.ck('phe an chot dang giu',E.controls(c.cells,c.foe)&&c.prog(c.foe)===1);});
// 7) tranh chap: gianh lai chot bat dau tu 0 (khong ke thua tien trinh cu)
scn('recapture',{},[[5,1,4],[6,1,-8],[5,0,1],[0,0,-3],[8,8,3]],c=>{
  c.cells[SL+(c.side>0?8:9)]=1;
  c.play(c.base(c.foe,6,1,5,1)[0]);               // chot bi an
  c.ck('dang o 0',c.prog(c.side)===0);
  const back=c.plain(c.side,5,0,5,1); c.ck('Chuot (bac 1) an lai Voi tren tien don',!!back); c.play(back);
  c.ck('gianh lai: tien trinh moi la 1 (khong ke thua 1 cu, khong len 2)',c.prog(c.side)===1&&c.prog(c.foe)===0);});
// 8) Rua khong giu chot duoc
scn('turtle',{9:2},[[5,1,9],[0,0,-3],[8,8,3]],c=>{ c.ck('Rua tren tien don khong tinh kiem soat',!E.controls(c.cells,c.side)); });
// 9) hai phe doc lap
scn('independent',{},[[5,1,4],[3,1,-4],[0,0,-3],[8,8,3]],c=>{
  c.cells[SL+(c.side>0?8:9)]=1; c.cells[SL+(c.side>0?9:8)]=1;
  c.ck('moi phe co tien trinh rieng',c.prog(c.side)===1&&c.prog(c.foe)===1);});
// 10) bo qua thuong: nuoc chinh khong kep -> tien trinh ve 0 (khong tich tru)
scn('skip',{},[[5,1,4],[6,0,3],[0,0,-3],[8,8,3]],c=>{
  c.cells[SL+(c.side>0?8:9)]=1;
  const m=c.plain(c.side,6,0,7,0); c.ck('co nuoc khong kem thuong',!!m); c.play(m);
  c.ck('bo qua: tien trinh ve 0',c.prog(c.side)===0&&E.controls(c.cells,c.side));});
// 11) khong anh huong hoi chieu: Su tu dang hoi chieu giu nguyen khi buoc thuong
scn('cooldown',{},[[5,1,4],[6,0,3],[7,2,7],[0,0,-3],[8,8,3]],c=>{
  const a=c.side>0?0:1; c.cells[SL+(c.side>0?8:9)]=1; c.cells[SL+2+a]=2;
  const cm=c.comp(c.side,6,0,7,0); const m=cm[0];
  const x=Int8Array.from(c.cells); E.commit(x,6*0+((m&127)),(m>>7)&127,0);   // chi nuoc chinh
  const y=Int8Array.from(c.cells); E.commitM(y,m);
  c.ck('hoi chieu Su tu sau nuoc kep = sau nuoc chinh (buoc thuong khong tru them)',y[SL+2+a]===x[SL+2+a]);});
// 12) hoan tac: makeM/unmakeM khoi phuc nguyen ven (kem o trang thai tien trinh)
scn('undo',{},[[5,1,4],[6,0,3],[7,2,7],[0,0,-3],[8,8,3]],c=>{
  c.cells[SL+(c.side>0?8:9)]=1; let good=true,n=0;
  c.gen(c.side).forEach(m=>{ const before=Int8Array.from(c.cells); const cap=E.makeM(c.cells,m); E.unmakeM(c.cells,m,cap); n++; for(let i=0;i<before.length;i++) if(before[i]!==c.cells[i]){good=false;} });
  c.ck('makeM/unmakeM hoan nguyen '+n+' nuoc',good&&n>0);});
// 13) quan giu chot bi an bang ky nang (Su tu vo xa, nan nhan khong di chuyen) -> mat chot
scn('lose by pounce',{},[[5,1,4],[3,1,-7],[0,0,-3],[8,8,3]],c=>{
  c.cells[SL+(c.side>0?8:9)]=1;
  const p=c.base(c.foe,3,1,5,1,7); c.ck('Su tu dich vo xa quan giu chot (3,1)->(5,1)',p.length>0);
  if(p.length){ c.play(p[0]); c.ck('mat chot, tien trinh ve 0',c.prog(c.side)===0&&!E.controls(c.cells,c.side)); }});
// 14) che do cu (OUTMODE=0) khong bi anh huong
{ E.setOutMode(0); E.setClassic(false); const a=Z.slice(); E.SQ[0]=a.slice(); E.SQ[1]=a.slice(); E.setKeys();
  const cells=new Int8Array(N+ST); cells[5*COLS+0]=4; cells[0]=-3; cells[8*COLS+8]=3;
  const ms=E.genMoves(cells,1).filter(m=>(m&127)===5*COLS&&((m>>7)&127)===5*COLS+1);
  ok('che do cu: chiem tien don van duoc nuoc kep',ms.some(m=>((m>>18)&127)!==((m>>25)&127)));
  E.setOutMode(1); }
console.log('outpost_ctl pass',pass,'fail',fails); process.exit(fails?1:0);
