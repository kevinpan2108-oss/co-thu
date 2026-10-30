/* Live PeerJS Cloud smoke test: two independent browser contexts, real signaling + WebRTC data channel. */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

(async()=>{
  const html=fs.readFileSync(path.join(__dirname,'..','dist','game_local.html'));
  const server=http.createServer((req,res)=>{
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(html);
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const url='http://127.0.0.1:'+server.address().port+'/';
  const browser=await chromium.launch();
  const hostContext=await browser.newContext();
  const guestContext=await browser.newContext();
  const host=await hostContext.newPage();
  const guest=await guestContext.newPage();
  const errors=[];
  for(const [name,page] of [['host',host],['guest',guest]]){
    page.on('pageerror',e=>errors.push(name+': '+e.message));
    page.on('console',m=>{if(m.type()==='error'&&!/fonts/.test(m.text()))errors.push(name+': '+m.text());});
  }
  const status=page=>page.locator('#online-status').textContent();
  try{
    await Promise.all([host.goto(url),guest.goto(url)]);
    await Promise.all([host.waitForSelector('#online-create:enabled'),guest.waitForSelector('#online-join:enabled')]);
    await host.click('#online-create');
    await host.waitForFunction(()=>/đã sẵn sàng/i.test(document.querySelector('#online-status').textContent),null,{timeout:40000});
    const code=await host.locator('#online-room-code').inputValue();
    if(!/^[A-Z0-9]{8}$/.test(code))throw new Error('Host did not produce an 8-character room code: '+code);
    // Exercise desktop -> phone shared-link path instead of manually typing the code.
    await guest.goto(url+'?room='+encodeURIComponent(code));
    await guest.waitForSelector('#online-join:enabled');
    const prefilled=await guest.locator('#online-room-code').inputValue();
    if(prefilled!==code)throw new Error('Shared link did not prefill room code. expected='+code+' actual='+prefilled);
    await guest.click('#online-join');
    await host.waitForFunction(()=>/Lượt của Người chơi [12]/i.test(document.querySelector('#online-status').textContent),null,{timeout:45000});
    await guest.waitForFunction(()=>/Lượt của Người chơi [12]/i.test(document.querySelector('#online-status').textContent),null,{timeout:45000});
    const hostState=await host.evaluate(()=>window.__ONLINE_TEST__.get());
    const guestState=await guest.evaluate(()=>window.__ONLINE_TEST__.get());
    if(!hostState.ready||!guestState.ready)throw new Error('A browser did not enter the ready state.');
    if(JSON.stringify(hostState.cells)!==JSON.stringify(guestState.cells))throw new Error('Host and guest received different board states.');
    const hostStatus=await status(host), guestStatus=await status(guest);
    if(hostStatus!==guestStatus)throw new Error('Host and guest turn status differs: '+hostStatus+' / '+guestStatus);
    const hostBoard=await host.locator('#board').evaluate(el=>({flip:el.classList.contains('online-flipped'),transform:getComputedStyle(el).transform}));
    const guestBoard=await guest.locator('#board').evaluate(el=>({flip:el.classList.contains('online-flipped'),transform:getComputedStyle(el).transform}));
    if(hostBoard.flip||guestBoard.flip||hostBoard.transform!==guestBoard.transform)throw new Error('Host and guest board orientation differs: '+JSON.stringify({hostBoard,guestBoard}));
    if(errors.length)throw new Error('Browser console errors: '+errors.join(' | '));
    console.log('LIVE ONLINE PASS: host and guest connected through PeerJS Cloud; board state matches; room='+code);
  }catch(e){
    console.error('LIVE ONLINE FAIL:',e.message,'host=',await status(host).catch(()=>''),'guest=',await status(guest).catch(()=>''),'errors=',JSON.stringify(errors));
    throw e;
  }finally{
    await browser.close().catch(()=>{});
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(e=>{console.error(e);process.exit(1);});
