/* Online multiplayer UI/state regression. Uses a test PeerJS shim; not a live Internet/WebRTC test. */
const { chromium } = require('playwright');
const path = require('path');

(async()=>{
  const browser=await chromium.launch();
  const page=await browser.newPage({viewport:{width:1100,height:900}});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/ERR_|fonts/.test(m.text()))errors.push(m.text());});
  await page.addInitScript(()=>{
    function Peer(id){this.id=id||'fake-guest';this.handlers={};window.__FAKE_PEER_INSTANCE__=this;setTimeout(()=>this.emit('open',this.id),5);}
    Peer.prototype.on=function(n,f){(this.handlers[n]||(this.handlers[n]=[])).push(f);return this;};
    Peer.prototype.emit=function(n,v){(this.handlers[n]||[]).forEach(f=>f(v));};
    Peer.prototype.destroy=function(){};
    window.Peer=Peer;
  });
  await page.goto('file://'+path.join(__dirname,'..',process.env.DIST||'dist','game_local.html'));
  await page.waitForTimeout(250);
  if(!(await page.evaluate(()=>!!window.__ONLINE_TEST__))) throw new Error('Online module was not included in the build');
  let ok=0,bad=0;
  const chk=(name,pass)=>{if(pass)ok++;else{bad++;console.log('FAIL',name);}};
  await page.click('#online-create');
  await page.waitForTimeout(100);
  await page.waitForFunction(()=>!!window.__FAKE_PEER_INSTANCE__);
  await page.waitForTimeout(30);
  const code=await page.locator('#online-room-code').inputValue();
  chk('Host tao ma phong 8 ky tu',/^[A-Z0-9]{8}$/.test(code));
  chk('Host hien trang thai cho doi thu',/Phòng [A-Z0-9]{8} đã sẵn sàng|Đã tạo phòng|Đang chờ người chơi/i.test(await page.locator('#online-status').textContent()));
  await page.evaluate(()=>{
    const c={open:false,handlers:{},sent:[],on(n,f){(this.handlers[n]||(this.handlers[n]=[])).push(f);return this;},
      fire(n,v){if(n==='open')this.open=true;(this.handlers[n]||[]).forEach(f=>f(v));},
      send(v){this.sent.push(v);},close(){}};
    window.__FAKE_CONN__=c;
    window.__FAKE_PEER_INSTANCE__.emit('connection',c);
    c.fire('open');
    c.fire('data',{type:'join'});
  });
  await page.waitForFunction(()=>window.__FAKE_CONN__&&window.__FAKE_CONN__.sent.some(x=>x.type==='start'));
  const state=await page.evaluate(()=>window.__FAKE_CONN__.sent.find(x=>x.type==='start').state);
  chk('Host gui trang thai ban co luc bat dau',Array.isArray(state.cells)&&state.cells.length===95&&state.turn===1);
  chk('Host da vao trang thai online',await page.evaluate(()=>window.__ONLINE_TEST__.get().active&&window.__ONLINE_TEST__.get().ready));
  const hostUi=await page.evaluate(()=>({
    score:[document.querySelector('#sc1-l').textContent,document.querySelector('#sc2-l').textContent],
    teams:[document.querySelector('#who-foe').textContent,document.querySelector('#who-me').textContent],
    settings:document.querySelector('#app').classList.contains('online-mode'),
    boardFlipped:document.querySelector('#board').classList.contains('online-flipped'),
    boardTransform:getComputedStyle(document.querySelector('#board')).transform,
    soundVisible:!!(document.querySelector('#btn-sound').getClientRects().length),
    aiSettingsHidden:['opponent-setting','mode-setting','lvl-box'].every(id=>getComputedStyle(document.getElementById(id)).display==='none')
  }));
  chk('Host co giao dien online dong bo',hostUi.settings&&hostUi.soundVisible&&hostUi.aiSettingsHidden&&!hostUi.boardFlipped);
  chk('Host dung nhan Ban va Doi thu',JSON.stringify(hostUi.score)===JSON.stringify(['Người 1','Người 2'])&&JSON.stringify(hostUi.teams)===JSON.stringify(['Người chơi 2','Người chơi 1']));
  const guestState={...state,turn:-1};
  const applied=await page.evaluate(s=>window.__ONLINE_TEST__.activate(s,-1),guestState);
  chk('Guest nhan va khoi phuc duoc trang thai',applied===true);
  chk('Guest sees the exact same unflipped board direction',!(await page.locator('#board').evaluate(el=>el.classList.contains('online-flipped'))));
  chk('Guest duoc di khi den luot minh',await page.evaluate(()=>window.__E('humanTurn()')===true));
  const guestUi=await page.evaluate(()=>({
    score:[document.querySelector('#sc1-l').textContent,document.querySelector('#sc2-l').textContent],
    teams:[document.querySelector('#who-foe').textContent,document.querySelector('#who-me').textContent],
    settings:document.querySelector('#app').classList.contains('online-mode'),
    guest:document.querySelector('#app').classList.contains('online-guest'),
    boardFlipped:document.querySelector('#board').classList.contains('online-flipped'),
    boardTransform:getComputedStyle(document.querySelector('#board')).transform,
    soundVisible:!!(document.querySelector('#btn-sound').getClientRects().length),
    aiSettingsHidden:['opponent-setting','mode-setting','lvl-box'].every(id=>getComputedStyle(document.getElementById(id)).display==='none')
  }));
  chk('Guest co giao dien online dong bo',guestUi.settings&&!guestUi.guest&&!guestUi.boardFlipped&&guestUi.soundVisible&&guestUi.aiSettingsHidden);
  chk('Hai ben co cung nhan va thu tu giao dien',JSON.stringify(hostUi.score)===JSON.stringify(guestUi.score)&&JSON.stringify(hostUi.teams)===JSON.stringify(guestUi.teams));
  chk('Hai ben thay cung mot huong ban co',hostUi.boardTransform===guestUi.boardTransform&&hostUi.boardFlipped===guestUi.boardFlipped);
  chk('Undo va hint bi khoa trong online',await page.locator('#btn-undo').isDisabled()&&await page.locator('#btn-hint').isDisabled());
  chk('Nut thoat phong hien thi',await page.locator('#online-leave').isVisible());
  console.log('online ui/state ok',ok,'bad',bad,'errors',JSON.stringify(errors));
  await browser.close();
  process.exit(bad||errors.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
