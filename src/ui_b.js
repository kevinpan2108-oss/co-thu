
function $(id){return document.getElementById(id);}
var boardEl=$('board'), gridEl=$('grid'), marksEl=$('marks'), piecesEl=$('pieces'), fxEl=$('fx'), frameEl=$('frame');
var bubbleEl=$('bubble'), resultEl=$('result');
function store(k,v){try{localStorage.setItem(k,v);}catch(e){}}
function load(k,d){try{var v=localStorage.getItem(k);return v===null?d:v;}catch(e){return d;}}

/* ---------- Am thanh ---------- */
var AC=null, soundOn=load('cothu:sound','1')!=='0';
function tone(f1,f2,dur,type,vol,delay){
  if(!soundOn) return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended') AC.resume();
    var t=AC.currentTime+(delay||0), o=AC.createOscillator(), g=AC.createGain();
    o.type=type||'sine';
    o.frequency.setValueAtTime(f1,t);
    o.frequency.exponentialRampToValueAtTime(f2,t+dur);
    g.gain.setValueAtTime(vol||.12,t);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g); g.connect(AC.destination);
    o.start(t); o.stop(t+dur+.03);
  }catch(e){}
}
var sfx={
  select:function(){tone(700,860,.07,'sine',.09);},
  move:function(){tone(380,640,.12,'sine',.12);},
  jump:function(){tone(280,980,.22,'triangle',.13);},
  dash:function(){tone(180,900,.16,'sawtooth',.07);},
  dodge:function(){tone(900,480,.14,'triangle',.12);tone(480,900,.14,'triangle',.1,.12);},
  splash:function(){tone(520,200,.18,'sine',.1);},
  weather:function(){tone(300,620,.3,'triangle',.08);tone(620,420,.3,'triangle',.07,.2);},
  capture:function(){tone(240,60,.24,'sawtooth',.13);tone(700,330,.12,'square',.05,.03);},
  win:function(){[523,659,784,1046].forEach(function(f,i){tone(f,f*1.01,.2,'triangle',.13,i*.13);});},
  lose:function(){[392,330,262,196].forEach(function(f,i){tone(f,f*.98,.25,'triangle',.12,i*.16);});}
};

// Nhạc nền giai điệu ngắn, tạo bằng Web Audio (không tải thêm tệp ngoài).
var musicOn=load('cothu:music','0')==='1', musicTimer=0, musicStep=0;
function musicTick(){
  if(!musicOn)return;
  try{
    AC=AC||new (window.AudioContext||window.webkitAudioContext)();
    if(AC.state==='suspended')AC.resume();
    var notes=[392,523.25,587.33,523.25,440,523.25,659.25,587.33], f=notes[musicStep%notes.length];
    var o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime;
    o.type='sine';o.frequency.setValueAtTime(f,t);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.022,t+.04);g.gain.exponentialRampToValueAtTime(.0001,t+.42);
    o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+.45);
  }catch(e){}
  musicStep++;musicTimer=setTimeout(musicTick,480);
}
function setMusic(on){
  musicOn=!!on;store('cothu:music',musicOn?'1':'0');
  if(musicTimer){clearTimeout(musicTimer);musicTimer=0;}
  if(musicOn)musicTick();
  updateMenuAudio();
}
sfx.snipe=function(){tone(520,90,.2,'sawtooth',.12);};
sfx.swap=function(){tone(500,900,.1,'triangle',.1);tone(900,500,.1,'triangle',.1,.1);};
var TRAP_SVG='<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="23" rx="16" ry="12.5" fill="url(#pitG)" stroke="currentColor" stroke-width="3"/><g fill="#ecd9a8" stroke="#7a5a2c" stroke-width="1" stroke-linejoin="round"><path d="M9 26 L11.5 14 L14 26Z"/><path d="M16.5 28 L20 12 L23.5 28Z"/><path d="M26 26 L28.5 14 L31 26Z"/></g><ellipse cx="20" cy="23" rx="16" ry="12.5" fill="none" stroke="rgba(0,0,0,.4)" stroke-width="1"/></svg>';
var OUT_SVG='<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="34" rx="11" ry="3.4" fill="rgba(0,0,0,.3)"/><path d="M14 33 V6" stroke="#5a3a1c" stroke-width="3" stroke-linecap="round"/><path d="M14.5 7 L33 12.5 L14.5 19Z" fill="currentColor" stroke="#10263A" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 33 h10" stroke="#5a3a1c" stroke-width="2.4" stroke-linecap="round"/></svg>';
var DEN_SVG='<svg viewBox="0 0 40 40" aria-hidden="true"><ellipse cx="20" cy="35.5" rx="16" ry="3.6" fill="rgba(0,0,0,.35)"/><rect x="8.5" y="19" width="23" height="16" rx="2" fill="url(#wallG)" stroke="#10263A" stroke-width="2"/><path d="M3.5 21.5 L20 5.5 L36.5 21.5Z" fill="url(#roofG)" stroke="#10263A" stroke-width="2" stroke-linejoin="round"/><path d="M9 19 L14 12.5 M15 19 L19 10 M21 19 L25 10 M27 19 L31 13" stroke="rgba(80,50,15,.55)" stroke-width="1.2" fill="none" stroke-linecap="round"/><path d="M16 35 v-8 a4 4 0 0 1 8 0 v8z" fill="#241608"/><path d="M20 5.5 V0.8" stroke="#10263A" stroke-width="2" stroke-linecap="round"/><path d="M20 1.2 h9 l-2.4 3.2 2.4 3.2 h-9z" fill="currentColor" stroke="#10263A" stroke-width="1.5" stroke-linejoin="round"/></svg>';

/* ---------- Dung quan co ---------- */
var markEls=[], pieceEls={}, rankEls={}, miniEls={};
(function build(){
  [1,-1].forEach(function(s){
    var rk, el, code, mini;
    for(rk=1;rk<=9;rk++){
      code=s*rk;
      el=document.createElement('div');
      el.className='piece '+(s>0?'me':'foe');
      el.style.setProperty('--d',(-Math.random()*2.6).toFixed(2)+'s');
      el.innerHTML='<div class="face"><span class="emo"></span><span class="rank"></span></div>';
      piecesEl.appendChild(el); pieceEls[code]=el; rankEls[code]=el.querySelector('.rank');
    }
    for(rk=9;rk>=1;rk--){
      code=s*rk;
      mini=document.createElement('span');
      mini.className='mini '+(s>0?'me':'foe');
      $(s>0?'strip-me':'strip-foe').appendChild(mini); miniEls[code]=mini;
    }
  });
  var lad=$('ladder'), q;
  for(q=1;q<=8;q++){
    var span=document.createElement('span'); span.className='mini'; span.id='lad-'+q; span.innerHTML=ico(HEROES[q][0]);
    lad.appendChild(span);
    if(q<8){var ar=document.createElement('span'); ar.textContent='›'; lad.appendChild(ar);}
  }
})();

/* ---------- Dia hinh: nuoc ve bang clip-path tu du lieu ban do ---------- */
function isW(r,c){ return r>=0&&r<ROWS&&c>=0&&c<COLS&&WATER[r*COLS+c]===1; }
function terrCh(i){ return MAPROWS[(i/COLS)|0].charAt(i%COLS); }
/* Duong vien o i: goc chi bo tron khi ca hai canh ke goc deu khong phai nuoc. Don vi: o (1 = mot o). */
function isM(r,c){ return r>=0&&r<ROWS&&c>=0&&c<COLS&&MARSH[r*COLS+c]===1; }
function cellRoundRect(r,c,pad,rad,ex,pr){
  pr=pr||isW;
  var x0=c-pad, y0=r-pad, x1=c+1+pad, y1=r+1+pad, up=pr(r-1,c), dn=pr(r+1,c), lf=pr(r,c-1), rt=pr(r,c+1);
  var tl=(!up&&!lf)?rad+pad:0, tr=(!up&&!rt)?rad+pad:0, br=(!dn&&!rt)?rad+pad:0, bl=(!dn&&!lf)?rad+pad:0;
  if(ex){ if(up)y0-=ex; if(dn)y1+=ex; if(lf)x0-=ex; if(rt)x1+=ex; }
  return {x0:x0,y0:y0,x1:x1,y1:y1,tl:tl,tr:tr,br:br,bl:bl};
}
function buildWater(lk){
  var NS='http://www.w3.org/2000/svg', svg=document.createElementNS(NS,'svg'), defs, cp, p, i, r, c, d, kinds=['river','swamp'], layer, f, mk, arr, pr;
  svg.setAttribute('width','0'); svg.setAttribute('height','0'); svg.setAttribute('aria-hidden','true'); svg.style.position='absolute';
  defs=document.createElementNS(NS,'defs'); svg.appendChild(defs);
  kinds.forEach(function(kd){
    cp=document.createElementNS(NS,'clipPath'); cp.setAttribute('id','clip-'+kd); cp.setAttribute('clipPathUnits','objectBoundingBox');
    for(i=0;i<N;i++){
      arr=kd==='swamp'?MARSH:WATER; pr=kd==='swamp'?isM:isW;
      if(!arr[i]) continue;
      r=(i/COLS)|0; c=i%COLS;
      var q=cellRoundRect(r,c,0,.34,.004,pr), rx=function(v){return v/COLS;}, ry=function(v){return v/ROWS;};
      var s=function(v,w){return {x:v/COLS,y:w/ROWS};};
      /* duong dan voi bo tron elip (tuong ung hinh tron vi o vuong) */
      var dstr='M'+rx(q.x0+q.tl)+' '+ry(q.y0)+' L'+rx(q.x1-q.tr)+' '+ry(q.y0)+(q.tr?' A'+rx(q.tr)+' '+ry(q.tr)+' 0 0 1 '+rx(q.x1)+' '+ry(q.y0+q.tr):'')+
        ' L'+rx(q.x1)+' '+ry(q.y1-q.br)+(q.br?' A'+rx(q.br)+' '+ry(q.br)+' 0 0 1 '+rx(q.x1-q.br)+' '+ry(q.y1):'')+
        ' L'+rx(q.x0+q.bl)+' '+ry(q.y1)+(q.bl?' A'+rx(q.bl)+' '+ry(q.bl)+' 0 0 1 '+rx(q.x0)+' '+ry(q.y1-q.bl):'')+
        ' L'+rx(q.x0)+' '+ry(q.y0+q.tl)+(q.tl?' A'+rx(q.tl)+' '+ry(q.tl)+' 0 0 1 '+rx(q.x0+q.tl)+' '+ry(q.y0):'')+' Z';
      p=document.createElementNS(NS,'path'); p.setAttribute('d',dstr); cp.appendChild(p);
    }
    defs.appendChild(cp);
  });
  lk.appendChild(svg);
  kinds.forEach(function(kd,idx){
    layer=document.createElement('div'); layer.className='lake all '+kd; layer.style.clipPath='url(#clip-'+kd+')'; layer.style.webkitClipPath='url(#clip-'+kd+')';
    layer.innerHTML='<div class="waves"></div><div class="glint"></div>';
    for(f=0;f<3;f++){
      mk=document.createElement('span'); mk.className='fish'; mk.textContent=kd==='swamp'?(f%2?'🐸':'🪷'):(f%2?'🐠':'🐟');
      mk.style.setProperty('--y',(18+f*26)+'%'); mk.style.setProperty('--dur',(10+f*3+idx*2)+'s'); mk.style.setProperty('--delay',(-f*5-idx*2)+'s');
      layer.appendChild(mk);
    }
    lk.appendChild(layer);
  });
}

/* ---------- Luoi, o danh dau va ho ---------- */
var cursor=31;
function layoutBoard(){
  var i, d, m, mk, lk, f;
  boardEl.style.setProperty('--cols',COLS); boardEl.style.setProperty('--rows',ROWS);
  gridEl.innerHTML=''; marksEl.innerHTML=''; markEls=[];
  for(i=0;i<N;i++){
    d=document.createElement('div'); d.className='cell';
    if(TRAP[i]){d.classList.add(TRAP[i]>0?'t-me':'t-foe');d.innerHTML=TRAP_SVG;}
    else if(DEN[i]){d.classList.add(DEN[i]>0?'den-me':'den-foe');d.innerHTML=DEN_SVG;}
    else if(OUTPOST[i]){d.classList.add('outpost');d.innerHTML=OUT_SVG;d.title='Tiền đồn: chiếm được thì đi thêm 1 ô';}
    gridEl.appendChild(d);
    m=document.createElement('div'); m.className='m';
    marksEl.appendChild(m); markEls.push(m);
  }
  lk=$('lakes'); lk.innerHTML=''; buildWater(lk);
  cursor=Math.floor(ROWS/2)*COLS+(COLS>>1);
}

/* ---------- Ground painting (canvas) ---------- */
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function isDark(){
  var t=document.documentElement.getAttribute('data-theme');
  if(t==='dark') return true; if(t==='light') return false;
  return !!(window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches);
}
function rrect(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath();}
function drawGround(){
  var cv=$('ground'), w=boardEl.clientWidth; if(!w) return;
  var cs=w/COLS, h=cs*ROWS, dpr=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr);
  var g=cv.getContext('2d'); if(!g) return;
  g.setTransform(dpr,0,0,dpr,0,0);
  var dark=isDark(), R=mulberry(20261023), i, k, j, p, x, y, a, rad, rg, lg, px, py;
  /* base grass */
  lg=g.createLinearGradient(0,0,w*.4,h);
  lg.addColorStop(0,dark?'#3a8250':'#82bd5c'); lg.addColorStop(.5,dark?'#2f7044':'#6aa84b'); lg.addColorStop(1,dark?'#265c38':'#58923e');
  g.fillStyle=lg; g.fillRect(0,0,w,h);
  for(k=0;k<Math.round(N*.54);k++){
    x=R()*w; y=R()*h; rad=cs*(.9+R()*2.2);
    rg=g.createRadialGradient(x,y,0,x,y,rad);
    rg.addColorStop(0,R()<.5?'rgba(235,245,150,.17)':'rgba(8,50,20,.2)'); rg.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=rg; g.fillRect(x-rad,y-rad,rad*2,rad*2);
  }
  for(i=0;i<ROWS;i++){ g.fillStyle=(i%2)?'rgba(255,255,255,.04)':'rgba(0,0,0,.035)'; g.fillRect(0,i*cs,w,cs); }
  /* sac mau ba vung: rung sau (trai), dong co (giua), dam lay (phai) */
  (function(){
    var z0=g.createLinearGradient(0,0,cs*3,0), z2=g.createLinearGradient(cs*6,0,w,0);
    z0.addColorStop(0,dark?'rgba(5,45,25,.5)':'rgba(10,70,35,.42)'); z0.addColorStop(1,'rgba(10,70,35,0)');
    g.fillStyle=z0; g.fillRect(0,0,cs*3,h);
    z2.addColorStop(0,'rgba(120,130,60,0)'); z2.addColorStop(1,dark?'rgba(95,100,45,.45)':'rgba(150,150,70,.4)');
    g.fillStyle=z2; g.fillRect(cs*6,0,w-cs*6,h);
    var mg=g.createRadialGradient(w/2,h/2,0,w/2,h/2,cs*2.6);
    mg.addColorStop(0,dark?'rgba(210,200,110,.28)':'rgba(255,240,150,.4)'); mg.addColorStop(1,'rgba(255,240,150,0)');
    g.fillStyle=mg; g.fillRect(w/2-cs*3,h/2-cs*3,cs*6,cs*6);
  })();
  var cols=[dark?'rgba(150,210,120,.3)':'rgba(208,242,142,.42)', dark?'rgba(10,50,25,.4)':'rgba(25,80,30,.34)', dark?'rgba(80,150,90,.3)':'rgba(120,185,80,.42)'], nb=Math.round(w*h/48), len, ang;
  g.lineWidth=.9; g.lineCap='round';
  for(p=0;p<3;p++){
    g.strokeStyle=cols[p]; g.beginPath();
    for(k=0;k<nb/3;k++){ x=R()*w; y=R()*h; len=2+R()*5; ang=-1.5708+(R()-.5); g.moveTo(x,y); g.lineTo(x+Math.cos(ang)*len,y+Math.sin(ang)*len); }
    g.stroke();
  }
  function usable(px,py){
    var c=Math.floor(px/cs), r=Math.floor(py/cs), idx=r*COLS+c;
    if(c<0||c>COLS-1||r<0||r>ROWS-1) return false;
    if(WATER[idx]||TRAP[idx]||DEN[idx]||ROCK[idx]||BUSH[idx]||MARSH[idx]||OUTPOST[idx]||terrCh(idx)==='='||terrCh(idx)==='_') return false;
    return true;
  }
  /* flowers and bushes */
  var fl=['#ffffff','#ffe066','#ff9ec4','#c9a7ff','#ff8a65'], cnt, cx, cy, col, fx, fy, fr, bs;
  for(k=0;k<Math.round(N*.64);k++){
    cx=R()*w; cy=R()*h; col=fl[(R()*fl.length)|0]; cnt=2+((R()*3)|0);
    for(j=0;j<cnt;j++){
      fx=cx+(R()-.5)*cs*.3; fy=cy+(R()-.5)*cs*.25; fr=cs*(.022+R()*.014);
      if(!usable(fx,fy)) continue;
      g.strokeStyle='rgba(30,90,30,.85)'; g.lineWidth=1; g.beginPath(); g.moveTo(fx,fy+fr*3); g.lineTo(fx,fy); g.stroke();
      g.fillStyle=col;
      for(p=0;p<5;p++){ a=p*1.2566; g.beginPath(); g.arc(fx+Math.cos(a)*fr,fy+Math.sin(a)*fr,fr*.8,0,6.2832); g.fill(); }
      g.fillStyle='#f6c516'; g.beginPath(); g.arc(fx,fy,fr*.65,0,6.2832); g.fill();
    }
  }
  for(k=0;k<Math.round(N*.17);k++){
    cx=R()*w; cy=R()*h; bs=cs*(.12+R()*.08);
    if(!usable(cx,cy)) continue;
    g.fillStyle='rgba(0,0,0,.26)'; g.beginPath(); g.ellipse(cx+bs*.2,cy+bs*.8,bs*1.5,bs*.45,0,0,6.3); g.fill();
    [[-.7,.1],[.7,.15],[0,-.35]].forEach(function(o){
      var gx=cx+o[0]*bs, gy=cy+o[1]*bs, bg=g.createRadialGradient(gx-bs*.3,gy-bs*.4,0,gx,gy,bs*1.1);
      bg.addColorStop(0,dark?'#4a9a5a':'#7ccb62'); bg.addColorStop(1,dark?'#1d5230':'#2f7a3a');
      g.fillStyle=bg; g.beginPath(); g.arc(gx,gy,bs,0,6.2832); g.fill();
    });
  }
  /* dirt around dens and traps */
  [DENFOE,DENME].forEach(function(d){
    var dx=(d%COLS+.5)*cs, dy=(((d/COLS)|0)+.5)*cs, dg=g.createRadialGradient(dx,dy,0,dx,dy,cs*1.2);
    dg.addColorStop(0,'rgba(124,90,54,.92)'); dg.addColorStop(.55,'rgba(124,90,54,.55)'); dg.addColorStop(1,'rgba(124,90,54,0)');
    g.fillStyle=dg; g.fillRect(dx-cs*1.3,dy-cs*1.3,cs*2.6,cs*2.6);
  });
  for(i=0;i<N;i++){
    if(!TRAP[i]) continue;
    var tx=(i%COLS+.5)*cs, ty=(((i/COLS)|0)+.5)*cs, tg=g.createRadialGradient(tx,ty,0,tx,ty,cs*.75);
    tg.addColorStop(0,'rgba(98,70,40,.75)'); tg.addColorStop(1,'rgba(98,70,40,0)');
    g.fillStyle=tg; g.fillRect(tx-cs,ty-cs,cs*2,cs*2);
  }
  /* bo nuoc, nuoc, cau go, da, bui */
  var pad=.14, sgc=dark?['#8f8562','#74694a']:['#e6d6a6','#c8b078'], q, wi, rr, ch, cr, cc;
  function trace(q,sc){
    var x0=q.x0*cs,y0=q.y0*cs,x1=q.x1*cs,y1=q.y1*cs,tl=q.tl*cs,tr=q.tr*cs,br=q.br*cs,bl=q.bl*cs;
    g.beginPath(); g.moveTo(x0+tl,y0); g.lineTo(x1-tr,y0); if(tr) g.arcTo(x1,y0,x1,y0+tr,tr);
    g.lineTo(x1,y1-br); if(br) g.arcTo(x1,y1,x1-br,y1,br);
    g.lineTo(x0+bl,y1); if(bl) g.arcTo(x0,y1,x0,y1-bl,bl);
    g.lineTo(x0,y0+tl); if(tl) g.arcTo(x0,y0,x0+tl,y0,tl); g.closePath();
  }
  g.save(); g.shadowColor='rgba(0,0,0,.3)'; g.shadowBlur=cs*.1; g.shadowOffsetY=cs*.02;
  for(i=0;i<N;i++){ if(!WATER[i]) continue; q=cellRoundRect((i/COLS)|0,i%COLS,pad,.34,0); trace(q); g.fillStyle=sgc[0]; g.fill(); }
  g.restore();
  for(i=0;i<N;i++){ if(!WATER[i]) continue; q=cellRoundRect((i/COLS)|0,i%COLS,pad*.45,.34,0); trace(q); g.fillStyle='rgba(84,62,36,.62)'; g.fill(); }
  for(i=0;i<N;i++){ if(!WATER[i]) continue; q=cellRoundRect((i/COLS)|0,i%COLS,0,.34,.004); trace(q); g.fillStyle='#0b3a5a'; g.fill(); }
  for(k=0;k<N*5;k++){
    px=R()*w; py=R()*h; cr=Math.floor(py/cs); cc=Math.floor(px/cs);
    if(cr<0||cc<0||cr>=ROWS||cc>=COLS||WATER[cr*COLS+cc]) continue;
    var nw=isW(cr-1,cc)||isW(cr+1,cc)||isW(cr,cc-1)||isW(cr,cc+1)||isW(cr-1,cc-1)||isW(cr+1,cc+1)||isW(cr-1,cc+1)||isW(cr+1,cc-1);
    if(!nw) continue;
    g.fillStyle=R()<.5?'rgba(118,104,80,.6)':'rgba(250,240,205,.55)';
    g.beginPath(); g.ellipse(px,py,cs*(.012+R()*.016),cs*(.009+R()*.01),R()*3,0,6.3); g.fill();
  }
  /* bai can: loi di rong giua song, da bac thang tren nuoc nong */
  for(i=0;i<N;i++){
    if(terrCh(i)!=='_') continue;
    cr=(i/COLS)|0; cc=i%COLS; x=cc*cs; y=cr*cs;
    rg=g.createLinearGradient(x,y,x,y+cs); rg.addColorStop(0,dark?'rgba(60,150,190,.75)':'rgba(120,200,235,.8)'); rg.addColorStop(1,dark?'rgba(30,100,150,.75)':'rgba(70,160,205,.8)');
    g.fillStyle=rg; g.fillRect(x-cs*.02,y+cs*.08,cs*1.04,cs*.84);
    g.strokeStyle='rgba(255,255,255,.35)'; g.lineWidth=1.2; g.beginPath(); g.moveTo(x,y+cs*.3); g.quadraticCurveTo(x+cs*.25,y+cs*.22,x+cs*.5,y+cs*.3); g.quadraticCurveTo(x+cs*.75,y+cs*.38,x+cs,y+cs*.3); g.stroke();
    for(k=0;k<5;k++){
      var sx2=x+cs*(.14+(k%3)*.3+(k>2?.15:0)), sy2=y+cs*(.3+(k>2?.38:.05)), sr=cs*(.07+R()*.04);
      g.fillStyle='rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(sx2+1,sy2+2,sr*1.2,sr*.8,0,0,6.3); g.fill();
      g.fillStyle=dark?'#a8a6a0':'#d4d0c6'; g.beginPath(); g.ellipse(sx2,sy2,sr*1.2,sr*.8,0,0,6.3); g.fill();
    }
  }
  /* dam lay: bun, nuoc duc, bong sen, lau say */
  for(i=0;i<N;i++){ if(!MARSH[i]) continue; q=cellRoundRect((i/COLS)|0,i%COLS,.1,.34,0,isM); trace(q); g.fillStyle='rgba(98,80,46,.6)'; g.fill(); }
  for(i=0;i<N;i++){
    if(!MARSH[i]) continue;
    q=cellRoundRect((i/COLS)|0,i%COLS,0,.34,.004,isM); trace(q);
    rg=g.createLinearGradient(0,((i/COLS)|0)*cs,0,(((i/COLS)|0)+1)*cs); rg.addColorStop(0,dark?'#3f6b55':'#7fb08a'); rg.addColorStop(1,dark?'#2c4f40':'#5d9170');
    g.fillStyle=rg; g.fill();
  }
  for(i=0;i<N;i++){
    if(!MARSH[i]) continue;
    var mx=(i%COLS)*cs, my=((i/COLS)|0)*cs;
    for(k=0;k<3;k++){
      var lx=mx+cs*(.2+R()*.6), ly=my+cs*(.2+R()*.6), lr=cs*(.07+R()*.05);
      g.fillStyle=dark?'#2f7a48':'#4fae60'; g.beginPath(); g.arc(lx,ly,lr,.4,6.0); g.lineTo(lx,ly); g.fill();
      if(k===0){ g.fillStyle='#ff9ec4'; g.beginPath(); g.arc(lx+lr*.3,ly-lr*.2,lr*.35,0,6.3); g.fill(); }
    }
    g.strokeStyle='rgba(255,255,255,.22)'; g.lineWidth=1.1;
    for(k=0;k<3;k++){ var wx=mx+cs*(.15+R()*.5), wy=my+cs*(.2+R()*.6); g.beginPath(); g.moveTo(wx,wy); g.quadraticCurveTo(wx+cs*.1,wy-cs*.04,wx+cs*.22,wy); g.stroke(); }
  }
  /* tien don: dat nen va vong tron */
  for(i=0;i<N;i++){
    if(!OUTPOST[i]) continue;
    var ox=((i%COLS)+.5)*cs, oy=(((i/COLS)|0)+.5)*cs, og=g.createRadialGradient(ox,oy,0,ox,oy,cs*.62);
    og.addColorStop(0,'rgba(150,112,62,.9)'); og.addColorStop(.7,'rgba(150,112,62,.5)'); og.addColorStop(1,'rgba(150,112,62,0)');
    g.fillStyle=og; g.fillRect(ox-cs*.7,oy-cs*.7,cs*1.4,cs*1.4);
  }
  /* cau go: san van ngang qua song, tay vin hai ben mep nuoc */
  for(i=0;i<N;i++){
    if(terrCh(i)!=='=') continue;
    cr=(i/COLS)|0; cc=i%COLS; var x0=cc*cs, y0=cr*cs, vert=isW(cr,cc-1)||isW(cr,cc+1);
    g.save(); g.shadowColor='rgba(0,0,0,.4)'; g.shadowBlur=cs*.08;
    g.fillStyle=dark?'#7a5430':'#a9763f';
    if(vert) g.fillRect(x0+cs*.04,y0-cs*.04,cs*.92,cs*1.08); else g.fillRect(x0-cs*.04,y0+cs*.04,cs*1.08,cs*.92);
    g.restore();
    g.lineWidth=1.2;
    for(k=1;k<6;k++){
      g.strokeStyle='rgba(60,35,15,.55)'; g.beginPath();
      if(vert){ g.moveTo(x0+cs*.05,y0+k*cs/6); g.lineTo(x0+cs*.95,y0+k*cs/6); } else { g.moveTo(x0+k*cs/6,y0+cs*.05); g.lineTo(x0+k*cs/6,y0+cs*.95); }
      g.stroke();
      g.strokeStyle='rgba(255,220,160,.22)'; g.beginPath();
      if(vert){ g.moveTo(x0+cs*.05,y0+k*cs/6+1.5); g.lineTo(x0+cs*.95,y0+k*cs/6+1.5); } else { g.moveTo(x0+k*cs/6+1.5,y0+cs*.05); g.lineTo(x0+k*cs/6+1.5,y0+cs*.95); }
      g.stroke();
    }
    g.fillStyle='#5a3a1c';
    if(vert){ g.fillRect(x0+cs*.02,y0-cs*.03,cs*.07,cs*1.06); g.fillRect(x0+cs*.91,y0-cs*.03,cs*.07,cs*1.06); }
    else{ g.fillRect(x0-cs*.03,y0+cs*.02,cs*1.06,cs*.07); g.fillRect(x0-cs*.03,y0+cs*.91,cs*1.06,cs*.07); }
  }
  /* bai san trung tam: vong vang quanh o giua */
  (function(){
    var cx=w/2, cy=h/2;
    g.save(); g.setLineDash([cs*.12,cs*.1]); g.lineWidth=Math.max(2,cs*.04); g.strokeStyle=dark?'rgba(255,225,120,.6)':'rgba(190,130,20,.75)';
    g.beginPath(); g.arc(cx,cy,cs*1.45,0,6.2832); g.stroke(); g.restore();
  })();
  /* nui da */
  for(i=0;i<N;i++){
    if(!ROCK[i]) continue;
    var rx=((i%COLS)+.5)*cs, ry=(((i/COLS)|0)+.5)*cs, rg2;
    g.fillStyle='rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(rx+cs*.05,ry+cs*.34,cs*.42,cs*.12,0,0,6.3); g.fill();
    [[-.18,.08,.3],[.2,.1,.27],[0,-.14,.32]].forEach(function(o,n){
      var gx=rx+o[0]*cs, gy=ry+o[1]*cs, rr2=o[2]*cs;
      rg2=g.createLinearGradient(gx-rr2,gy-rr2,gx+rr2,gy+rr2); rg2.addColorStop(0,dark?'#9b9a9e':'#cfcbc4'); rg2.addColorStop(1,dark?'#4d4c52':'#7d7a76');
      g.fillStyle=rg2; g.beginPath();
      for(j=0;j<7;j++){ a=j*.8976+n; var rr3=rr2*(.8+.2*Math.sin(j*2.3+n)); g.lineTo(gx+Math.cos(a)*rr3,gy+Math.sin(a)*rr3*.9); }
      g.closePath(); g.fill(); g.strokeStyle='rgba(30,28,30,.55)'; g.lineWidth=1.2; g.stroke();
    });
  }
  /* bui ram va rung; cot cuoi la lau say dam lay */
  for(i=0;i<N;i++){
    if(!BUSH[i]) continue;
    var bx=(i%COLS)*cs, by=((i/COLS)|0)*cs, reed=(i%COLS)>=6;
    if(reed){
      g.fillStyle='rgba(60,70,30,.35)'; g.fillRect(bx+cs*.04,by+cs*.04,cs*.92,cs*.92);
      for(k=0;k<16;k++){
        var sx=bx+cs*(.1+R()*.8), sy=by+cs*(.55+R()*.4), hh=cs*(.35+R()*.3);
        g.strokeStyle=R()<.5?'#a9b45a':'#7d9a3c'; g.lineWidth=1.6; g.beginPath(); g.moveTo(sx,sy); g.quadraticCurveTo(sx+(R()-.5)*cs*.1,sy-hh*.5,sx+(R()-.5)*cs*.14,sy-hh); g.stroke();
        if(k%3===0){ g.fillStyle='#6b4a2a'; g.beginPath(); g.ellipse(sx+(R()-.5)*cs*.1,sy-hh,cs*.025,cs*.07,0,0,6.3); g.fill(); }
      }
    }else{
      g.fillStyle='rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(bx+cs*.5,by+cs*.9,cs*.44,cs*.1,0,0,6.3); g.fill();
      for(k=0;k<7;k++){
        var tx2=bx+cs*(.2+R()*.6), ty2=by+cs*(.2+R()*.6), tr2=cs*(.17+R()*.1), tg2=g.createRadialGradient(tx2-tr2*.3,ty2-tr2*.4,0,tx2,ty2,tr2*1.1);
        tg2.addColorStop(0,dark?'#4f9d5c':'#79c45f'); tg2.addColorStop(1,dark?'#1c5232':'#2a7436');
        g.fillStyle=tg2; g.beginPath(); g.arc(tx2,ty2,tr2,0,6.2832); g.fill();
      }
    }
  }
  /* grid lines */
  g.lineWidth=1;
  for(i=1;i<COLS;i++){ g.strokeStyle='rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(i*cs,0); g.lineTo(i*cs,h); g.stroke(); g.strokeStyle='rgba(0,0,0,.09)'; g.beginPath(); g.moveTo(i*cs+1,0); g.lineTo(i*cs+1,h); g.stroke(); }
  for(i=1;i<ROWS;i++){ g.strokeStyle='rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(0,i*cs); g.lineTo(w,i*cs); g.stroke(); g.strokeStyle='rgba(0,0,0,.09)'; g.beginPath(); g.moveTo(0,i*cs+1); g.lineTo(w,i*cs+1); g.stroke(); }
  /* light */
  lg=g.createLinearGradient(0,0,w,h);
  lg.addColorStop(0,'rgba(255,255,225,.13)'); lg.addColorStop(.5,'rgba(0,0,0,0)'); lg.addColorStop(1,'rgba(0,0,0,.2)');
  g.fillStyle=lg; g.fillRect(0,0,w,h);
}
var gTimer=0;
function scheduleGround(){ cancelAnimationFrame(gTimer); gTimer=requestAnimationFrame(drawGround); }
if(window.ResizeObserver) new ResizeObserver(scheduleGround).observe(boardEl); else window.addEventListener('resize',scheduleGround);
try{ if(window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change',scheduleGround); }catch(e){}
try{ new MutationObserver(scheduleGround).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']}); }catch(e){}
function burst(i,icons){
  var r=(i/COLS)|0, c=i%COLS, n=8, k, a, s, dist=boardEl.clientWidth/COLS*.9;
  for(k=0;k<n;k++){
    a=k/n*Math.PI*2+Math.random()*.4;
    s=document.createElement('span'); s.className='spark';
    s.textContent=icons[k%icons.length];
    s.style.left=((c+.5)*100/COLS)+'%'; s.style.top=((r+.5)*100/ROWS)+'%';
    s.style.setProperty('--dx',(Math.cos(a)*dist).toFixed(0)+'px');
    s.style.setProperty('--dy',(Math.sin(a)*dist).toFixed(0)+'px');
    fxEl.appendChild(s);
    (function(x){setTimeout(function(){if(x.parentNode)x.parentNode.removeChild(x);},750);})(s);
  }
}
function confetti(){
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var wrap=$('confetti'), items=['🎉','⭐','🍃','🌟','🍌','🐾','✨'], k, s;
  for(k=0;k<56;k++){
    s=document.createElement('span'); s.className='conf';
    s.textContent=items[(Math.random()*items.length)|0];
    s.style.left=(Math.random()*100)+'%';
    s.style.fontSize=(16+Math.random()*16)+'px';
    s.style.setProperty('--dx',((Math.random()-.5)*160)+'px');
    s.style.setProperty('--rot',((Math.random()-.5)*720)+'deg');
    s.style.setProperty('--dur',(2.4+Math.random()*1.8)+'s');
    s.style.setProperty('--delay',(Math.random()*.7)+'s');
    wrap.appendChild(s);
  }
  setTimeout(function(){wrap.innerHTML='';},5200);
}
