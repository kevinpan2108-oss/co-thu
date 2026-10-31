/* UI: vao bui va lach cheo o E4/E6 bang thao tac chuot that. Chay: node pw_bush_ui.js (can playwright, dist/game_local.html) */
const { chromium } = require('playwright');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1100,height:900}}); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_|fonts/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+require('path').join(__dirname,'..','dist','game_local.html')); await p.waitForTimeout(500); await p.click('#menu-single'); await p.waitForTimeout(300);
  await p.click('#draft-go'); await p.waitForTimeout(700);
  const ev=(fn,arg)=>p.evaluate(([src,a])=>window.__E('('+src+')')(a),[fn.toString(),arg]);
  const getR=()=>p.evaluate(()=>{const r=document.getElementById('board').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};});
  let R=await getR();
  const cell=(r,c)=>[R.x+(c+.5)*R.w/9,R.y+(r+.5)*R.h/9];
  const click=async(r,c)=>{await p.evaluate(()=>window.scrollTo(0,0));R=await getR();await p.mouse.click(...cell(r,c));await p.waitForTimeout(160);};
  const setup=async(spec,turnV)=>{ await ev(([spec,turnV])=>{ cancelThink(); token++; bonus=null; over=false; thinking=false; resultEl.hidden=true;
     cells=new Int8Array(N+EN.ST); spec.forEach(([r,c,v])=>{cells[r*COLS+c]=v;}); turn=turnV; history=[]; posHist=[EN.hashOf(cells,turn)]; lastMove=null; deselect(); startCnt=[4,4]; refresh(); },[spec,turnV]); };
  const at=(r,c)=>ev(([r,c])=>cells[r*COLS+c],[r,c]);
  const turn=()=>ev(()=>turn);
  const legalTo=()=>ev(()=>legal.map(t=>[t/COLS|0,t%COLS,legalKind[t]||0]));
  let ok=0,bad=0;const chk=(n,c)=>{if(c)ok++;else{bad++;console.log('FAIL',n);}};
  const bush=await ev(()=>{const a=[];for(let i=0;i<N;i++)if(BUSH[i])a.push([i/COLS|0,i%COLS]);return a;});
  const has=(r,c)=>bush.some(x=>x[0]===r&&x[1]===c);
  chk('ban do co bui o E4 (3,4) va E6 (5,4)',has(3,4)&&has(5,4)); chk('I4/I6 (3,8),(5,8) khong con la bui',!has(3,8)&&!has(5,8)); chk('van du 8 bui',bush.length===8);
  // 1) vao bui: Voi (6,4) buoc len bui (5,4)
  await setup([[6,4,8],[1,7,-8],[0,0,-4]],1);
  await click(6,4); chk('chon Voi: co nuoc vao bui E6',(await legalTo()).some(x=>x[0]===5&&x[1]===4));
  await click(5,4); chk('Voi vao bui E6 bang chuot',(await at(5,4))===8&&(await at(6,4))===0);
  // 2) lach cheo tu bui: Cao (5,4) -> (6,5); khong vao song (4,3), khong an quan
  await setup([[5,4,2],[1,7,-8],[0,0,-4]],1);
  await click(5,4); let L=await legalTo();
  if(process.env.SHOT2)await p.screenshot({path:process.env.SHOT2,clip:{x:R.x-6,y:R.y-6,width:R.w+12,height:R.h+12}});
  chk('tu bui co nuoc lach cheo (kind 10) toi (6,3),(6,5),(4,5)',[[6,3],[6,5],[4,5]].every(t=>L.some(x=>x[0]===t[0]&&x[1]===t[1]&&x[2]===10)));
  chk('khong lach vao song (4,3)',!L.some(x=>x[0]===4&&x[1]===3&&x[2]===10));
  await click(6,5); chk('bam o cheo: quan di chuyen cheo ra (6,5)',(await at(6,5))===2&&(await at(5,4))===0);
  // 3) lach khong an quan
  await setup([[5,4,2],[6,5,-1],[1,7,-8],[0,0,-4]],1);
  await click(5,4); L=await legalTo(); chk('o cheo co quan dich: khong co nuoc lach (kind 10) toi do',!L.some(x=>x[0]===6&&x[1]===5&&x[2]===10));
  // 4) quan khong o bui khong co lach
  await setup([[6,4,2],[1,7,-8],[0,0,-4]],1);
  await click(6,4); L=await legalTo(); chk('quan ngoai bui khong co nuoc lach cheo',!L.some(x=>x[2]===10));
  // 5) I4 khong con la bui: quan dung o (3,8) khong co lach
  await setup([[3,8,2],[1,7,-8],[0,0,-4]],1);
  await click(3,8); L=await legalTo(); chk('o I4 (3,8) khong con lach cheo',!L.some(x=>x[2]===10));
  await p.screenshot({path:process.env.SHOT||'/tmp/bush_ui.png'});
  chk('khong loi JS/console',errs.length===0); if(errs.length)console.log(errs.slice(0,3));
  console.log('PASS',ok,'FAIL',bad); await b.close(); process.exit(bad?1:0);
})();
