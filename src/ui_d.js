
/* ---------- Luat lap the: nuoc di lam mot the co xuat hien lan thu 3 bi cam ---------- */
function repCount(h){ var n=0,i; for(i=0;i<posHist.length;i++) if(posHist[i]===h) n++; return n; }
function repBannedM(m,side){
  var f=m&127,t=(m>>7)&127,k=(m>>14)&15;
  if(k===0&&DEN[t]===-side&&((m>>18)&127)===((m>>25)&127)) return false;
  var c=Int8Array.from(cells); EN.commitM(c,m);
  return repCount(EN.hashOf(c,-side))>=2;
}
/* Nuoc nguoi choi (mot buoc): neu chiem duoc tien don thi con buoc thuong, chi cam khi khong cach nao tao the moi. */
function repBanned(f,t,k,side){
  if(k===0&&DEN[t]===-side) return false;
  var c=Int8Array.from(cells), elig=EN.bonusEligible(cells,side,f,t,k), steps, i, c2;
  EN.commit(c,f,t,k);
  if(repCount(EN.hashOf(c,-side))<2) return false;
  if(!elig) return true;
  steps=EN.bonusSteps(c,side);
  for(i=0;i<steps.length;i++){
    c2=Int8Array.from(c); EN.commitBonus(c2,steps[i]&127,(steps[i]>>7)&127);
    if(repCount(EN.hashOf(c2,-side))<2) return false;
  }
  return true;
}
function banList(side){ return genMoves(cells,side).filter(function(m){return repBannedM(m,side);}); }
function hasLegal(side){
  var ms=genMoves(cells,side), i;
  for(i=0;i<ms.length;i++) if(!repBannedM(ms[i],side)) return true;
  return false;
}

/* ---------- May tinh toan chay nen ---------- */
var worker=null, workerBad=false, wId=0, wCb=null, wPending=null;
function mkWorker(){
  try{
    var src='(function(){var E=('+engineSrc+')();onmessage=function(ev){var d=ev.data;E.SQ[0]=d.sq0;E.SQ[1]=d.sq1;E.setClassic(d.classic);E.setAI(d.aiMask);var r=E.search(new Int8Array(d.cells),d.side,d.level,d.recent,d.ban);postMessage({id:d.id,mv:r});};})();';
    var w=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
    w.onmessage=function(ev){ if(wCb&&ev.data.id===wId){var cb=wCb;wCb=null;wPending=null;cb(ev.data.mv);} };
    w.onerror=function(){
      workerBad=true; try{w.terminate();}catch(e){} worker=null;
      if(wCb&&wPending){ var cb=wCb,p=wPending; wCb=null; wPending=null; setTimeout(function(){EN.setAI(p.aiMask);cb(EN.search(Int8Array.from(p.cells),p.side,p.level,p.recent,p.ban));},20); }
    };
    return w;
  }catch(e){ workerBad=true; return null; }
}
function think(side,lv,done){
  var id=++wId, payload={id:id,cells:Array.from(cells),side:side,level:lv,recent:posHist.slice(-14),ban:banList(side),sq0:SQ[0].slice(),sq1:SQ[1].slice(),classic:EN.isClassic(),aiMask:4};
  wCb=done; wPending=payload;
  if(!worker&&!workerBad) worker=mkWorker();
  if(worker){ try{ worker.postMessage(payload); return; }catch(e){ workerBad=true; worker=null; } }
  setTimeout(function(){ if(wCb!==done) return; wCb=null; wPending=null; EN.setAI(payload.aiMask); done(EN.search(Int8Array.from(cells),side,lv,posHist.slice(-14),payload.ban)); },30);
}
function cancelThink(){ wCb=null; wPending=null; wId++; if(worker){ try{worker.terminate();}catch(e){} worker=null; } }

/* ---------- Nuoc di ---------- */
function clearHint(){hint=null;clearTimeout(hintTimer);}
function deselect(){selected=-1;legal=[];legalKind={};}
function destOf(f,t,k){ return k===9?(f+t)>>1:(k===6||k===7?f:t); }

function isHumanSide(s){ return pvp()||s===1; }
function applyMove(f,t,k,mv){
  k=k||0;
  var code=cells[f], s=code>0?1:-1, rk=Math.abs(code), tcode=cells[t], K=HK[code+9], bonusOK=EN.bonusEligible(cells,s,f,t,k);
  history.push({cells:Int8Array.from(cells),turn:turn,last:lastMove,ph:posHist.length});
  var msg=describe(f,t,code,tcode,k);
  var cap=commit(cells,f,t,k);
  lastMove={f:f,t:(k===6||k===7)?t:destOf(f,t,k)};
  deselect(); clearHint(); inspectCode=0; previewRank=0; previewHero=null;
  var el=pieceEls[code];
  el.classList.add('moving'); setTimeout(function(){el.classList.remove('moving');},520);
  var face=el.firstElementChild, anim=(k===1||k===2)?'leap':(k===3||k===7||k===8||k===9)?'dash':'hop';
  face.classList.remove('hop','leap','dash'); void face.offsetWidth; face.classList.add(anim);
  setTimeout(function(){face.classList.remove('hop','leap','dash');},700);
  if(k===5){ sfx.swap(); burst(f,['✨']); burst(t,['✨']); }
  else if(k===6){ sfx.snipe(); burst(t,['🎯','💥']); }
  else if(k===7){ sfx.capture(); burst(t,['🎯','💥','⭐']); }
  else if(k===9){
    sfx.capture(); burst(t,['💢','💥']); burst((f+t)>>1,['💨']);
    frameEl.classList.remove('shake'); void frameEl.offsetWidth; frameEl.classList.add('shake');
  }else if(tcode){
    sfx.capture(); burst(t,['💥','⭐','✨']);
    if(rk>=6&&rk<9){frameEl.classList.remove('shake');void frameEl.offsetWidth;frameEl.classList.add('shake');}
  }else if(k===1||k===2){ sfx.jump(); if(k===2) burst(t,['🐾','☁️']); }
  else if(k===3||k===8){ sfx.dash(); burst(t,['💨']); }
  else if(k===4){ sfx.move(); burst(t,['🍃']); }
  else if(WATER[t]||WATER[f]) sfx.splash();
  else sfx.move();
  setBubble(msg.emo,msg.text);

  if(k===0&&DEN[t]===-s){ refresh(); finish(s,'den',code); return; }
  var cn=EN.counts(cells), oppLeft=s>0?cn[1]:cn[0];
  if(oppLeft===0){ refresh(); finish(s,'pieces',code); return; }
  if(bonusOK){
    if(isHumanSide(s)){
      var st=bonusStepsFor(s);
      if(st.steps.length){
        bonus={side:s,steps:st.steps,skipOK:st.skipOK}; thinking=false; deselect();
        refresh(); setBubble('🚩','Chiếm tiền đồn! Chọn một quân đi thêm 1 ô'+(st.skipOK?', hoặc bấm Bỏ qua thưởng.':'.'));
        return;
      }
    }else if(mv&&mv.bf!==undefined&&mv.bf!==mv.bt){
      var my=token; thinking=true; refresh();
      setTimeout(function(){ if(my!==token) return; applyBonusStep(mv.bf,mv.bt); },650);
      return;
    }
  }
  endTurn(s,code);
}
/* Buoc thuong hop le (khong tao the lap lan 3). */
function bonusStepsFor(s){
  var steps=EN.bonusSteps(cells,s), ok=[], i, c2;
  for(i=0;i<steps.length;i++){
    c2=Int8Array.from(cells); EN.commitBonus(c2,steps[i]&127,(steps[i]>>7)&127);
    if(repCount(EN.hashOf(c2,-s))<2) ok.push(steps[i]);
  }
  return {steps:ok,skipOK:repCount(EN.hashOf(cells,-s))<2||!ok.length};
}
function applyBonusStep(f,t){
  var code=cells[f], s=code>0?1:-1, el=pieceEls[code], face=el.firstElementChild, h=hero(code);
  EN.commitBonus(cells,f,t);
  lastMove={f:f,t:t}; bonus=null; deselect(); clearHint(); inspectCode=0;
  el.classList.add('moving'); setTimeout(function(){el.classList.remove('moving');},520);
  face.classList.remove('hop','leap','dash'); void face.offsetWidth; face.classList.add('hop');
  setTimeout(function(){face.classList.remove('hop','leap','dash');},700);
  if(WATER[t]||WATER[f]) sfx.splash(); else sfx.move();
  setBubble('🚩',pn(s)+': bước thưởng tiền đồn, '+h.n+' đi thêm 1 ô.');
  thinking=false;
  endTurn(s,code);
}
function skipBonus(){
  if(!bonus||!bonus.skipOK) return;
  var s=bonus.side; bonus=null; deselect();
  setBubble('🚩','Đã bỏ qua bước thưởng.');
  endTurn(s,0);
}
function endTurn(s,code){
  var opp=genMoves(cells,-s);
  if(!opp.length){ refresh(); finishDraw(-s,'moves'); return; }
  if(!hasLegal(-s)){ refresh(); finishDraw(-s,'rep'); return; }
  turn=-s;
  posHist.push(EN.hashOf(cells,turn));
  refresh();
  if(turn===-1&&!pvp()) scheduleAI();
}

function finishDraw(stuck,why){
  over=true; thinking=false; bonus=null; cancelThink(); deselect();
  var sub=why==='rep'?pn(stuck)+' chỉ còn nước lặp thế lần thứ 3 (bị cấm), không còn nước đi hợp lệ.':pn(stuck)+' không còn nước đi nào.';
  $('res-emoji').textContent='🤝'; $('res-title').textContent='Ván hòa'; $('res-sub').textContent=sub+' Chưa ai thắng nên ván hòa.';
  counted=0;
  setTimeout(function(){resultEl.hidden=false;},650);
  updateScore(); updateStatus(); updateButtons();
}

function finish(winner,why,code){
  over=true; thinking=false; cancelThink(); deselect();
  var mine=winner===1, loser=-winner, sub, title, emoji;
  if(why==='den') sub='Quân của '+pnl(winner)+' đã vào hang của '+pnl(loser)+'.';
  else if(why==='pieces') sub=(pn(loser)==='Máy'?'Máy':pn(loser))+' chỉ còn lại Rùa hoặc đã hết quân.';
  else if(why==='rep') sub=pn(loser)+' chỉ còn nước lặp thế lần thứ 3 (bị cấm) nên không còn nước đi hợp lệ.';
  else sub=pn(loser)+' không còn nước đi nào.';
  if(pvp()){ title=pn(winner)+' thắng!'; emoji=why==='den'?hero(code).e:'🏆'; }
  else{ title=mine?'Bạn thắng rồi!':'Máy thắng ván này'; emoji=why==='den'?hero(code).e:(mine?'🏆':'🐾'); if(!mine) sub+=' Thử lại nhé, đàn thú của bạn sẽ khá hơn.'; }
  $('res-emoji').textContent=emoji; $('res-title').textContent=title; $('res-sub').textContent=sub;
  setTimeout(function(){resultEl.hidden=false;},650);
  if(pvp()){
    if(mine){p1w++;store('cothu:p1',String(p1w));}else{p2w++;store('cothu:p2',String(p2w));}
    counted=mine?1:-1;
    setTimeout(function(){sfx.win();confetti();},500);
  }else if(mine){wins++;counted=1;markChal();store('cothu:w',String(wins));setTimeout(function(){sfx.win();confetti();},500);}
  else{losses++;counted=-1;store('cothu:l',String(losses));setTimeout(sfx.lose,500);}
  updateScore(); updateStatus(); updateButtons();
}

/* ---------- May danh ---------- */
function scheduleAI(){
  thinking=true; updateStatus(); updateButtons();
  var my=token, started=Date.now();
  think(-1,curLevel,function(mv){
    if(my!==token) return;
    var wait=Math.max(0,650-(Date.now()-started));
    setTimeout(function(){
      if(my!==token) return;
      thinking=false;
      if(mv) applyMove(mv.f,mv.t,mv.k,mv);
    },wait);
  });
}

/* ---------- Dieu khien nguoi choi ---------- */
function select(i){
  selected=i; legal=[]; legalKind={};
  var nb=0;
  movesFrom(cells,i,[]).forEach(function(m){var t=(m>>7)&127, k=(m>>14)&15; if(repBanned(i,t,k,cells[i]>0?1:-1)){nb++;return;} legal.push(t); legalKind[t]=k;});
  if(nb) setBubble('🔁','Có nước bị cấm vì làm thế cờ lặp lần thứ 3. Hãy đổi nước khác.');
  inspectCode=cells[i]; previewRank=0; previewHero=null; sfx.select();
}
function onCell(i){
  cursor=i; previewRank=0; previewHero=null;
  var code=cells[i];
  if(bonus&&humanTurn()){
    if(selected>=0&&legal.indexOf(i)>=0){ applyBonusStep(selected,i); return; }
    if(code*turn>0&&bonusFrom[i]){
      if(selected===i){deselect();}
      else{
        selected=i; legal=[]; legalKind={}; inspectCode=code;
        bonus.steps.forEach(function(m){ if((m&127)===i){ legal.push((m>>7)&127); legalKind[(m>>7)&127]=0; } });
        sfx.select();
      }
      refresh(); return;
    }
    deselect(); inspectCode=code; refresh(); return;
  }
  if(humanTurn()){
    if(selected>=0&&legal.indexOf(i)>=0){ applyMove(selected,i,legalKind[i]); return; }
    if(code*turn>0){
      if(selected===i){deselect();inspectCode=0;}
      else select(i);
      refresh(); return;
    }
  }
  deselect(); inspectCode=code; refresh();
}
boardEl.addEventListener('click',function(e){
  var rect=boardEl.getBoundingClientRect();
  var c=Math.floor((e.clientX-rect.left)/rect.width*COLS), r=Math.floor((e.clientY-rect.top)/rect.height*ROWS);
  if(c<0||c>COLS-1||r<0||r>ROWS-1) return;
  onCell(r*COLS+c);
});
boardEl.addEventListener('focus',function(){boardFocused=true;updateMarks();});
boardEl.addEventListener('blur',function(){boardFocused=false;updateMarks();});
boardEl.addEventListener('keydown',function(e){
  var r=(cursor/COLS)|0, c=cursor%COLS, used=true;
  if(e.key==='ArrowUp') r=Math.max(0,r-1);
  else if(e.key==='ArrowDown') r=Math.min(ROWS-1,r+1);
  else if(e.key==='ArrowLeft') c=Math.max(0,c-1);
  else if(e.key==='ArrowRight') c=Math.min(COLS-1,c+1);
  else if(e.key==='Enter'||e.key===' '){e.preventDefault();onCell(cursor);return;}
  else if(e.key==='Escape'){deselect();inspectCode=0;previewRank=0;previewHero=null;refresh();return;}
  else used=false;
  if(used){e.preventDefault();cursor=r*COLS+c;updateMarks();}
});
$('roster').addEventListener('click',function(e){
  var b=e.target.closest('.row'); if(!b) return;
  var it=rosterList[+b.getAttribute('data-i')]; if(!it) return;
  previewHero=it[1]; previewRank=it[0]>9?9:it[0]; inspectCode=0; deselect(); refresh();
});

/* ---------- Van moi, chon tuong ---------- */
function randSq(R,withExtra){var a=zero(),r;for(r=2;r<=7;r++) a[r]=(R()*HEROES[r].length)|0; if(withExtra) a[9]=(R()*3)|0; return a;}
function curChal(){return modeKey==='chal'&&!pvp()?CHALS[+$('chal-sel').value||0]:null;}
function chalDone(){return load('cothu:c',',');}
function renderChal(){
  var sel=$('chal-sel'), cur=sel.value||'0', d=chalDone();
  sel.innerHTML=CHALS.map(function(c,i){return '<option value="'+i+'">'+(d.indexOf(','+i+',')>=0?'⭐ ':'')+c.n+'</option>';}).join('');
  sel.value=cur; $('chal-desc').textContent=CHALS[+sel.value||0].d;
}
function markChal(){
  if(modeKey!=='chal'||pvp()) return;
  var v=$('chal-sel').value, d=chalDone();
  if(d.indexOf(','+v+',')<0) store('cothu:c',d+v+',');
  renderChal();
}
function begin(me,foe,ch){
  SQ[0]=me.slice(); SQ[1]=foe.slice(); setKeys(); EN.clearTT(); syncHeroes();
  curLevel=(ch&&ch.lvl)||level;
  token++; cancelThink(); clearHint();
  cells=initialCells();
  (ch&&ch.drop||[]).forEach(function(r){for(var j=0;j<N;j++) if(cells[j]===r) cells[j]=0;});
  var n0=0,n1=0,j; for(j=0;j<N;j++){ if(cells[j]>0) n0++; else if(cells[j]<0) n1++; }
  startCnt=[n0,n1];
  turn=1; selected=-1; legal=[]; legalKind={}; lastMove=null; history=[]; over=false; thinking=false; bonus=null;
  inspectCode=0; previewRank=0; previewHero=null; counted=0; resultEl.hidden=true; $('draft').hidden=true;
  posHist=[EN.hashOf(cells,1)];
  refresh();
  var msg=EN.isClassic()?'Cổ điển: không có tuyệt kỹ. ':'Chạm vào một quân để xem tuyệt kỹ của nó. ';
  setBubble('🐾',(pvp()?'Người 1 đi trước. ':'Mời bạn đi trước. ')+msg);
  renderRoster();
}
var dr={sides:[1],idx:0,picks:{},ch:null,lockEx:false};
function newGame(){
  bonus=null; token++; cancelThink(); clearHint(); resultEl.hidden=true; $('draft').hidden=true;
  setClassic(modeKey==='basic'); renderRoster(); renderRules();
  var ch=curChal(), R=Math.random, me=zero(), foe=zero(), needDraft=modeKey!=='basic';
  if(modeKey==='basic'){ begin(me,foe,null); return; }
  if(!pvp()) foe=randSq(R,true);
  if(ch){
    $('chal-desc').textContent=ch.d;
    if(ch.daily){ R=mulberry(Math.floor(Date.now()/864e5)); me=randSq(R,true); foe=randSq(R,true); needDraft=false; }
    if(ch.foe) foe=ch.foe.slice();
    if(ch.me){ me=ch.me.slice(); needDraft=false; }
    if(ch.ex){ me[9]=ch.ex[0]; foe[9]=ch.ex[1]; }
  }
  if(!needDraft){ begin(me,foe,ch); return; }
  dr={sides:pvp()?[1,-1]:[1],idx:0,picks:{},ch:ch,lockEx:!!(ch&&ch.ex)};
  dr.picks[1]=me.slice(); dr.picks[-1]=foe.slice();
  showDraft();
}
function showDraft(){
  over=true; thinking=false; history=[]; deselect(); counted=0;
  var s=dr.sides[dr.idx], last=dr.idx===dr.sides.length-1;
  $('pill').className='pill'+(s<0?' foe':''); $('pill-text').textContent=pvp()?pn(s)+' chọn đội hình':'Chọn đội hình';
  $('draft-title').textContent=pvp()?pn(s)+' chọn đội hình':'Chọn đội hình';
  var ch=dr.ch;
  $('draft-sub').textContent=(ch?'Thử thách '+ch.n+'. ':'')+'Chạm để chọn một tướng cho mỗi bậc.'+(pvp()?' Người còn lại hãy quay đi nhé.':' Máy chọn ngẫu nhiên.')+(ch&&ch.drop?' Bạn sẽ mất quân bậc '+ch.drop.join(' và ')+'.':'');
  $('draft-go').textContent=last?'Vào trận':'Xong, đến '+pnl(dr.sides[dr.idx+1]);
  renderDraft(); $('draft').hidden=false; updateButtons();
}
function showDraftInfo(h){
  var el=$('draft-info'); if(!el) return;
  if(!h.t){ el.innerHTML='<b>Không dùng quân ngoài bậc</b>: mỗi bên chơi với 8 quân.'; return; }
  el.innerHTML='<b>'+h.e+' '+h.n+'</b> · '+h.br+'. '+h.t.filter(function(t){return t[0]==='g';}).slice(0,2).map(function(t){return t[1];}).join(' ');
}
function renderDraft(){
  var box=$('draft-rows'); box.innerHTML='';
  var s=dr.sides[dr.idx], pick=dr.picks[s];
  [1,2,3,4,5,6,7,8,9].forEach(function(r){
    var row=document.createElement('div'), opts, many;
    if(r===9) opts=[{e:'🚫',n:'Không dùng',br:'8 quân'},{e:H_MON.e,n:H_MON.n,br:H_MON.br},{e:H_TUR.e,n:H_TUR.n,br:H_TUR.br}];
    else opts=HEROES[r];
    many=opts.length>1;
    row.className='dr'; row.style.setProperty('--n',opts.length);
    row.innerHTML='<span class="rk">'+(r===9?'+':r)+'</span>';
    opts.forEach(function(h,idx){
      var locked=r===9&&dr.lockEx;
      var b=document.createElement(many&&!locked?'button':'div');
      if(many&&!locked) b.type='button';
      b.className='opt'+(pick[r]===idx?' on':'')+(many?'':' fixed')+(locked&&pick[r]!==idx?' lock':'');
      b.title=h.br;
      b.innerHTML='<b>'+h.e+' '+h.n+'</b><small>'+h.br+'</small>';
      b.addEventListener('mouseenter',function(){showDraftInfo(h);});
      if(many&&!locked) b.addEventListener('click',function(){pick[r]=idx;renderDraft();showDraftInfo(h);});
      else b.addEventListener('click',function(){showDraftInfo(h);});
      row.appendChild(b);
    });
    box.appendChild(row);
  });
}

/* ---------- Di lai, goi y ---------- */
function undo(){
  if(thinking) return;
  var snap=null;
  if(pvp()){ snap=history.pop()||null; }
  else{ while(history.length){ snap=history.pop(); if(snap.turn===1) break; snap=null; } }
  if(!snap) return;
  token++; cancelThink();
  if(over){
    if(pvp()){
      if(counted===1){p1w=Math.max(0,p1w-1);store('cothu:p1',String(p1w));}
      if(counted===-1){p2w=Math.max(0,p2w-1);store('cothu:p2',String(p2w));}
    }else{
      if(counted===1){wins=Math.max(0,wins-1);store('cothu:w',String(wins));}
      if(counted===-1){losses=Math.max(0,losses-1);store('cothu:l',String(losses));}
    }
    counted=0; updateScore();
  }
  bonus=null; cells=Int8Array.from(snap.cells); turn=snap.turn; lastMove=snap.last; over=false; posHist.length=snap.ph; deselect(); clearHint(); inspectCode=0; previewRank=0; previewHero=null;
  resultEl.hidden=true; refresh();
  setBubble('↩️',pvp()?'Đã đi lại. '+pn(turn)+' chọn nước khác nhé.':'Đã đi lại. Bạn chọn nước khác nhé.');
}
function doHint(){
  if(thinking||over||!humanTurn()) return;
  setBubble('💡','Đang tìm nước đi hay cho '+(pvp()?pnl(turn):'bạn')+'...');
  var my=token, side=turn;
  think(side,4,function(mv){
    if(my!==token||over||turn!==side||!mv) return;
    hint={f:mv.f,t:destOf(mv.f,mv.t,mv.k)};
    var h=hero(cells[mv.f]);
    setBubble(h.e,'Gợi ý: thử đi '+h.n+' tới ô đang nhấp nháy'+(mv.bf!==undefined&&mv.bf!==mv.bt?', rồi dùng bước thưởng tiền đồn.':'.'));
    updateMarks();
    clearTimeout(hintTimer); hintTimer=setTimeout(function(){hint=null;updateMarks();},7000);
  });
}

/* ---------- Che do, doi thu, cap do ---------- */
function applyMode(key){
  modeKey=key; store('cothu:mode',key);
  $('mode-'+key).checked=true;
  $('mode-desc').textContent=MODE_DESC[key];
  $('tagline').textContent=TAGS[key];
  $('chal-box').hidden=modeKey!=='chal'||pvp(); if(modeKey==='chal') renderChal();
}
function applyOpp(v,quiet){
  oppKey=v; store('cothu:opp',v);
  $('opp-'+v).checked=true;
  $('mode-chal').disabled=pvp();
  $('lvl-box').hidden=pvp();
  $('who-me').textContent=pn(1); $('who-foe').textContent=pn(-1);
  if(pvp()&&modeKey==='chal') applyMode('draft'); else applyMode(modeKey);
  updateScore(); renderRules();
}
function applyLevel(v){
  level=v; store('cothu:lv',String(v));
  $('lvl-'+v).checked=true; $('lvl-note').textContent=LEVEL_NOTE[v];
}
$('btn-new').addEventListener('click',newGame);
$('res-new').addEventListener('click',newGame);
$('res-view').addEventListener('click',function(){resultEl.hidden=true;});
$('btn-undo').addEventListener('click',undo);
$('btn-hint').addEventListener('click',doHint);
$('btn-skip').addEventListener('click',skipBonus);
$('btn-sound').addEventListener('click',function(){
  soundOn=!soundOn; store('cothu:sound',soundOn?'1':'0');
  this.textContent='Âm thanh: '+(soundOn?'Bật':'Tắt'); this.setAttribute('aria-pressed',String(soundOn));
  if(soundOn) sfx.select();
});
Array.prototype.forEach.call(document.querySelectorAll('input[name="lvl"]'),function(r){
  r.addEventListener('change',function(){ if(r.checked){ applyLevel(+r.value); var cc=curChal(); curLevel=(cc&&cc.lvl)||level; } });
});
Array.prototype.forEach.call(document.querySelectorAll('input[name="mode"]'),function(r){
  r.addEventListener('change',function(){ if(r.checked){ applyMode(r.value); newGame(); } });
});
Array.prototype.forEach.call(document.querySelectorAll('input[name="opp"]'),function(r){
  r.addEventListener('change',function(){ if(r.checked){ applyOpp(r.value); newGame(); } });
});
$('btn-sound').textContent='Âm thanh: '+(soundOn?'Bật':'Tắt');
$('btn-sound').setAttribute('aria-pressed',String(soundOn));
function updateMenuAudio(){
 var sm=$('menu-sound'),mm=$('menu-music');
 if(sm){sm.setAttribute('aria-pressed',String(soundOn));sm.querySelector('.utility-icon').textContent=soundOn?'🔊':'🔇';sm.querySelector('.utility-label').textContent='Âm thanh '+(soundOn?'bật':'tắt');}
 if(mm){mm.setAttribute('aria-pressed',String(musicOn));mm.querySelector('.utility-icon').textContent=musicOn?'♫':'♪';mm.querySelector('.utility-label').textContent='Nhạc nền '+(musicOn?'bật':'tắt');}
 $('btn-sound').textContent='Âm thanh: '+(soundOn?'Bật':'Tắt');
 $('btn-sound').setAttribute('aria-pressed',String(soundOn));
}
function showMainMenu(){
 $('main-menu').hidden=false;$('menu-modal').hidden=true;
 $('app').classList.add('menu-open');$('online-card').hidden=true;
 document.body.style.overflow='hidden';
 $('home-hint').textContent='Chọn một chế độ để bắt đầu. Bạn có thể quay lại trang chủ bất cứ lúc nào.';
}
function enterMenuMode(kind){
 var menu=$('main-menu'), app=$('app'), online=$('online-card'), hint=$('home-hint');
 var button=kind==='single'?$ ('menu-single'):kind==='local'?$ ('menu-local'):$ ('menu-online');
 try{
   if(kind==='online'){
     menu.hidden=true;app.classList.remove('menu-open');document.body.style.overflow='';
     online.hidden=false;
     online.scrollIntoView({behavior:'smooth',block:'start'});
     hint.textContent='Đang mở khu vực chơi trực tuyến…';
     setTimeout(function(){var inp=$('online-room-code');if(inp)inp.focus();},350);
     return;
   }
   online.hidden=true;
   if(kind==='single'){
     applyOpp('ai');newGame();
     hint.textContent='Đang chuẩn bị trận đấu với máy…';
   }else if(kind==='local'){
     applyOpp('pvp');newGame();
     hint.textContent='Đang chuẩn bị bàn đấu hai người…';
   }else{
     throw new Error('Chế độ chơi không hợp lệ.');
   }
   menu.hidden=true;app.classList.remove('menu-open');document.body.style.overflow='';
   var target=$('draft').hidden?$('frame'):$('draft');
   target.scrollIntoView({behavior:'smooth',block:'center'});
 }catch(err){
   menu.hidden=false;app.classList.add('menu-open');document.body.style.overflow='hidden';
   hint.textContent='Chưa mở được ván chơi: '+(err&&err.message?err.message:'Lỗi không xác định')+'. Hãy thử lại.';
   if(window.console&&console.error)console.error('Cờ Thú menu error:',err);
 }finally{
   if(button)button.classList.remove('is-loading');
 }
}
$('menu-single').addEventListener('click',function(){enterMenuMode('single');});
$('menu-local').addEventListener('click',function(){enterMenuMode('local');});
$('menu-online').addEventListener('click',function(){enterMenuMode('online');});
$('menu-sound').addEventListener('click',function(){soundOn=!soundOn;store('cothu:sound',soundOn?'1':'0');updateMenuAudio();if(soundOn)sfx.select();});
$('menu-music').addEventListener('click',function(){setMusic(!musicOn);});
$('menu-info').addEventListener('click',function(){$('menu-modal').hidden=false;$('menu-modal-close').focus();});
$('menu-modal-close').addEventListener('click',function(){$('menu-modal').hidden=true;});
$('menu-modal').addEventListener('click',function(e){if(e.target===$('menu-modal'))$('menu-modal').hidden=true;});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('menu-modal').hidden)$('menu-modal').hidden=true;});
$('menu-share').addEventListener('click',function(){
 var data={title:'Cờ Thú',text:'Cùng chơi Cờ Thú nhé!',url:location.href};
 if(navigator.share){navigator.share(data).catch(function(){});}
 else if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(location.href).then(function(){$('home-hint').textContent='Đã sao chép liên kết game.';}).catch(function(){$('home-hint').textContent='Hãy sao chép liên kết trên thanh địa chỉ để chia sẻ.';});}
 else{$('home-hint').textContent='Liên kết game: '+location.href;}
});
$('btn-menu').addEventListener('click',showMainMenu);
updateMenuAudio();
if(window.matchMedia&&window.matchMedia('(min-width: 901px)').matches){ $('roster-box').open=true; }
$('draft-go').addEventListener('click',function(){
  if(dr.idx<dr.sides.length-1){ dr.idx++; showDraft(); return; }
  $('draft').hidden=true; begin(dr.picks[1],dr.picks[-1],dr.ch);
});
$('draft-rand').addEventListener('click',function(){
  var s=dr.sides[dr.idx], a=randSq(Math.random,!dr.lockEx);
  if(dr.lockEx) a[9]=dr.picks[s][9];
  dr.picks[s]=a; renderDraft();
});
$('chal-sel').addEventListener('change',newGame);

/* ---------- Khoi dong ---------- */
function snapshotState(){ return {mode:modeKey}; }
try{ if(window.claude&&window.claude.hot&&window.claude.hot.snapshot) window.claude.hot.snapshot(snapshotState); }catch(e){}
function start(data){
  layoutBoard();
  applyLevel(level); applyOpp(oppKey); renderRoster(); renderRules(); scheduleGround();
  newGame();
  $('online-card').hidden=true;showMainMenu();
  requestAnimationFrame(function(){requestAnimationFrame(function(){boardEl.classList.add('ready');});});
}
if(window.claude&&window.claude.hot&&window.claude.hot.ready) window.claude.hot.ready(start);
else start(window.claude&&window.claude.hot&&window.claude.hot.data?window.claude.hot.data:{});
