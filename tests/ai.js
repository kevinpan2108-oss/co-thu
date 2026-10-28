/* Kiem thu chien thuat co ban cua AI (cap 3) + bat bien: nuoc AI tra ve luon hop le va khong bi cam. */
const fs=require('fs'),path=require('path');
const E=new Function(fs.readFileSync(path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
const {N,ST,COLS,ROWS}=E; const rc=(r,c)=>r*COLS+c; const Z=[0,0,0,0,0,0,0,0,0,0];
E.LEVELS[3].ms=200;
let pass=0,fails=0; const ok=(n,c)=>{if(c)pass++;else{fails++;console.log('FAIL',n);}};
const setup=(pcs,side)=>{E.setClassic(false);E.SQ[0]=Z.slice();E.SQ[1]=Z.slice();E.setKeys();E.clearTT();const c=new Int8Array(N+ST);pcs.forEach(p=>c[rc(p[0],p[1])]=p[2]);return c;};
// 1) vao hang ngay
let c=setup([[7,4,4],[0,0,-3]]); let r;
c=setup([[1,4,4],[8,0,3],[0,0,-3]]); r=E.search(c,1,3,[],[]); ok('AI vao hang o 1 nuoc: (1,4)->(0,4)',r&&r.t===rc(0,4));
c=setup([[7,4,-4],[8,8,3],[0,0,3]]); r=E.search(c,-1,3,[],[]); ok('AI phe tren vao hang: (7,4)->(8,4)',r&&r.t===rc(8,4));
// 2) an quan mien phi (Voi an Su tu ke ben, khong bi ai ban lai)
c=setup([[5,4,8],[5,5,-7],[8,0,3],[0,0,-3]]); r=E.search(c,1,3,[],[]); ok('Voi vs Su tu ke ben: AI an ngay hoac giu loi the lon (diem > 900)',r&&(r.t===rc(5,5)||r.score>900));
// 3) khong tu dua Voi cho Chuot ke ben an khi co lua chon khac
c=setup([[5,4,8],[5,5,-1],[8,0,3],[0,0,-3]]); r=E.search(c,-1,3,[],[]); ok('Chuot (phe tren) an Voi ke ben, hoac AI thay duong thang khac',r&&((r.f===rc(5,5)&&r.t===rc(5,4))||r.score>50000));
// 4) bat bien: AI khong bao gio tra nuoc ngoai genMoves hoac nuoc bi cam, qua 60 nuoc di tu ban dau
{ E.setClassic(false); const sq=[0,0,1,0,1,0,1,0,0,1]; E.SQ[0]=sq.slice();E.SQ[1]=sq.slice();E.setKeys();E.clearTT();
  let b=E.initialCells(),side=1,good=true,hist=[E.hashOf(b,1)];
  for(let i=0;i<60;i++){ const all=E.genMoves(b,side); if(!all.length)break;
    const rr=E.search(b,side,3,hist.slice(-14),[]); if(!rr||all.indexOf(rr.m)<0){good=false;break;}
    E.commitM(b,rr.m); if(E.DEN[rr.t]===-side&&rr.k===0)break; side=-side; hist.push(E.hashOf(b,side)); }
  ok('60 nuoc AI tu choi deu hop le',good); }
// 5) AI khong chon phuc kich quan trong dam lay (nuoc khong ton tai) - kiem tra luat trong tung vi tri AI di qua
{ const sq=[0,0,0,1,0,1,0,0,0,0]; E.SQ[0]=sq.slice();E.SQ[1]=sq.slice();E.setKeys();E.clearTT();
  const b=new Int8Array(N+ST); b[rc(4,6)]=5; b[rc(3,6)]=-3; b[rc(8,0)]=3; b[rc(0,0)]=-3; b[rc(8,8)]=1; b[rc(0,8)]=-1;
  const all=E.genMoves(b,1); ok('Ca sau song khong co nuoc phuc kich quan dam lay',!all.some(m=>((m>>14)&15)===6)); }
console.log('ai pass',pass,'fail',fails); process.exit(fails?1:0);
