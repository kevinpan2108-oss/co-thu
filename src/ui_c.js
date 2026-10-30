
/* ---------- Trang thai ---------- */
var cells, turn=1, selected=-1, legal=[], legalKind={}, lastMove=null, history=[], over=false, thinking=false, token=0;
var hint=null, hintTimer=0, boardFocused=false, inspectCode=0, previewRank=0, previewHero=null, counted=0, posHist=[], bonus=null;
var level=Math.min(5,Math.max(1,+load('cothu:lv','3')||3));
var oppKey=load('cothu:opp','ai')==='pvp'?'pvp':'ai';
var wins=+load('cothu:w','0')||0, losses=+load('cothu:l','0')||0, p1w=+load('cothu:p1','0')||0, p2w=+load('cothu:p2','0')||0;
var modeKey=load('cothu:mode','draft'); if(MODES.indexOf(modeKey)<0) modeKey='draft';
var curLevel=3, startCnt=[8,8];
function pvp(){return oppKey==='pvp';}
function pn(s){return pvp()?(s>0?'Người 1':'Người 2'):(s>0?'Bạn':'Máy');}
function pnl(s){return pvp()?(s>0?'người 1':'người 2'):(s>0?'bạn':'máy');}
function humanTurn(){return !over&&!thinking&&(pvp()||turn===1);}

function posStyle(el,i){
  el.style.left=((i%COLS)*100/COLS)+'%';
  el.style.top=(((i/COLS)|0)*100/ROWS)+'%';
}
function syncPieces(){
  var pos={}, i, k, el, i2, code, er, rk, rEl, a, K, base;
  for(i=0;i<N;i++) if(cells[i]) pos[cells[i]]=i;
  for(k in pieceEls){
    el=pieceEls[k]; i2=pos[k]; code=+k; rk=Math.abs(code);
    if(i2===undefined){
      el.classList.add('dead'); el.classList.remove('in-water','trapped','sel','buff','charged','cool','turtle');
      continue;
    }
    el.classList.remove('dead'); posStyle(el,i2);
    a=code>0?0:1; K=HK[code+9]; rEl=rankEls[k];
    if(rk===9){
      rEl.textContent='–'; rEl.className='rank none';
      el.classList.remove('buff'); el.classList.remove('trapped');
    }else{
      er=effRank(cells,i2); base=nominal(code);
      rEl.textContent=er; rEl.className='rank'+(er>base?' buff':er<base?' nerf':'');
      el.classList.toggle('buff',er>base);
      el.classList.toggle('trapped',er===0&&TRAP[i2]===(code>0?-1:1));
      el.title=rankWhy(code,i2)||'';
    }
    el.classList.toggle('turtle',K==='tur');
    el.classList.toggle('in-water',!!WATER[i2]);
    el.classList.toggle('sel',i2===selected);
    el.classList.toggle('charged',K==='tig'&&cells[SL+a]===1&&!EN.isClassic());
    el.classList.toggle('cool',!EN.isClassic()&&((K==='lio'&&cells[SL+2+a]>0)||(K==='bison'&&cells[SL+4+a]>0&&cells[SL+10+a]>0)||(K==='mon'&&cells[SL+6+a]>0)));
    el.classList.toggle('stunned',!EN.isClassic()&&cells[SL+12+a]===i2+1);
  }
}
var bonusFrom={};
function updateMarks(){
  var legalSet={}, i, cls, lc;
  bonusFrom={}; if(bonus) bonus.steps.forEach(function(m){bonusFrom[m&127]=1;});
  legal.forEach(function(t){legalSet[t]=1;});
  for(i=0;i<N;i++){
    cls='m';
    if(lastMove&&(i===lastMove.f||i===lastMove.t)) cls+=' last';
    if(i===selected) cls+=' sel';
    if(hint&&(i===hint.f||i===hint.t)) cls+=' hint';
    if(legalSet[i]){
      lc=legalKind[i]||0; cls+=' legal';
      if(lc===5) cls+=' sw';
      else if(lc===9) cls+=' ps';
      else if(lc===6||lc===7) cls+=' cap rg';
      else if(cells[i]!==0) cls+=' cap';
      else cls+=(lc===1?' jp':lc>=2?' sp':'');
    }
    if(bonus&&selected<0&&bonusFrom[i]) cls+=' bp';
    if(boardFocused&&i===cursor) cls+=' cursor';
    markEls[i].className=cls;
  }
}
function updateStrips(){
  var alive={}, i, k, nm=0, nf=0;
  for(i=0;i<N;i++) if(cells[i]){alive[cells[i]]=1; if(cells[i]>0)nm++; else nf++;}
  for(k in miniEls){
    miniEls[k].classList.toggle('out',!alive[k]);
    miniEls[k].hidden=!hero(+k)||(Math.abs(+k)===9&&!startHas(+k));
  }
  setOc('oc-me',1); setOc('oc-foe',-1);
  $('cnt-me').textContent=nm+'/'+startCnt[0];
  $('cnt-foe').textContent=nf+'/'+startCnt[1];
}
function setOc(id,side){
  var el=$(id), cd;
  if(EN.isClassic()){ el.textContent=''; return; }
  cd=EN.outCd(cells,side);
  el.textContent=cd>0?'🚩 Thưởng hồi '+cd+' lượt':'🚩 Thưởng tiền đồn: sẵn sàng';
  el.className='oc '+(cd>0?'cool':'ready');
  el.title='Chiếm tiền đồn thì được đi thêm 1 ô. Sau khi nhận thưởng, phe đó hồi 2 lượt.';
}
function updateOutposts(){
  var i, cl=EN.isClassic(), cd=cl?0:EN.outCd(cells,turn), el;
  gridEl.classList.toggle('no-out',cl);
  for(i=0;i<N;i++){
    if(!OUTPOST[i]) continue;
    el=gridEl.children[i]; if(!el) continue;
    el.classList.toggle('ready',!cl&&cd===0); el.classList.toggle('cool',!cl&&cd>0);
  }
}
function startHas(code){ return !EN.isClassic()&&SQ[code>0?0:1][9]>0; }
function setBubble(emo,text){
  bubbleEl.querySelector('.b-emo').textContent=emo;
  bubbleEl.querySelector('.b-text').textContent=text;
  bubbleEl.classList.remove('pop'); void bubbleEl.offsetWidth; bubbleEl.classList.add('pop');
}
function updateStatus(){
  var pill=$('pill'), txt=$('pill-text');
  if(over){pill.className='pill';txt.textContent='Hết ván';return;}
  pill.className='pill'+(turn===-1?' foe':'');
  if(bonus){ txt.textContent=pvp()?'🚩 Bước thưởng: '+pn(turn):'🚩 Bước thưởng của bạn'; return; }
  if(pvp()){ txt.textContent='Lượt của '+pn(turn); return; }
  if(turn===1) txt.textContent='Lượt của bạn';
  else txt.innerHTML='Máy đang nghĩ<span class="dots"><span>.</span><span>.</span><span>.</span></span>';
}

/* ---------- The thong tin quan ---------- */
function diagram(K,rk,emo){
  var cl=EN.isClassic(), map={}, i, j, x, dirs=[[-1,0],[1,0],[0,-1],[0,1]], key='<span>⚪ bước 1 ô</span>';
  dirs.forEach(function(d){map[d[0]+','+d[1]]='s';});
  function two(lbl){dirs.forEach(function(d){map[(d[0]*2)+','+(d[1]*2)]='x';}); key+=' <span>★ '+lbl+'</span>';}
  if(rk===9&&K==='tur') key='<span>⚪ bước 1 ô</span> <span>không vào hang, hồ</span>';
  if(!cl){
    if(K==='cat') two('trèo qua quân kề');
    else if(K==='fox') two('nước rút');
    else if(K==='lio') two('vồ xa');
    else if(K==='bison') two('lao / húc đẩy lùi');
    else if(K==='leo'){[[-1,-1],[-1,1],[1,-1],[1,1]].forEach(function(d){map[d[0]+','+d[1]]='x';}); key+=' <span>★ đi chéo</span>';}
    else if(K==='mon'){dirs.forEach(function(d){map[d[0]+','+d[1]]='x';}); key+=' <span>⇄ đổi chỗ quân kề</span>';}
    else if(K==='croc') key+=' <span>🎯 bắt mồi ở bờ sát hồ</span>';
  }
  if(K==='tig'||K==='eagle'||(cl&&K==='lio')){dirs.forEach(function(d){map[(d[0]*3)+','+(d[1]*3)]='j';}); key+=' <span>≈ nhảy qua hồ</span>';}
  var h='';
  for(i=-3;i<=3;i++)for(j=-3;j<=3;j++){
    if(i===0&&j===0) h+='<i class="c">'+emo+'</i>';
    else{ x=map[i+','+j]; h+='<i'+(x?' class="'+x+'"':'')+'></i>'; }
  }
  return '<div class="mv"><div class="mvgrid">'+h+'</div><div class="mvkey">'+key+'</div></div>';
}
/* Giai thich bac hieu luc cua Soi, Lon rung, Cho, Gau, Ca sau (rong: quan khac hoac che do Co dien). */
function rankWhy(code,i){
  var s=code>0?1:-1, K=HK[code+9], cl=EN.isClassic(), er;
  if(cl||i<0||TRAP[i]===-s) return '';
  er=effRank(cells,i);
  if(K==='tig'&&cells[SL+(s>0?0:1)]===1) return 'bậc 7 sau khi nhảy, đến khi Hổ tự đi';
  if(K==='wolf') return EN.hasMate(cells,i)?'bậc 4 khi có đồng đội bậc ≥ 2 kề':'bậc 3 khi đi lẻ';
  if(K==='boar') return EN.nearWater(i)?'bậc 4: kề hồ':'bậc 3: chưa kề hồ';
  if(K==='dog') return EN.guarding(i,s)?'bậc 5: khu hang nhà, khóa chiêu địch kề':'bậc 4: xa hang nhà';
  if(K==='bear') return EN.advanced(i,s)?'bậc 5: sân địch':'bậc 4: chưa qua giữa bàn';
  if(K==='croc'){
    if(WATER[i]) return 'bậc 6: đang dưới hồ';
    return er===6?'bậc 6: đầm lầy':'bậc 3: lên cạn';
  }
  return '';
}
function nowNote(code){
  var i, er, rk=Math.abs(code), s=code>0?1:-1, a=s>0?0:1, parts=[], out='', K=HK[code+9], cl=EN.isClassic();
  for(i=0;i<N;i++) if(cells[i]===code) break;
  if(i>=N||rk===9) return '';
  er=effRank(cells,i);
  if(TRAP[i]===-s){
    if(rk===8&&!cl) return '<p class="now">Voi vào bẫy địch vẫn bậc 4.</p>';
    return '<p class="now">Đang trong bẫy: mất sức mạnh.</p>';
  }
  if(!cl){
    var why=rankWhy(code,i);
    if(why) out+='<p class="now"><b>Bậc hiện tại '+er+'</b> (gốc '+nominal(code)+') · '+why+'.</p>';
    if(K==='lio'&&cells[SL+2+a]>0) out+='<p class="now">Vồ còn hồi chiêu: '+cells[SL+2+a]+' lượt.</p>';
    if(K==='bison'){
      var cdL=cells[SL+4+a], cdH=cells[SL+10+a];
      if(cdL>0&&cdH>0) out+='<p class="now">Hồi chiêu: Lao '+cdL+' lượt · Húc '+cdH+' lượt.</p>';
      else if(cdL>0) out+='<p class="now">Lao đang hồi chiêu, còn '+cdL+' lượt. Húc vẫn dùng được.</p>';
      else if(cdH>0) out+='<p class="now">Húc đang hồi chiêu, còn '+cdH+' lượt. Lao vẫn dùng được.</p>';
    }
    if(cells[SL+12+a]===i+1) out+='<p class="now">💫 Choáng: bỏ lượt đi kế tiếp.</p>';
  }
  return out;
}
function eatsList(r,side,K){
  var q, out=[], hc=side>0?-1:1;
  if(r===9) return '<i>không ăn được quân nào</i>';
  if(K==='croc'&&!EN.isClassic()) r=5;
  for(q=1;q<=8;q++){
    if(r===1?(q===1||q===8):(r===8?(q>=2):(q<=r))) out.push(hero(hc*q).e);
  }
  if(!EN.isClassic()&&SQ[side>0?1:0][9]===1) out.push('🐒');
  return out.join(' ');
}
function updateInfo(){
  var el=$('info'), r, label, cls, extra='', hh, side=1;
  if(previewHero){ hh=previewHero; r=previewRank; label='Sổ tay thú'; cls='pv'; }
  else if(inspectCode){
    hh=hero(inspectCode); r=Math.abs(inspectCode); side=inspectCode>0?1:-1; cls=inspectCode>0?'me':'foe';
    label=side>0&&!pvp()?'Quân của bạn':'Quân của '+pnl(side);
    extra=nowNote(inspectCode);
  }else{
    el.innerHTML='<p class="hint-empty">Chạm vào một quân trên bàn cờ hoặc một dòng trong Sổ tay thú để xem sức mạnh và cách đi của loài đó.</p>';
    return;
  }
  var rankTxt=r===9?'–':r, rcls='', subRank=r===9?'quân ngoài bậc':'bậc gốc '+r, ip=-1, ie, k2;
  if(!previewHero&&inspectCode&&r!==9){
    for(k2=0;k2<N;k2++) if(cells[k2]===inspectCode){ip=k2;break;}
    if(ip>=0){ ie=effRank(cells,ip); rankTxt=ie; rcls=ie>nominal(inspectCode)?' buff':ie<nominal(inspectCode)?' nerf':''; if(ie!==r) subRank='bậc gốc '+nominal(inspectCode)+' · hiện tại '+ie; }
  }
  var lis=hh.t.map(function(t){return '<li class="'+t[0]+'">'+t[1]+'</li>';}).join('');
  el.innerHTML='<div class="info-head"><div class="info-token '+cls+'">'+hh.e+'<span class="rank'+rcls+'">'+rankTxt+'</span></div>'+
    '<div><h3>'+hh.n+'<em>'+hh.ep+'</em></h3><small>'+label+' · '+subRank+'</small></div></div>'+
    '<p class="eats"><span>Ăn được</span> '+eatsList(r,side,hh.k)+'</p>'+extra+
    '<div class="info-body"><ul class="traits">'+lis+'</ul>'+diagram(hh.k,r,hh.e)+'</div>'+
    (!previewHero&&selected>=0&&inspectCode*turn>0&&humanTurn()?'<p><b>'+legal.length+'</b> nước đi hợp lệ</p>':'');
}
function updateButtons(){
  var canUndo=history.length>0&&(pvp()||history.some(function(h){return h.turn===1;}));
  $('btn-undo').disabled=thinking||!canUndo;
  $('btn-hint').disabled=thinking||over||!humanTurn()||!!bonus;
  $('btn-skip').hidden=!bonus||over;
  if(bonus) $('btn-skip').disabled=!bonus.skipOK;
}
function updateScore(){
  if(pvp()){ $('sc1-l').textContent='Người 1'; $('sc2-l').textContent='Người 2'; $('wins').textContent=p1w; $('losses').textContent=p2w; }
  else{ $('sc1-l').textContent='Thắng'; $('sc2-l').textContent='Thua'; $('wins').textContent=wins; $('losses').textContent=losses; }
}
function refresh(){
  syncPieces(); updateMarks(); updateStrips(); updateOutposts(); updateStatus(); updateInfo(); updateButtons();
}
function syncHeroes(){
  var c, h, k;
  for(c in pieceEls){
    h=hero(+c); pieceEls[c].querySelector('.emo').textContent=h.e; miniEls[c].textContent=h.e; miniEls[c].title=h.n;
  }
}

/* ---------- So tay va luat ---------- */
var rosterList=[];
function renderRoster(){
  var ros=$('roster'), q, b, h, cl=EN.isClassic(), list=[], v;
  ros.innerHTML='';
  for(q=1;q<=8;q++){
    if(cl||HEROES[q].length===1) list.push([q,hero(q)]);
    else for(v=0;v<HEROES[q].length;v++) list.push([q,HEROES[q][v]]);
  }
  if(!cl){ list.push([9,H_MON]); list.push([10,H_TUR]); }
  rosterList=list;
  list.forEach(function(it,ix){
    h=it[1]; b=document.createElement('button'); b.type='button'; b.className='row'; b.setAttribute('data-i',ix);
    b.innerHTML='<span class="mini">'+h.e+'</span><span><b>'+h.n+' · '+h.ep+'</b><small>'+(it[0]<=8?'Bậc '+it[0]+' · ':'Ngoài bậc · ')+h.br+'</small></span>';
    ros.appendChild(b);
  });
}
function renderRules(){
  var cl=EN.isClassic();
  var L=[
    'Mỗi lượt đi một ô theo hàng ngang hoặc hàng dọc.',
    'Thắng khi đưa một quân vào hang của đối phương, hoặc ăn hết quân chiến đấu của đối phương (chỉ còn Rùa cũng tính là hết quân). Hết nước đi mà chưa ai thắng thì ván hòa.',
    'Không được bước vào hang nhà mình. Muốn vào hang phải bước từng ô theo hàng ngang hoặc dọc.',
    cl?'Sông giữa bàn cờ chỉ có Chuột lội được. Qua sông bằng cầu gỗ hẹp, bãi cạn ở giữa, hoặc Hổ và Sư tử nhảy qua theo hàng thẳng (Chuột chắn giữa đường thì không nhảy được).':'Sông giữa bàn cờ chỉ có Chuột và Cá sấu lội được. Qua sông bằng cầu gỗ hẹp, bãi cạn ở giữa, hoặc Hổ và Đại bàng nhảy qua nước thật theo hàng thẳng (không nhảy qua đầm lầy). Chuột hoặc Cá sấu địch dưới nước chặn được Hổ nhưng không chặn được Đại bàng.',
    '⛰️ Núi đá không ai đi vào được và chặn mọi chiêu đi xuyên qua.',
    'Chuột đứng trên bờ ăn được Voi. Voi không ăn được Chuột.',
    cl?'Quân bước vào bẫy của đối phương mất hết sức mạnh, kể cả Voi.':'Quân bước vào bẫy của đối phương về bậc 0 và ai cũng ăn được. Riêng Voi da dày chỉ còn bậc 4.'
  ];
  if(!cl){
    L.push('🌳 Bụi rậm và lau sậy là ô đi bình thường, nhưng chiêu đi thẳng của Cáo, Sư tử, Bò rừng không băng qua được ô bụi (đáp xuống bụi thì được). Quân đứng trong bụi không bị Sư tử vồ xa và không bị Cá sấu rình.');
    L.push('🍃 Lách lau sậy: nếu bắt đầu lượt khi đang đứng trong bụi/lau, quân có thể đi chéo 1 ô tới ô trống (không ăn quân). Không được đi vào nước, đá hoặc hang; vẫn không đi được khi bị Chó khóa.');
    L.push('🪷 Đầm lầy (rìa phải) mọi quân đều đi vào được. Cáo, Sư tử, Bò rừng không lao hay vồ xuyên qua đầm lầy. Quân đứng trong đầm lầy không bị Sư tử vồ xa hay Cá sấu rình nhưng vẫn bị ăn bằng đòn thường. Chuột và Cá sấu trong đầm lầy giữ lợi thế như dưới nước.');
    L.push('🚩 Tiền đồn (ô có cờ ở rìa trái): chiếm bằng bất kỳ nước đi nào thì được đi thêm 1 ô thường. Bước thưởng không ăn quân, không vào hang, bỏ qua cũng được. Nhận thưởng xong, phe đó hồi 2 lượt mới nhận lại được. Hai phe hồi riêng.');
    L.push('🌉 Cầu gỗ hẹp (hai bên rìa) không chịu nổi Voi. Voi chỉ qua sông bằng bãi cạn ở giữa bàn cờ.');
    L.push('Mỗi bậc 2 đến 7 có hai tướng để chọn, mỗi tướng một tuyệt kỹ. Chuột và Voi luôn có mặt. Mỗi bên có thể thêm 1 quân ngoài bậc: Khỉ, Rùa hoặc không dùng.');
    L.push('Khi chọn quân, ★ là chiêu đặc biệt, ≈ nhảy hồ, ⇄ đổi chỗ, 🎯 vồ xa hoặc bắt mồi, 💢 húc đẩy lùi quân địch ăn không được (Voi) và làm nó choáng 1 lượt. Chạm vào quân đó cách 2 ô để húc; quân ăn được thì dùng Lao.');
    L.push('Số trên huy hiệu là bậc hiện tại. Xanh là đang được cộng bậc, hồng là đang bị trừ. ⚡ là Hổ đang giữ bậc 7 sau cú nhảy cho đến khi chính Hổ di chuyển; 💫 là quân bị Bò rừng húc choáng; quân mờ là đang hồi chiêu.');
  }
  L.push('🔁 Lặp thế: nước đi làm một thế cờ y hệt xuất hiện lần thứ 3 thì bị cấm, phải đổi nước khác. Hết nước hợp lệ thì ván hòa.');
  if(pvp()) L.push('Chế độ 2 người: hai người thay nhau chạm vào bàn cờ trên cùng một thiết bị. Người 1 ở phía dưới.');
  var ul=$('rules-list'); ul.innerHTML='';
  L.forEach(function(t){ var li=document.createElement('li'); li.textContent=t; ul.appendChild(li); });
}

/* ---------- Mo ta nuoc di ---------- */
function describe(f,t,code,tcode,k){
  var s=code>0?1:-1, rk=Math.abs(code), K=HK[code+9], owner=pnl(s), foeName=pnl(-s);
  var h=hero(code), emo=h.e, snd=h.s, who=h.n+' của '+owner, th=tcode?hero(tcode).n:'';
  if(k===5) return {emo:emo,text:snd+' '+who+' đổi chỗ với '+th+(tcode*s>0?'':' của '+foeName)+'.'};
  if(k===6) return {emo:emo,text:snd+' '+who+' '+(K==='croc'?'bắt mồi':'tấn công từ bờ')+', ăn '+th+' của '+foeName+' mà không rời chỗ.'};
  if(k===7) return {emo:emo,text:snd+' '+who+' vồ xa, ăn '+th+' của '+foeName+' mà không rời chỗ.'};
  if(k===9){
    var mid9=(f+t)>>1, d9=0, b9; while(d9<3&&ADJ[f*4+d9]!==mid9) d9++; b9=ADJ[t*4+d9]; var trapped=b9>=0&&TRAP[b9]===s;
    return {emo:emo,text:snd+' '+who+' húc '+th+' của '+foeName+' lùi 1 ô'+(trapped?' vào bẫy, mất bậc':'')+' và làm nó choáng: lượt tới không đi được!'};
  }
  if(k===8) return tcode?{emo:emo,text:snd+' '+who+' lao tới ăn '+th+' của '+foeName+'.'}:{emo:emo,text:snd+' '+who+' lao thẳng 2 ô.'};
  if(k===10) return {emo:emo,text:snd+' '+who+' lách chéo 1 ô qua bụi/lau.'};
  if(tcode){
    var verb=k===1?'nhảy qua hồ và ăn':k===2?'trèo qua rồi ăn':k===3?'lao tới ăn':k===4?'phóng chéo ăn':'ăn';
    return {emo:emo,text:snd+' '+who+' '+verb+' '+th+' của '+foeName+'.'};
  }
  if(k===1) return {emo:emo,text:snd+' '+who+(K==='eagle'?' bay':' nhảy')+' qua hồ.'};
  if(k===2) return {emo:emo,text:snd+' '+who+' trèo qua đầu '+hero(cells[(f+t)>>1]).n+'!'};
  if(k===3) return {emo:emo,text:snd+' '+who+' chạy nước rút hai ô.'};
  if(k===4) return {emo:emo,text:snd+' '+who+' lẻn đi đường chéo.'};
  if(WATER[t]&&WATER[f]) return {emo:emo,text:snd+' '+who+' bơi trong hồ.'};
  if(WATER[t]&&!WATER[f]) return {emo:emo,text:snd+' '+who+' lội xuống hồ.'};
  if(!WATER[t]&&WATER[f]) return {emo:emo,text:snd+' '+who+' lên bờ.'};
  if(TRAP[t]===-s&&rk!==9&&(rk!==8||EN.isClassic())) return {emo:'🪤',text:'Bẫy sập! '+who+' mất hết sức mạnh.'};
  if(TRAP[t]===-s&&rk===8) return {emo:emo,text:snd+' Voi da dày, vào bẫy vẫn còn bậc 4.'};
  var fw=-s*(((t/COLS)|0)-((f/COLS)|0));
  return {emo:emo,text:snd+' '+who+' '+(fw>0?'tiến lên':fw<0?'lùi lại':'đi ngang')+'.'};
}
