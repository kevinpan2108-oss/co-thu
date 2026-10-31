/* UI Bo rung: hop chon Lao/Huc, thong bao hoi chieu doc lap, hoan tac. Chay tren dist/game_local.html (co window.__E). */
const { chromium } = require('playwright'); const path=require('path');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1100,height:900}}); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_|fonts/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+path.join(__dirname,'..',process.env.DIST||'dist','game_local.html')); await p.waitForTimeout(500); await p.click('#menu-single'); await p.waitForTimeout(300);
  await p.click('#draft-go'); await p.waitForTimeout(700);
  const ev=(fn,arg)=>p.evaluate(([src,a])=>window.__E('('+src+')')(a),[fn.toString(),arg]);
  const getR=()=>p.evaluate(()=>{const r=document.getElementById('board').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};});
  let R=await getR(); const cell=(r,c)=>[R.x+(c+.5)*R.w/9,R.y+(r+.5)*R.h/9];
  const click=async(r,c)=>{await p.evaluate(()=>window.scrollTo(0,0));R=await getR();await p.mouse.click(...cell(r,c));await p.waitForTimeout(170);};
  const setup=async(spec,turnV)=>{ await ev(([spec,turnV])=>{ cancelThink(); token++; bonus=null; over=false; thinking=false; resultEl.hidden=true; 
     cells=new Int8Array(N+EN.ST); spec.forEach(([r,c,v])=>{cells[r*COLS+c]=v;}); turn=turnV; history=[]; posHist=[EN.hashOf(cells,turn)]; lastMove=null; deselect(); startCnt=[4,4]; SQ[0][7]=1; SQ[1][7]=1; EN.setKeys(); refresh(); },[spec,turnV]); };
  const at=(r,c)=>ev(([r,c])=>cells[r*COLS+c],[r,c]);
  const slot=(j)=>ev((j)=>cells[SL+j],j);
  const st=()=>ev(()=>({turn,over,text:$('info').textContent}));
  const waitHuman=async()=>{for(let i=0;i<40;i++){const t=await ev(()=>({turn,over,th:thinking}));if(t.turn===1||t.over)return t;await p.waitForTimeout(250);}return null;};
  let ok=0,bad=0;const chk=(n,c)=>{if(c)ok++;else{bad++;console.log('FAIL',n);}};
  const BASE=[[0,0,-1],[8,8,1]];
  // Bui moi o E4/E6 (cot giua) chan Lao/Huc ha canh o do; cac kich ban Bo rung cu dung cot giua nen go hai o bui nay (giong tests/bison.js).
  await ev(()=>{EN.BUSH[3*9+4]=0;EN.BUSH[5*9+4]=0;});
  const info=()=>ev(()=>$('info').textContent);
  const bpos=()=>ev(()=>{for(var i=0;i<N;i++) if(cells[i]===7) return i; return -1;});

  // A: Voi cach 2 o -> Huc ap dung truc tiep (khong con hop chon), Voi lui, choang hien tren giao dien
  await setup([[5,4,7],[3,4,-8],...BASE],1);
  await click(5,4); await click(3,4);
  chk('A huc Voi: Bo rung o giua (4,4), Voi lui (2,4), khong bi an',(await at(4,4))===7&&(await at(2,4))===-8&&(await at(3,4))===0&&(await at(5,4))===0);
  chk('A hoi chieu huc=2, lao=0; Voi bi danh dau choang',(await slot(10))===2&&(await slot(4))===0&&(await slot(12+1))===2*9+4+1);
  chk('A khong con hop chon Lao/Huc',(await p.$('#pick-skill'))===null);
  const stunnedNow=await ev(()=>{var n=0; for(var k in pieceEls){ if(pieceEls[k].classList.contains('stunned')) n++; } return n;});
  chk('A giao dien danh dau quan choang (class stunned)',stunnedNow===1);
  await waitHuman();
  chk('A may da dap lai, Voi choang van dung nguyen cho (khong di) ',(await at(2,4))===-8);
  let s=await st();
  // B: thong bao hoi chieu doc lap + Bo rung hanh dong tiep
  if(s.turn===1&&!s.over){
    const bp=await bpos(); await click(Math.floor(bp/9),bp%9); const t=await info();
    chk('B thong bao: Huc dang hoi chieu, Lao van dung duoc',/Húc đang hồi chiêu, còn 2 lượt\. Lao vẫn dùng được/.test(t)&&!/hồi chiêu cả hai/.test(t));
    const nm=await ev(()=>{ var i=0; for(var q=0;q<N;q++) if(cells[q]===7) i=q; return movesFrom(cells,i,[]).length; });
    chk('B Bo rung van co nuoc di o luot ke tiep',nm>0);
  } else chk('B den luot nguoi',false);

  // C: Soi cach 2 o -> chi co Lao (an), khong co Huc
  await setup([[5,4,7],[3,4,-3],...BASE],1);
  await click(5,4); await click(3,4);
  chk('C Soi an duoc: Lao an quan (Bo rung o (3,4), (3,4) khong con Soi)',(await at(3,4))===7&&(await at(5,4))===0&&(await at(2,4))===0);
  chk('C hoi chieu lao=1, huc=0',(await slot(4))===1&&(await slot(10))===0);
  await waitHuman(); s=await st();
  if(s.turn===1&&!s.over){
    const bp=await bpos();
    if(bp>=0){ await click(Math.floor(bp/9),bp%9); chk('C thong bao: Lao dang hoi chieu, Huc van dung duoc',/Lao đang hồi chiêu, còn 1 lượt\. Húc vẫn dùng được/.test(await info())); }
    else chk('C Bo rung con',false);
  }

  // D: REGRESSION qua giao dien: Huc Voi vao bay ke hang -> may KHONG thang ngay, Voi choang
  await setup([[4,4,7],[6,4,-8],[0,0,-1],[8,8,1]],1);
  await click(4,4); await click(6,4);
  chk('D Voi bi day vao bay (7,4) ke hang',(await at(7,4))===-8&&(await at(5,4))===7);
  await waitHuman(); s=await st();
  chk('D may khong thang bang cach vao hang; van choi tiep',!s.over&&(await at(7,4))===-8&&(await at(8,4))===0);

  // E: hoan tac sau huc khoi phuc bo dem va choang
  await p.click('#btn-undo'); await p.waitForTimeout(400);
  chk('E hoan tac: quan, bo dem huc va choang ve ban dau',(await at(4,4))===7&&(await at(6,4))===-8&&(await slot(10))===0&&(await slot(12))===0&&(await slot(13))===0);

  // F: phe may (tren) cung sinh ra Lao va Huc
  await setup([[3,4,-7],[5,4,8],[0,0,1],[8,8,1],[0,5,-1]],-1);
  const kinds=await ev(()=>EN.genMoves(cells,-1).map(function(m){return (m>>14)&15;}));
  chk('F phe may co nuoc Huc (9) voi Voi',kinds.includes(9));
  console.log('ui bison ok',ok,'bad',bad,'errors',JSON.stringify(errs)); await b.close(); process.exit(bad||errs.length?1:0);
})();
