/* Kiem thu giao dien: bac hieu luc Soi, Lon rung, Cho, Gau, Ca sau (the thong tin + huy hieu + tooltip). */
const { chromium } = require('playwright'); const path=require('path');
(async()=>{
  const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1100,height:1000}}); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/ERR_|fonts/.test(m.text()))errs.push(m.text())});
  await p.goto('file://'+path.join(__dirname,'..','dist','game_local.html')); await p.waitForTimeout(500);
  await p.click('#draft-go'); await p.waitForTimeout(700);
  const ev=(fn,arg)=>p.evaluate(([src,a])=>window.__E('('+src+')')(a),[fn.toString(),arg]);
  let ok=0,bad=0;const chk=(n,c)=>{if(c)ok++;else{bad++;console.log('FAIL',n);}};
  // dat quan: tuy bien the can chon SQ truoc (cam gan co dinh theo cap 3/4/5)
  const show=async(spec,sqv,inspect)=>ev(([spec,sqv,inspect])=>{
    cancelThink();token++;bonus=null;over=false;thinking=false;
    SQ[0]=sqv.slice();SQ[1]=sqv.slice();EN.setKeys();
    cells=new Int8Array(N+EN.ST);spec.forEach(a=>{cells[a[0]*COLS+a[1]]=a[2];});turn=1;history=[];posHist=[EN.hashOf(cells,turn)];deselect();
    refresh(); inspectCode=inspect; refresh();
    const k=pieceEls[inspect]; return {title:k.title,rank:rankEls[inspect].textContent,cls:rankEls[inspect].className,info:$('info').innerText.replace(/\s+/g,' ')};
  },[spec,sqv,inspect]);
  const Z=[0,0,0,0,0,0,0,0,0,0], sqv=o=>{const a=Z.slice();Object.keys(o).forEach(k=>a[k]=o[k]);return a;};
  let r;
  r=await show([[6,4,3],[6,5,2],[0,0,-3]],sqv({3:0}),3); chk('Soi co dong doi: bac 4 buff '+r.rank+' '+r.cls,r.rank==='4'&&/buff/.test(r.cls)&&/Bậc hiện tại 4/.test(r.info)&&/đồng đội/.test(r.title));
  r=await show([[6,4,3],[0,0,-3]],sqv({3:0}),3); chk('Soi di le: bac 3, ghi ro ly do',r.rank==='3'&&/đi lẻ/.test(r.info));
  r=await show([[5,3,3],[0,0,-3]],sqv({3:1}),3); chk('Lon rung sat song (4,3) la bac 4',r.rank==='4'&&/kề hồ/.test(r.info));
  r=await show([[6,4,3],[0,0,-3]],sqv({3:1}),3); chk('Lon rung xa ho: bac 3 + ly do',r.rank==='3'&&/chưa kề hồ/.test(r.info));
  r=await show([[7,4,4],[0,0,-3]],sqv({4:0}),4); chk('Cho o hang nha: bac 5',r.rank==='5'&&/khu hang nhà/.test(r.info));
  r=await show([[3,2,4],[0,0,-3]],sqv({4:0}),4); chk('Cho xa hang: bac 4 + ly do',r.rank==='4'&&/xa hang nhà/.test(r.info));
  r=await show([[2,0,4],[8,8,3]],sqv({4:1}),4); chk('Gau vao san dich: bac 5',r.rank==='5'&&/sân địch/.test(r.info));
  r=await show([[7,0,4],[0,8,-3]],sqv({4:1}),4); chk('Gau o nua nha: bac 4 + ly do',r.rank==='4'&&/chưa qua giữa bàn/.test(r.info));
  r=await show([[4,6,5],[0,0,-3]],sqv({5:1}),5); chk('Ca sau duoi ho: bac 6',r.rank==='6'&&/dưới hồ/.test(r.info));
  r=await show([[5,6,5],[0,0,-3]],sqv({5:1}),5); chk('Ca sau trong dam lay: bac 6 (khong con ghi "len can")',r.rank==='6'&&/đầm lầy/.test(r.info)&&!/lên cạn/.test(r.info));
  r=await show([[6,5,5],[0,0,-3]],sqv({5:1}),5); chk('Ca sau tren bo: bac 3 nerf',r.rank==='3'&&/nerf/.test(r.cls)&&/lên cạn/.test(r.info));
  r=await show([[6,4,3],[6,5,2],[0,0,-3]],sqv({3:0}),3);
  await p.waitForTimeout(300); await p.screenshot({path:path.join(__dirname,'rank_ui.png')});
  console.log('ui rank ok',ok,'bad',bad,'errors',errs); process.exit(bad||errs.length?1:0);
})();
