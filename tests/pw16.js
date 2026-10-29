/* UI Bo rung: hop chon Lao/Huc, thong bao hoi chieu doc lap, hoan tac. Chay tren dist/game_local.html (co window.__E). */
const { chromium } = require('playwright'); const path=require('path');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1100,height:900}}); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_|fonts/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+path.join(__dirname,'..',process.env.DIST||'dist','game_local.html')); await p.waitForTimeout(500);
  await p.click('#draft-go'); await p.waitForTimeout(700);
  const ev=(fn,arg)=>p.evaluate(([src,a])=>window.__E('('+src+')')(a),[fn.toString(),arg]);
  const getR=()=>p.evaluate(()=>{const r=document.getElementById('board').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};});
  let R=await getR(); const cell=(r,c)=>[R.x+(c+.5)*R.w/9,R.y+(r+.5)*R.h/9];
  const click=async(r,c)=>{await p.evaluate(()=>window.scrollTo(0,0));R=await getR();await p.mouse.click(...cell(r,c));await p.waitForTimeout(170);};
  const setup=async(spec,turnV)=>{ await ev(([spec,turnV])=>{ cancelThink(); token++; bonus=null; over=false; thinking=false; resultEl.hidden=true; pickSkill=null;
     cells=new Int8Array(N+EN.ST); spec.forEach(([r,c,v])=>{cells[r*COLS+c]=v;}); turn=turnV; history=[]; posHist=[EN.hashOf(cells,turn)]; lastMove=null; deselect(); startCnt=[4,4]; SQ[0][7]=1; SQ[1][7]=1; EN.setKeys(); refresh(); },[spec,turnV]); };
  const at=(r,c)=>ev(([r,c])=>cells[r*COLS+c],[r,c]);
  const slot=(j)=>ev((j)=>cells[SL+j],j);
  const st=()=>ev(()=>({turn,over,pick:!$('pick-skill').hidden,text:$('info').textContent}));
  const waitHuman=async()=>{for(let i=0;i<40;i++){const t=await ev(()=>({turn,over,th:thinking}));if(t.turn===1||t.over)return t;await p.waitForTimeout(250);}return null;};
  let ok=0,bad=0;const chk=(n,c)=>{if(c)ok++;else{bad++;console.log('FAIL',n);}};
  const BASE=[[0,0,-1],[8,8,1]];

  // A: Soi cach 2 o: vua lao vua huc -> hop chon
  await setup([[5,4,7],[3,4,-3],...BASE],1);
  await click(5,4); await click(3,4);
  let s=await st();
  chk('A hop chon hien ra, chua di',s.pick&&s.turn===1&&(await at(5,4))===7&&(await at(3,4))===-3);
  await p.click('#btn-huc'); await p.waitForTimeout(300);
  s=await st();
  chk('A huc: Bo rung o giua, Soi lui ve (2,4), khong bi an',(await at(4,4))===7&&(await at(2,4))===-3&&(await at(3,4))===0&&(await at(5,4))===0);
  chk('A huc dat hoi chieu huc=2, lao=0',(await slot(10))===2&&(await slot(4))===0);
  chk('A hop chon an di, doi sang luot may',!s.pick&&s.turn===-1);
  await waitHuman();
  // B: thong bao hoi chieu doc lap (luot nguoi)
  s=await st();
  if(s.turn===1&&!s.over){
    const bp=await ev(()=>{for(var i=0;i<N;i++) if(cells[i]===7) return i; return -1;});
    await click(Math.floor(bp/9),bp%9); s=await st();
    chk('B thong bao: Huc dang hoi chieu, Lao van dung duoc',/Húc đang hồi chiêu, còn 2 lượt\. Lao vẫn dùng được/.test(s.text));
    chk('B khong bao sai ca hai bi khoa',!/hồi chiêu cả hai/.test(s.text));
  } else chk('B den luot nguoi',false);

  // C: chon Lao -> an Soi, hoi chieu lao
  await setup([[5,4,7],[3,4,-3],...BASE],1);
  await click(5,4); await click(3,4); await p.click('#btn-lao'); await p.waitForTimeout(300);
  chk('C lao an Soi: Bo rung o (3,4), (2,4) trong',(await at(3,4))===7&&(await at(5,4))===0&&(await at(2,4))===0);
  chk('C hoi chieu lao=1, huc=0',(await slot(4))===1&&(await slot(10))===0);
  await waitHuman();
  s=await st();
  if(s.turn===1&&!s.over){
    const bp=await ev(()=>{for(var i=0;i<N;i++) if(cells[i]===7) return i; return -1;});
    if(bp>=0){ await click(Math.floor(bp/9),bp%9); s=await st(); chk('C thong bao: Lao dang hoi chieu, Huc van dung duoc',/Lao đang hồi chiêu, còn 1 lượt\. Húc vẫn dùng được/.test(s.text)); }
    else chk('C Bo rung con',false);
  }

  // D: Voi (khong an duoc) -> huc truc tiep, khong hop chon
  await setup([[5,4,7],[3,4,-8],...BASE],1);
  await click(5,4); await click(3,4); s=await st();
  chk('D chi co huc: ap dung ngay, khong hop chon',!s.pick&&(await at(4,4))===7&&(await at(2,4))===-8);
  // E: hoan tac sau huc khoi phuc bo dem
  await waitHuman();
  await p.click('#btn-undo'); await p.waitForTimeout(400);
  chk('E hoan tac: quan va bo dem huc ve ban dau',(await at(5,4))===7&&(await at(3,4))===-8&&(await slot(10))===0&&(await slot(4))===0);

  // F: huy chon
  await setup([[5,4,7],[3,4,-3],[6,6,2],...BASE],1);
  await click(5,4); await click(3,4); s=await st(); const sh=s.pick;
  await click(6,6); s=await st();
  chk('F hop chon bat roi tat khi chon quan khac',sh&&!s.pick&&(await at(5,4))===7);

  // G: phe may (tren) cung sinh ra ca lao va huc
  await setup([[3,4,-7],[5,4,3],[0,0,1],[8,8,1],[0,5,-1]],-1);
  const kinds=await ev(()=>EN.genMoves(cells,-1).map(function(m){return (m>>14)&15;}));
  chk('G phe may co ca nuoc lao (8) va huc (9)',kinds.includes(8)&&kinds.includes(9));
  console.log('ui bison ok',ok,'bad',bad,'errors',JSON.stringify(errs)); await b.close(); process.exit(bad||errs.length?1:0);
})();
