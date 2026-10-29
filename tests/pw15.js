/* Giao dien che do THU NGHIEM 'tien don kiem soat' (?outpost=control) va bao dam ban chinh khong doi (khong tham so). */
const { chromium } = require('playwright'); const path=require('path');
(async()=>{
  const b=await chromium.launch(); const errs=[]; let ok=0,bad=0;const chk=(n,c)=>{if(c)ok++;else{bad++;console.log('FAIL',n);}};
  const file='file://'+path.join(__dirname,'..',process.env.DIST||'dist_exp','game_local.html');
  async function open(q){ const p=await b.newPage({viewport:{width:1100,height:1000}});
    p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_|fonts/.test(m.text()))errs.push(m.text())});
    await p.goto(file+q); await p.waitForTimeout(500); await p.click('#draft-go'); await p.waitForTimeout(700); return p; }
  // ---- 1) khong tham so: nguyen ban chinh thuc
  let p=await open('');
  const base=await p.evaluate(()=>({badge:document.getElementById('exp-badge').hidden,oc:document.getElementById('oc-me').textContent}));
  chk('mac dinh: khong co nhan THU NGHIEM',base.badge===true); chk('mac dinh: chip cu "Thuong tien don"',/Thưởng tiền đồn/.test(base.oc));
  await p.close();
  // ---- 2) che do kiem soat
  p=await open('?outpost=control');
  const ev=(fn,arg)=>p.evaluate(([src,a])=>window.__E('('+src+')')(a),[fn.toString(),arg]);
  const getR=()=>p.evaluate(()=>{const r=document.getElementById('board').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height};});
  const click=async(r,c)=>{await p.evaluate(()=>window.scrollTo(0,0));const R=await getR();await p.mouse.click(R.x+(c+.5)*R.w/9,R.y+(r+.5)*R.h/9);await p.waitForTimeout(170);};
  const setup=(spec,prog)=>ev(([spec,prog])=>{cancelThink();token++;bonus=null;over=false;thinking=false;resultEl.hidden=true;
     cells=new Int8Array(N+EN.ST);spec.forEach(a=>{cells[a[0]*COLS+a[1]]=a[2];});if(prog)cells[SL+8]=prog;turn=1;history=[];posHist=[EN.hashOf(cells,turn)];lastMove=null;deselect();refresh();},[spec,prog]);
  const st=()=>ev(()=>({bonus:!!bonus,turn,over,skip:!$('btn-skip').hidden,me:$('oc-me').textContent,foe:$('oc-foe').textContent,badge:$('exp-badge').textContent,bub:document.querySelector('.b-text').textContent,steps:bonus?bonus.steps.map(m=>(m&127)%COLS):[],prog:cells[SL+8],rules:$('rules')?$('rules').innerText:''}));
  let s=await st();
  chk('co nhan THU NGHIEM',/THỬ NGHIỆM/.test(s.badge)&&/kiểm soát/.test(s.badge));
  chk('chip chua giu chot',/Chưa giữ chốt/.test(s.me));
  // A: chiem chot -> tien trinh 1/2, khong co phase thuong
  await setup([[5,0,4],[6,0,3],[0,0,-3],[8,8,3]],0);
  await click(5,0); await click(5,1); s=await st();
  chk('chiem chot: chip 1/2, chua co buoc thuong',/Giữ chốt 1\/2/.test(s.me)&&!s.bonus);
  await p.waitForTimeout(2500); s=await st();
  chk('AI da dap lai, den luot nguoi',s.turn===1&&!s.over);
  // B: luot thu 2 van giu -> phase thuong, chi quan cot 0-2
  await setup([[5,1,4],[6,0,3],[7,6,3],[0,0,-3],[8,8,3]],1);
  await click(6,0); await click(7,0); s=await st();
  chk('giu du 2 luot: vao phase thuong',s.bonus&&s.skip);
  chk('buoc thuong chi cho quan cot 0-2',s.steps.length>0&&s.steps.every(c=>c<=2));
  chk('thong bao ro "Giu chot du 2 luot"',/Giữ chốt đủ 2 lượt/.test(s.bub));
  await p.click('#btn-skip'); await p.waitForTimeout(300); s=await st();
  chk('bo qua: ket thuc luot, tien trinh ve 0 (khong tich tru)',!s.bonus&&s.turn===-1&&s.prog===0);
  await p.waitForTimeout(2500);
  // C: lam buoc thuong that
  await setup([[5,1,4],[6,0,3],[7,6,3],[0,0,-3],[8,8,3]],1);
  await click(6,0); await click(7,0); await click(7,6).catch(()=>{}); // quan cot 6 khong chon duoc
  s=await st(); chk('chon quan cot 6 khong hop le trong phase thuong',s.bonus);
  await click(5,1); await click(5,0); await p.waitForTimeout(300); s=await st();
  chk('buoc thuong bang quan giu chot (roi chot) hop le',!s.bonus&&s.turn===-1);
  await p.waitForTimeout(2500);
  // D: mat chot -> thong bao
  await setup([[5,1,4],[6,1,-8],[8,8,3],[0,0,-3]],1);
  await ev(()=>{turn=-1;thinking=false;});
  await ev(()=>{ applyMove(6*COLS+1,5*COLS+1,0,null); });
  await p.waitForTimeout(400); s=await st();
  chk('mat chot: tien trinh ve 0 va co thong bao',s.prog===0&&/mất tiền đồn/.test(s.bub));
  // E: hoan tac sau luot chiem chot
  await setup([[5,0,4],[6,0,3],[0,0,-3],[8,8,3]],0);
  await click(5,0); await click(5,1); await p.waitForTimeout(2500);
  await p.evaluate(()=>window.scrollTo(0,0)); await p.click('#btn-undo'); await p.waitForTimeout(300); s=await st();
  chk('hoan tac: tien trinh ve lai 0',s.prog===0&&/Chưa giữ chốt/.test(s.me));
  // F: luat hien thi
  await p.evaluate(()=>{const d=document.querySelector('#rules-box, #rules, .rules'); });
  const txt=await p.evaluate(()=>document.body.textContent); chk('luat hien thi mo ta che do thu nghiem',/\[THỬ NGHIỆM\] Tiền đồn/.test(txt));
  await p.screenshot({path:path.join(__dirname,'outpost_ctl.png')});
  console.log('ui outpost-ctl ok',ok,'bad',bad,'errors',errs); await b.close(); process.exit(bad||errs.length?1:0);
})();
