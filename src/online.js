/* ---------- Online 2 nguoi: PeerJS + dong bo trang thai ---------- */
var onlineActive=false, onlineReady=false, onlineSide=1, onlineRole='', onlineCode='';
var onlinePeer=null, onlineConn=null, onlineInSeq=0, onlineOutSeq=0;
var onlineApplying=false, onlineSwappedStrips=false, onlineLastResult=null, onlineMode='draft';
var onlineConnectTimer=0, onlineLoadBusy=false, onlineLoadQueue=[], onlineStarting=false;
var onlinePreviousOpp='ai', onlinePreviousMode='draft';

var localPvp=pvp, localPn=pn, localPnl=pnl, localHumanTurn=humanTurn, localIsHumanSide=isHumanSide;
pvp=function(){ return onlineActive||localPvp(); };
pn=function(side){ return onlineActive?(side===onlineSide?'Bạn':'Đối thủ'):localPn(side); };
pnl=function(side){ return onlineActive?(side===onlineSide?'bạn':'đối thủ'):localPnl(side); };
humanTurn=function(){ return onlineActive?(!over&&!thinking&&onlineReady&&turn===onlineSide):localHumanTurn(); };
isHumanSide=function(side){ return onlineActive?(onlineReady&&side===onlineSide):localIsHumanSide(side); };

var localUpdateStatus=updateStatus;
updateStatus=function(){
  localUpdateStatus();
  if(onlineActive&&!onlineReady&&!over){
    $('pill').className='pill';
    $('pill-text').textContent=onlineRole==='host'?'Đang chờ đối thủ':'Đang kết nối phòng';
  }
};
var localUpdateScore=updateScore;
updateScore=function(){
  localUpdateScore();
  if(onlineActive){
    $('sc1-l').textContent=onlineSide===1?'Bạn':'Đối thủ';
    $('sc2-l').textContent=onlineSide===-1?'Bạn':'Đối thủ';
    if(onlineSide<0){var v1=$('wins').textContent,v2=$('losses').textContent;$('wins').textContent=v2;$('losses').textContent=v1;}
  }
};
var localUpdateStrips=updateStrips;
updateStrips=function(){
  localUpdateStrips();
  if(onlineActive){
    $('who-me').textContent='Bạn';
    $('who-foe').textContent='Đối thủ';
    if(onlineSide===-1){
      var a=$('cnt-me').textContent, b=$('cnt-foe').textContent;
      $('cnt-me').textContent=b; $('cnt-foe').textContent=a;
      setOc('oc-me',-1); setOc('oc-foe',1);
    }
  }
};
var localUpdateButtons=updateButtons;
updateButtons=function(){
  localUpdateButtons();
  if(onlineActive){
    $('btn-new').disabled=true;
    $('btn-undo').disabled=true;
    $('btn-hint').disabled=true;
    $('btn-undo').hidden=true;
    $('btn-hint').hidden=true;
    $('res-new').hidden=true;
    $('online-rematch').hidden=!(onlineReady&&over);
  }else{
    $('btn-undo').hidden=false;
    $('btn-hint').hidden=false;
    $('res-new').hidden=false;
    $('online-rematch').hidden=true;
  }
};

function onlineStatus(message,kind){
  var el=$('online-status');
  if(!el)return;
  el.textContent=message;
  el.className='online-status'+(kind?' '+kind:'');
}
function onlineCodeMake(){
  var chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out='', a=new Uint8Array(8), i;
  if(window.crypto&&crypto.getRandomValues) crypto.getRandomValues(a);
  else for(i=0;i<a.length;i++) a[i]=(Math.random()*256)|0;
  for(i=0;i<8;i++) out+=chars[a[i]%chars.length];
  return out;
}
function onlinePeerId(code){ return 'cothu-'+String(code||'').toLowerCase(); }
function onlineLoadPeer(done){
  if(window.Peer){done(null);return;}
  onlineLoadQueue.push(done);
  if(onlineLoadBusy)return;
  onlineLoadBusy=true;
  var urls=[
    'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js',
    'https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js'
  ], index=0;
  function next(){
    if(window.Peer){finish(null);return;}
    if(index>=urls.length){finish(new Error('Không tải được PeerJS từ CDN.'));return;}
    var s=document.createElement('script'), url=urls[index++];
    s.src=url; s.async=true;
    s.onload=function(){ if(window.Peer)finish(null); else next(); };
    s.onerror=next;
    document.head.appendChild(s);
  }
  function finish(err){
    onlineLoadBusy=false;
    var q=onlineLoadQueue.splice(0);
    q.forEach(function(fn){fn(err);});
  }
  next();
}
function onlinePeerOptions(){
  /*
   * Let PeerJS select its own Cloud PeerServer defaults.
   * The public Cloud broker is shared; explicitly pinning host/path/port
   * is unnecessary and can make the client diverge from its supported defaults.
   * Keep the documented default STUN + PeerJS TURN relay list.
   */
  return {
    debug:2,
    secure:true,
    config:{
      iceServers:[
        {urls:'stun:stun.l.google.com:19302'},
        {
          urls:[
            'turn:eu-0.turn.peerjs.com:3478',
            'turn:us-0.turn.peerjs.com:3478'
          ],
          username:'peerjs',
          credential:'peerjsp'
        }
      ],
      sdpSemantics:'unified-plan'
    }
  };
}
function onlineNewPeer(id){
  var opts=onlinePeerOptions();
  return id?new window.Peer(id,opts):new window.Peer(opts);
}
function onlinePeerErrorText(e,role){
  var type=e&&e.type?e.type:'unknown';
  var specific={
    'unavailable-id':'Mã phòng bị trùng. Hãy thoát và tạo phòng mới.',
    'peer-unavailable':'Không tìm thấy phòng. Kiểm tra mã và đảm bảo người tạo phòng vẫn đang mở game.',
    'network':'Không kết nối được máy chủ ghép phòng PeerJS qua cổng 443. Kiểm tra mạng hoặc thử đổi Wi-Fi/4G.',
    'socket-error':'Kênh kết nối tới máy chủ phòng bị lỗi. Hãy tải lại game và thử lại.',
    'socket-closed':'Máy chủ phòng đã đóng kết nối. Hãy tải lại game và tạo phòng mới.',
    'server-error':'Máy chủ ghép phòng trả về lỗi. Hãy thử tạo phòng mới sau ít phút.',
    'browser-incompatible':'Trình duyệt không hỗ trợ WebRTC. Hãy mở bằng Chrome, Edge hoặc Safari bản mới.',
    'webrtc':'Hai thiết bị chưa thiết lập được đường truyền WebRTC. Có thể mạng di động/Wi-Fi đang chặn kết nối ngang hàng.',
    'ssl-unavailable':'Không thiết lập được kết nối bảo mật tới máy chủ ghép phòng.',
    'invalid-id':'Mã phòng không hợp lệ. Hãy tạo mã mới.',
    'disconnected':'Trình duyệt đã ngắt khỏi máy chủ ghép phòng. Hãy tải lại game.'
  };
  return (specific[type]||('Lỗi kết nối online ('+type+'). '+(e&&e.message?e.message:''))).trim();
}
function onlineClearConnectTimer(){
  if(onlineConnectTimer){clearTimeout(onlineConnectTimer);onlineConnectTimer=0;}
}
function onlineWirePeerErrors(peer,role){
  peer.on('error',function(e){
    var type=e&&e.type?e.type:'unknown';
    if(type==='peer-unavailable'){
      onlineClearConnectTimer();
      onlineStatus('Không tìm thấy phòng này trên máy chủ. Hãy để máy tính mở phòng ở trạng thái “Phòng … đã sẵn sàng”, rồi tạo mã mới và gửi lại link.','bad');
      return;
    }
    if(type==='webrtc'){
      onlineClearConnectTimer();
      onlineStatus('Đã tìm thấy phòng nhưng hai thiết bị không tạo được đường truyền WebRTC. Hãy thử cho máy tính dùng Wi-Fi và điện thoại dùng 4G/5G, hoặc đổi ngược lại.','bad');
      return;
    }
    if(type==='network'||type==='socket-error'||type==='socket-closed'||type==='server-error'){
      onlineClearConnectTimer();
    }
    onlineStatus(onlinePeerErrorText(e,role),'bad');
  });
  peer.on('disconnected',function(){
    onlineClearConnectTimer();
    onlineStatus('Đã mất kết nối tới máy chủ ghép phòng. Đang thử khôi phục…','bad');
    try{if(peer&&peer.disconnected)peer.reconnect();}catch(e){}
  });
}
function onlineCopyLink(){
  var url=location.href.split('#')[0].split('?')[0]+'?room='+encodeURIComponent(onlineCode);
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(url).then(function(){onlineStatus('Đã sao chép liên kết phòng. Gửi cho người chơi còn lại nhé.','good');},function(){onlineStatus('Mã phòng: '+onlineCode+' · Hãy sao chép mã để gửi cho bạn.');});
  }else{
    $('online-room-code').value=onlineCode;
    $('online-room-code').focus(); $('online-room-code').select();
    onlineStatus('Mã phòng: '+onlineCode+' · Hãy sao chép mã để gửi cho bạn.');
  }
}
function onlineSetControls(locked){
  Array.prototype.forEach.call(document.querySelectorAll('input[name="opp"],input[name="mode"],input[name="lvl"]'),function(el){el.disabled=!!locked;});
  $('btn-new').disabled=!!locked;
  $('online-create').disabled=!!locked;
  $('online-join').disabled=!!locked;
  $('online-leave').hidden=!locked;
  $('online-room-code').readOnly=!!locked;
  $('online-copy').hidden=!(locked&&onlineRole==='host'&&!!onlineCode);
  $('online-rematch').hidden=true;
}
function onlineSwapStrips(){
  var a=$('strip-me'), b=$('strip-foe'), frag=document.createDocumentFragment();
  while(a.firstChild)frag.appendChild(a.firstChild);
  while(b.firstChild)a.appendChild(b.firstChild);
  b.appendChild(frag);
}
function onlineSetPerspective(side){
  if(side<0&&!onlineSwappedStrips){onlineSwapStrips();onlineSwappedStrips=true;}
  else if(side>0&&onlineSwappedStrips){onlineSwapStrips();onlineSwappedStrips=false;}
  onlineSide=side;
  boardEl.classList.toggle('online-flipped',side<0);
  $('who-me').textContent='Bạn'; $('who-foe').textContent='Đối thủ';
}
function onlineActivate(side,role){
  onlineActive=true; onlineReady=false; onlineRole=role; onlineSetPerspective(side);
  oppKey='pvp'; $('opp-pvp').checked=true;
  onlineSetControls(true);
  updateScore();
  if(typeof cells!=='undefined'&&cells&&cells.length) refresh();
  onlineStatus(role==='host'?'Đang chờ người chơi tham gia phòng '+onlineCode+'…':'Đang kết nối phòng…');
  setBubble('🌐',role==='host'?'Đã tạo phòng. Gửi mã phòng cho bạn của bạn.':'Đang kết nối với đối thủ…');
}
function onlineModeForHost(){
  onlineMode=modeKey==='basic'?'basic':'draft';
  applyOpp('pvp',true);
  applyMode(onlineMode);
  EN.setClassic(onlineMode==='basic');
}
function onlineStartHostGame(){
  onlineModeForHost();
  var me=onlineMode==='basic'?zero():randSq(Math.random,true);
  var foe=onlineMode==='basic'?zero():randSq(Math.random,true);
  onlineLastResult=null; onlineReady=true; onlineOutSeq=0; onlineInSeq=0;
  begin(me,foe,null);
  onlineSetPerspective(1); onlineSetControls(true);
  onlineStatus('Đã kết nối! Bạn đi trước. Mã phòng: '+onlineCode,'good');
  setBubble('🌐','Đã kết nối đối thủ. Đội hình được chọn tự động cho ván online này.');
}
function onlineSnapshot(){
  return {
    cells:Array.from(cells),turn:turn,lastMove:lastMove,
    bonus:bonus?{side:bonus.side,steps:bonus.steps.slice(),skipOK:!!bonus.skipOK}:null,
    over:!!over,posHist:posHist.slice(),startCnt:startCnt.slice(),
    sq0:SQ[0].slice(),sq1:SQ[1].slice(),classic:EN.isClassic(),mode:onlineMode,
    result:onlineLastResult
  };
}
function onlineSend(type,state){
  if(!onlineConn||!onlineConn.open)return false;
  try{onlineConn.send({type:type,seq:++onlineOutSeq,state:state||null});return true;}
  catch(e){onlineStatus('Không gửi được dữ liệu ván cờ. Đang thử lại…','bad');return false;}
}
function onlineSendState(type){
  if(!onlineActive||!onlineReady||onlineApplying)return;
  if(!onlineSend(type||'state',onlineSnapshot())) onlineStatus('Mất kết nối tới đối thủ. Hãy kiểm tra mạng.','bad');
}
function onlineApplySnapshot(s,isStart){
  if(!s||!Array.isArray(s.cells)||s.cells.length!==N+EN.ST||!(s.turn===1||s.turn===-1))return false;
  onlineApplying=true;
  try{
    if(isStart){
      applyOpp('pvp',true);
      onlineMode=s.mode==='basic'?'basic':'draft';
      applyMode(onlineMode);
      EN.setClassic(!!s.classic);
      onlineReady=true;
    }
    if(!Array.isArray(s.sq0)||!Array.isArray(s.sq1)||s.sq0.length!==10||s.sq1.length!==10)return false;
    SQ[0]=s.sq0.slice(); SQ[1]=s.sq1.slice(); EN.setKeys();
    EN.setClassic(!!s.classic);
    cells=Int8Array.from(s.cells);
    turn=s.turn; lastMove=s.lastMove||null;
    bonus=s.bonus?{side:s.bonus.side,steps:s.bonus.steps.slice(),skipOK:!!s.bonus.skipOK}:null;
    over=!!s.over; thinking=false; history=[];
    startCnt=Array.isArray(s.startCnt)?s.startCnt.slice():[8,8];
    posHist=Array.isArray(s.posHist)?s.posHist.slice():[EN.hashOf(cells,turn)];
    onlineLastResult=s.result||null;
    deselect(); clearHint(); cancelThink(); syncHeroes(); renderRoster(); renderRules();
    $('draft').hidden=true; resultEl.hidden=true;
    refresh();
    if(s.result){
      if(s.result.type==='win')finish(s.result.winner,s.result.why,s.result.code);
      else if(s.result.type==='draw')finishDraw(s.result.stuck,s.result.why);
    }
    onlineReady=true;
    onlineStatus(over?'Ván đã kết thúc.':(turn===onlineSide?'Đến lượt bạn.':'Đang chờ đối thủ đi…'),'good');
    updateButtons();
  }catch(e){
    onlineStatus('Dữ liệu ván cờ không hợp lệ.','bad');
    return false;
  }finally{onlineApplying=false;}
  return true;
}
function onlineHandleData(msg){
  if(!msg||typeof msg!=='object')return;
  if(msg.type==='join'&&onlineRole==='host'){
    if(onlineReady){try{onlineConn.close();}catch(e){}return;}
    onlineStartHostGame();
    onlineSend('start',onlineSnapshot());
    return;
  }
  if(msg.type==='start'&&onlineRole==='guest'){
    if(!msg.state||typeof msg.seq!=='number')return;
    onlineInSeq=msg.seq;
    if(onlineApplySnapshot(msg.state,true)){
      onlineStatus(turn===onlineSide?'Đến lượt bạn.':'Đang chờ đối thủ đi…','good');
      setBubble('🌐','Đã vào phòng! Đối thủ đang ở phía bên kia bàn cờ.');
    }
    return;
  }
  if(msg.type==='state'&&onlineActive&&onlineReady){
    if(typeof msg.seq!=='number'||msg.seq<=onlineInSeq)return;
    onlineInSeq=msg.seq;
    onlineApplySnapshot(msg.state,false);
    onlineStatus(over?'Ván đã kết thúc.':(turn===onlineSide?'Đến lượt bạn.':'Đang chờ đối thủ đi…'),'good');
    return;
  }
  if(msg.type==='rematch-request'&&onlineRole==='host'){
    onlineStartHostGame();
    onlineSend('start',onlineSnapshot());
  }
}
function onlineAttachConnection(conn,role){
  onlineConn=conn;
  conn.on('open',function(){
    if(role==='guest'){
      onlineStatus('Đã kết nối máy chủ phòng, đang chờ chủ phòng…');
      try{conn.send({type:'join'});}catch(e){}
    }else onlineStatus('Có người chơi đang kết nối…');
    if(onlineConnectTimer){clearTimeout(onlineConnectTimer);onlineConnectTimer=0;}
  });
  conn.on('data',onlineHandleData);
  conn.on('close',function(){
    if(onlineConn===conn)onlineConn=null;
    if(onlineActive){onlineReady=false;onlineStatus('Đối thủ đã ngắt kết nối. Nhấn “Thoát phòng”, rồi nhập lại cùng mã để kết nối lại.','bad');if(typeof cells!=='undefined'&&cells&&cells.length)refresh();}
  });
  conn.on('error',function(e){onlineStatus('Đường truyền giữa hai thiết bị gặp lỗi ('+(e&&e.type?e.type:'unknown')+'). Hãy thử đổi giữa Wi-Fi và 4G/5G. '+(e&&e.message?e.message:''),'bad');});
}
function onlineCreateRoom(){
  if(onlineActive||onlineStarting)return;
  onlineStarting=true; $('online-create').disabled=true; $('online-join').disabled=true;
  onlinePreviousOpp=oppKey; onlinePreviousMode=modeKey;
  onlineStatus('Đang tải thư viện kết nối online…');
  onlineLoadPeer(function(err){
    onlineStarting=false;
    if(err||!window.Peer){$('online-create').disabled=false;$('online-join').disabled=false;onlineStatus('Không tải được PeerJS từ CDN. Hãy thử đổi mạng hoặc tải lại trang.','bad');return;}
    if(onlineActive)return;
    onlineCode=onlineCodeMake(); onlineRole='host'; onlineActivate(1,'host');
    $('online-room-code').value=onlineCode;
    var id=onlinePeerId(onlineCode);
    try{onlinePeer=onlineNewPeer(id);}
    catch(e){onlineDisconnect(false);onlineStatus('Không khởi tạo được kết nối online: '+e.message,'bad');return;}
    onlineWirePeerErrors(onlinePeer,'host');
    onlinePeer.on('open',function(){
      if(onlineConnectTimer){clearTimeout(onlineConnectTimer);onlineConnectTimer=0;}
      onlineStatus('Phòng '+onlineCode+' đã sẵn sàng. Gửi mã này cho người chơi còn lại.','good');
      $('online-copy').hidden=false;
      if(onlineConnectTimer)clearTimeout(onlineConnectTimer);
      onlineConnectTimer=setTimeout(function(){
        if(onlineActive&&!onlineReady)onlineStatus('Phòng vẫn mở. Đang chờ người chơi nhập mã…');
      },45000);
    });
    onlineConnectTimer=setTimeout(function(){if(onlineActive&&!onlineReady)onlineStatus('Chưa kết nối được máy chủ tạo phòng. Kiểm tra mạng hoặc thử đổi Wi-Fi/4G rồi tạo lại.','bad');},15000);
    onlinePeer.on('connection',function(conn){
      if(onlineConn){try{conn.close();}catch(e){}return;}
      onlineAttachConnection(conn,'host');
    });
  });
}
function onlineJoinRoom(){
  if(onlineActive||onlineStarting)return;
  var code=String($('online-room-code').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(!/^[A-Z0-9]{8}$/.test(code)){onlineStatus('Mã phòng cần đúng 8 ký tự.','bad');return;}
  onlineStarting=true; $('online-create').disabled=true; $('online-join').disabled=true;
  onlinePreviousOpp=oppKey; onlinePreviousMode=modeKey;
  onlineLoadPeer(function(err){
    onlineStarting=false;
    if(err||!window.Peer){onlineDisconnect(false);$('online-create').disabled=false;$('online-join').disabled=false;onlineStatus('Không tải được PeerJS từ CDN. Hãy thử đổi mạng hoặc tải lại trang.','bad');return;}
    if(onlineActive)return;
    onlineCode=code; onlineRole='guest'; onlineActivate(-1,'guest');
    try{onlinePeer=onlineNewPeer();}
    catch(e){onlineDisconnect(false);onlineStatus('Không khởi tạo được kết nối online: '+e.message,'bad');return;}
    onlineWirePeerErrors(onlinePeer,'guest');
    onlinePeer.on('open',function(){
      if(onlineConnectTimer){clearTimeout(onlineConnectTimer);onlineConnectTimer=0;}
      onlineStatus('Đã vào máy chủ ghép phòng. Đang kết nối tới chủ phòng…');
      try{onlineAttachConnection(onlinePeer.connect(onlinePeerId(code),{reliable:true}),'guest');}
      catch(e){onlineStatus('Không thể tham gia phòng: '+e.message,'bad');}
      if(onlineConnectTimer)clearTimeout(onlineConnectTimer);
      onlineConnectTimer=setTimeout(function(){
        if(onlineActive&&!onlineReady)onlineStatus('Máy chủ đã nhận yêu cầu nhưng chưa mở được kết nối với máy tính. Kiểm tra máy tính còn mở phòng; nếu có, hãy thử đổi Wi-Fi/4G/5G trên một trong hai thiết bị.','bad');
      },25000);
    });
    onlineConnectTimer=setTimeout(function(){if(onlineActive&&!onlineReady)onlineStatus('Thiết bị chưa kết nối được máy chủ ghép phòng. Thử đổi Wi-Fi/4G/5G và tải lại game.','bad');},15000);
  });
}
function onlineDisconnect(resetGame){
  if(onlineConnectTimer){clearTimeout(onlineConnectTimer);onlineConnectTimer=0;}
  try{if(onlineConn)onlineConn.close();}catch(e){}
  try{if(onlinePeer)onlinePeer.destroy();}catch(e){}
  onlineConn=null;onlinePeer=null;onlineActive=false;onlineReady=false;onlineRole='';onlineCode='';onlineSide=1;
  onlineInSeq=0;onlineOutSeq=0;onlineLastResult=null;onlineMode='draft';
  onlineSetPerspective(1);onlineSetControls(false);
  $('online-copy').hidden=true; $('online-room-code').value='';
  applyOpp(onlinePreviousOpp,true);
  applyMode(onlinePreviousMode);
  updateScore();
  if(typeof cells!=='undefined'&&cells&&cells.length) refresh();
  onlineStatus('Đã thoát phòng. Có thể chơi lại hoặc tạo phòng mới.');
  newGame();
}
function onlineAskRematch(){
  if(!onlineActive||!onlineReady||!over)return;
  if(onlineRole==='host'){
    onlineStartHostGame();
    onlineSend('start',onlineSnapshot());
  }else{
    try{onlineConn.send({type:'rematch-request'});onlineStatus('Đã gửi yêu cầu chơi ván mới cho chủ phòng.');}
    catch(e){onlineStatus('Không gửi được yêu cầu.','bad');}
  }
}
var localApplyMove=applyMove;
applyMove=function(f,t,k,mv){
  localApplyMove(f,t,k,mv);
  onlineSendState('state');
};
var localApplyBonusStep=applyBonusStep;
applyBonusStep=function(f,t){
  localApplyBonusStep(f,t);
  onlineSendState('state');
};
var localSkipBonus=skipBonus;
skipBonus=function(){
  localSkipBonus();
  onlineSendState('state');
};
var localFinish=finish;
finish=function(winner,why,code){
  if(onlineActive&&!onlineApplying)onlineLastResult={type:'win',winner:winner,why:why,code:code};
  localFinish(winner,why,code);
};
var localFinishDraw=finishDraw;
finishDraw=function(stuck,why){
  if(onlineActive&&!onlineApplying)onlineLastResult={type:'draw',stuck:stuck,why:why};
  localFinishDraw(stuck,why);
};

$('online-create').addEventListener('click',onlineCreateRoom);
$('online-join').addEventListener('click',onlineJoinRoom);
$('online-copy').addEventListener('click',onlineCopyLink);
$('online-leave').addEventListener('click',function(){onlineDisconnect(true);});
$('online-rematch').addEventListener('click',onlineAskRematch);
$('online-room-code').addEventListener('keydown',function(e){if(e.key==='Enter')onlineJoinRoom();});
try{
  var roomFromUrl=new URLSearchParams(location.search).get('room');
  if(roomFromUrl&&/^[A-Za-z0-9]{8}$/.test(roomFromUrl)){
    $('online-room-code').value=roomFromUrl.toUpperCase();
    onlineStatus('Đã nhận mã phòng từ liên kết. Nhấn “Vào phòng” để tham gia.');
  }
}catch(e){}
onlineStatus('Chưa kết nối. Tạo phòng hoặc nhập mã phòng để chơi.');
window.__ONLINE_TEST__={
  snapshot:onlineSnapshot,
  apply:function(s){return onlineApplySnapshot(s,true);},
  activate:function(s,side){onlineActive=true;onlineReady=true;onlineRole='guest';onlineSetPerspective(side||-1);return onlineApplySnapshot(s,true);},
  get:function(){return {active:onlineActive,ready:onlineReady,side:onlineSide,turn:turn,over:over,cells:Array.from(cells)};}
};
