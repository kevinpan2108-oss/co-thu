const { chromium } = require('playwright');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1100,height:900}}); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_|fonts/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+require('path').join(__dirname,'..',process.env.DIST||'dist','game_local.html')); await p.waitForTimeout(500);
  await p.click('#draft-go'); await p.waitForTimeout(700);
  const ev=(fn,arg)=>p.evaluate(([src,a])=>window.__E('('+src+')')(a),[fn.toString(),arg]);
  const getR=()=>p.evaluate(()=>{const r=document.getElementById('board').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};});
  let R=await getR();
  const cell=(r,c)=>[R.x+(c+.5)*R.w/9,R.y+(r+.5)*R.h/9];
  const click=async(r,c)=>{await p.evaluate(()=>window.scrollTo(0,0));R=await getR();await p.mouse.click(...cell(r,c));await p.waitForTimeout(160);};
  const setup=async(spec,turnV)=>{ await ev(([spec,turnV])=>{ cancelThink(); token++; bonus=null; over=false; thinking=false; resultEl.hidden=true;
     cells=new Int8Array(N+EN.ST); spec.forEach(([r,c,v])=>{cells[r*COLS+c]=v;}); turn=turnV; history=[]; posHist=[EN.hashOf(cells,turn)]; lastMove=null; deselect(); startCnt=[4,4]; refresh(); },[spec,turnV]); };
  const st=()=>ev(()=>({bonus:!!bonus,turn,over,skipVisible:!$('btn-skip').hidden,ocMe:$('oc-me').textContent,ocFoe:$('oc-foe').textContent,pill:$('pill-text').textContent,res:resultEl.hidden?'':$('res-title').textContent}));
  const at=(r,c)=>ev(([r,c])=>cells[r*COLS+c],[r,c]);
  let ok=0,bad=0;const chk=(n,c)=>{if(c)ok++;else{bad++;console.log('FAIL',n);}};

  // A: bonus flow (human)
  await setup([[3,0,4],[6,4,8],[1,7,-8],[0,0,-4]],1);
  await click(3,0); await click(3,1);
  let s=await st(); chk('A bonus phase starts',s.bonus&&s.turn===1&&s.skipVisible&&/thưởng/i.test(s.pill));
  await click(6,4); await click(5,4);
  s=await st(); chk('A bonus applied -> opp turn',!s.bonus&&s.turn===-1&&(await at(5,4))===8&&(await at(3,1))===4);
  chk('A cd chip shows 2',/hồi 2/.test(s.ocMe));
  await p.waitForTimeout(2500);
  s=await st(); chk('A AI replied, back to human',s.turn===1&&!s.over); chk('A cd still 2 until own move',/hồi 2/.test(s.ocMe));

  // B: skip
  await setup([[3,0,4],[6,4,8],[1,7,-8],[0,0,-4]],1);
  await click(3,0); await click(3,1); await p.click('#btn-skip'); await p.waitForTimeout(300);
  s=await st(); chk('B skip ends turn, no cooldown',!s.bonus&&s.turn===-1&&(await at(6,4))===8&&/sẵn sàng/.test(s.ocMe));
  await p.waitForTimeout(2500);

  // C: undo during bonus phase restores before base move
  await setup([[3,0,4],[6,4,8],[1,7,-8],[0,0,-4]],1);
  await click(3,0); await click(3,1); await p.click('#btn-undo'); await p.waitForTimeout(300);
  s=await st(); chk('C undo in bonus restores',!s.bonus&&s.turn===1&&(await at(3,0))===4&&(await at(3,1))===0&&/sẵn sàng/.test(s.ocMe));
  // C2: undo after completed compound move (+AI reply)
  await click(3,0); await click(3,1); await click(6,4); await click(5,4); await p.waitForTimeout(2600);
  await p.click('#btn-undo'); await p.waitForTimeout(300);
  s=await st(); chk('C2 undo after compound restores both steps',!s.bonus&&s.turn===1&&(await at(3,0))===4&&(await at(6,4))===8&&(await at(5,4))===0&&/sẵn sàng/.test(s.ocMe));

  // D: AI compound move
  await setup([[5,0,-4],[2,4,-8],[7,7,8],[8,0,4]],-1);
  await ev(()=>{ thinking=true; applyMove(5*COLS+0,5*COLS+1,0,{bf:2*COLS+4,bt:3*COLS+4}); });
  await p.waitForTimeout(1200);
  chk('D AI base+bonus applied',(await at(5,1))===-4&&(await at(3,4))===-8&&(await at(2,4))===0);
  s=await st(); console.log(JSON.stringify(s));chk('D back to human, foe cd 2',s.turn===1&&/hồi 2/.test(s.ocFoe));

  // E: stalemate = draw
  const w0=await ev(()=>[wins,losses]);
  await setup([[0,0,-4],[1,0,8],[0,1,8],[8,0,4]],1);
  await click(8,0); await click(7,0); await p.waitForTimeout(900);
  s=await st(); const w1=await ev(()=>[wins,losses]);
  chk('E stalemate -> draw',s.over&&/hòa/i.test(s.res)&&w0[0]===w1[0]&&w0[1]===w1[1]);

  // F: den win unchanged
  await setup([[1,4,4],[8,0,4],[0,0,-3]],1);
  await click(1,4); await click(0,4); await p.waitForTimeout(900);
  s=await st(); chk('F den win',s.over&&/thắng/i.test(s.res));

  // G: eat all fighting pieces (turtle left) -> win
  await setup([[2,4,8],[2,3,-3],[7,0,4],[0,0,-9]],1);
  await ev(()=>{SQ[1][9]=2;EN.setKeys();});
  await click(2,4); await click(2,3); await p.waitForTimeout(900);
  s=await st(); chk('G only turtle left -> win',s.over&&/thắng/i.test(s.res));
  await ev(()=>{SQ[1][9]=0;EN.setKeys();});

  // H: hint with bonus in play still works
  await setup([[3,0,4],[6,4,8],[1,7,-8],[0,0,-4]],1);
  await p.click('#btn-hint'); await p.waitForTimeout(3500);
  s=await st(); chk('H hint no crash',!s.over);

  // I: screenshot of bonus phase
  await setup([[3,0,4],[6,4,8],[1,7,-8],[0,0,-4],[7,7,6],[6,7,1]],1);
  await click(3,0); await click(3,1); await click(6,4);
  await p.screenshot({path:'bonus_phase.png'});
  console.log('ui ok',ok,'bad',bad,'errors',JSON.stringify(errs)); await b.close();
})();
