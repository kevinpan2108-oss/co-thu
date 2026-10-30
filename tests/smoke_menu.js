// Smoke test man hinh khoi dau: khong loi JS, moi muc phan hoi khi bam. Chay: node smoke_menu.js (can playwright)
const {chromium}=require('playwright'),path=require('path');
const URL='file://'+path.resolve(__dirname,'../dist/game.html');
let fail=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fail++;};
(async()=>{
const b=await chromium.launch();
async function fresh(vp){const p=await b.newPage({viewport:vp||{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.route(/^https?:/,r=>r.abort());await p.goto(URL);await p.waitForTimeout(500);p._errs=errs;return p;}
let p=await fresh();
ok(p._errs.length===0,'khong co loi JS khi tai trang '+JSON.stringify(p._errs));
ok(await p.evaluate(()=>!document.body.innerText.includes('\\n')),'khong con ky tu \\n thua tren trang');
const menuVisible=()=>p.evaluate(()=>!document.getElementById('main-menu').hidden);
await p.click('#menu-info');ok(await p.evaluate(()=>!document.getElementById('menu-modal').hidden),'Gioi thieu mo hop thoai');
await p.click('#menu-modal-close');ok(await p.evaluate(()=>document.getElementById('menu-modal').hidden),'dong hop thoai');
await p.click('#menu-sound');const s1=await p.evaluate(()=>document.getElementById('menu-sound').getAttribute('aria-pressed'));await p.click('#menu-sound');ok(s1!==await p.evaluate(()=>document.getElementById('menu-sound').getAttribute('aria-pressed')),'nut Am thanh doi trang thai');
await p.click('#menu-music');ok(await p.evaluate(()=>document.getElementById('menu-music').getAttribute('aria-pressed'))==='true','nut Nhac bat nhac');
const th0=await p.evaluate(()=>document.documentElement.getAttribute('data-theme'));ok(th0==='light','giao dien mac dinh la sang (khong theo he thong)');
await p.click('#menu-theme');ok(await p.evaluate(()=>document.documentElement.getAttribute('data-theme'))==='dark','nut Giao dien chuyen sang Toi');
ok(await p.evaluate(()=>getComputedStyle(document.getElementById('main-menu')).backgroundColor)!==await p.evaluate(()=>'rgb(245, 240, 230)'),'nen menu doi mau khi Toi');
await p.reload();await p.waitForTimeout(400);ok(await p.evaluate(()=>document.documentElement.getAttribute('data-theme'))==='dark','giao dien Toi duoc nho sau khi tai lai');
await p.click('#menu-theme');ok(await p.evaluate(()=>document.documentElement.getAttribute('data-theme'))==='light','chuyen lai Mac dinh');
await p.click('#menu-single');ok(!await menuVisible(),'Dau voi may: vao game');
ok(await p.evaluate(()=>!document.getElementById('online-card').offsetParent),'Dau voi may: an khung online');
await p.click('#btn-menu');ok(await menuVisible(),'Menu chinh quay lai trang chu');
await p.click('#menu-local');ok(!await menuVisible(),'Hai nguoi cung may: vao game');
ok(await p.evaluate(()=>document.getElementById('opp-pvp').checked),'Hai nguoi cung may: che do pvp');
await p.click('#btn-menu');
await p.click('#menu-online');ok(!await menuVisible(),'Choi truc tuyen: roi trang chu');
ok(await p.evaluate(()=>!!document.getElementById('online-card').offsetParent),'Choi truc tuyen: hien khung phong');
ok(await p.evaluate(()=>!document.querySelector('.layout').offsetParent),'Choi truc tuyen: an ban co khi chua ket noi');
await p.click('#online-back');ok(await menuVisible(),'Nut Trang chu quay lai menu');
ok(p._errs.length===0,'khong loi JS sau khi bam het cac muc');
await p.close();
// link moi ?room=
const q=await b.newPage();const e2=[];q.on('pageerror',e=>e2.push(e.message));await q.route(/^https?:/,r=>r.abort());await q.goto(URL+'?room=ABCD1234');await q.waitForTimeout(500);
ok(await q.evaluate(()=>document.getElementById('online-room-code').value)==='ABCD1234','?room= dien san ma phong');
ok(await q.evaluate(()=>!document.getElementById('main-menu').offsetParent&&!!document.getElementById('online-card').offsetParent),'?room= mo thang khung online');
ok(e2.length===0,'?room= khong loi JS');
// di dong
const m=await fresh({width:390,height:844});
ok(await m.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'di dong: khong tran ngang');
await m.click('#menu-single');ok(await m.evaluate(()=>document.getElementById('main-menu').hidden),'di dong: bam Dau voi may vao game');
await b.close();console.log(fail?'THAT BAI '+fail:'TAT CA DAT');process.exit(fail?1:0);})();
