function makeEngine(){
'use strict';
/* ---------- Board ---------- */
/* Du lieu ban do: moi ky tu la mot o. Hang 0 la phe tren, hang 8 la phe duoi.
   . dat/co   ~ song   s ao dam lay (nuoc)   # nui da (khong di qua)   b bui/rung/lau say (chan chieu di thang)
   = cau go hep (dat, Voi khong qua duoc)   _ bai can/loi di rong giua (dat)   T bay (hang <4 la bay phe tren, con lai phe duoi)   D hang */
var MAPROWS=[
  '...TDT...',
  '..b.T....',
  '.bb......',
  '.O#...mmb',
  '~=~~__~~=',
  '.O#...mmb',
  '.bb......',
  '..b.T....',
  '...TDT...'
];
/* Vi tri xuat phat cua phe duoi: bac -> [hang,cot]; phe tren la anh guong qua hang giua. Quan ngoai bac: EXTRA. */
var STARTS={8:[6,4],7:[8,1],6:[7,7],5:[6,6],4:[7,3],3:[6,5],2:[7,1],1:[6,7]}, EXTRA=[7,5];
var ROWS=MAPROWS.length, COLS=MAPROWS[0].length, N=ROWS*COLS, DENME=-1, DENFOE=-1;
var WATER=new Uint8Array(N), TRAP=new Int8Array(N), DEN=new Int8Array(N), ROCK=new Uint8Array(N), BUSH=new Uint8Array(N), BRIDGE=new Uint8Array(N), MARSH=new Uint8Array(N), OUTPOST=new Uint8Array(N), ADJ=new Int16Array(N*4).fill(-1);
(function(){
  var r,c,k,ch,d,n;
  for(r=0;r<ROWS;r++)for(c=0;c<COLS;c++){
    k=r*COLS+c; ch=MAPROWS[r].charAt(c);
    if(ch==='~'||ch==='s')WATER[k]=1;
    else if(ch==='#')ROCK[k]=1;
    else if(ch==='b')BUSH[k]=1;
    else if(ch==='=')BRIDGE[k]=1;
    else if(ch==='m')MARSH[k]=1;
    else if(ch==='O')OUTPOST[k]=1;
    else if(ch==='T')TRAP[k]=r<(ROWS>>1)?-1:1;
    else if(ch==='D'){ if(r<(ROWS>>1)){DEN[k]=-1;DENFOE=k;}else{DEN[k]=1;DENME=k;} }
    if(r>0)ADJ[k*4]=k-COLS;
    if(r<ROWS-1)ADJ[k*4+1]=k+COLS;
    if(c>0)ADJ[k*4+2]=k-1;
    if(c<COLS-1)ADJ[k*4+3]=k+1;
  }
  /* Nui da: go bo moi ket noi de khong ai di qua, khong chieu nao xuyen qua. */
  for(k=0;k<N;k++){
    for(d=0;d<4;d++){ n=ADJ[k*4+d]; if(ROCK[k]||(n>=0&&ROCK[n])) ADJ[k*4+d]=-1; }
  }
})();
/* cells[0..N-1] la ban co. Cac o N..N+7 la trang thai:
   N+a: Ho vua nhay (a=0 ben duoi, 1 ben tren); N+2+a: hoi chieu Su tu;
   N+4+a: hoi chieu Bo rung; N+6+a: hoi chieu Khi. */
var SL=N, ST=12, OUTCD=2, BONUS=true;
var CLASSIC=false, TERR=true;
var HK=new Array(19).fill('');
var SLOTKEYS=[null,['rat'],['cat','fox'],['wolf','boar'],['dog','bear'],['leo','croc'],['tig','eagle'],['lio','bison'],['ele'],['','mon','tur']];
var SQ=[[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]];
function setKeys(){
  var r;
  for(r=1;r<=8;r++){ HK[r+9]=SLOTKEYS[r][CLASSIC?0:(SQ[0][r]||0)]; HK[9-r]=SLOTKEYS[r][CLASSIC?0:(SQ[1][r]||0)]; }
  HK[18]=CLASSIC?'':SLOTKEYS[9][SQ[0][9]||0]; HK[0]=CLASSIC?'':SLOTKEYS[9][SQ[1][9]||0];
}
function setClassic(v){ CLASSIC=!!v; setKeys(); }
setKeys();

function initialCells(){
  var a=new Int8Array(N+ST);
  Object.keys(STARTS).forEach(function(k){
    var rk=+k, r=STARTS[k][0], c=STARTS[k][1];
    a[r*COLS+c]=rk;
    a[(ROWS-1-r)*COLS+c]=-rk;
  });
  if(!CLASSIC){
    if(SQ[0][9]) a[EXTRA[0]*COLS+EXTRA[1]]=9;
    if(SQ[1][9]) a[(ROWS-1-EXTRA[0])*COLS+EXTRA[1]]=-9;
  }
  return a;
}

/* ---------- Rank helpers ---------- */
function dirOf(f,t){ for(var d=0;d<4;d++) if(ADJ[f*4+d]===t) return d; return -1; }
function nearWater(i){var d,n;for(d=0;d<4;d++){n=ADJ[i*4+d];if(n>=0&&WATER[n])return true;}return false;}
function advanced(i,s){var r=(i/COLS)|0;return s>0?r<(ROWS>>1):r>(ROWS>>1);}
function guarding(i,s){
  var den=s>0?DENME:DENFOE;
  return Math.abs(((i/COLS)|0)-((den/COLS)|0))+Math.abs(i%COLS-den%COLS)<=2;
}
function hasMate(cells,i){
  var s=cells[i]>0?1:-1,d,n,c;
  for(d=0;d<4;d++){ n=ADJ[i*4+d]; if(n<0) continue; c=cells[n]*s; if(c>=2&&c<=8) return true; }
  return false;
}
function effRank(cells,i){
  var c=cells[i], s=c>0?1:-1, r=c>0?c:-c, k;
  if(r===9) return 0;
  if(TRAP[i]===-s) return (r===8&&!CLASSIC)?4:0;
  if(CLASSIC) return r;
  k=HK[c+9];
  if(k==='wolf') return hasMate(cells,i)?4:3;
  if(k==='boar') return nearWater(i)?4:3;
  if(k==='dog') return guarding(i,s)?5:4;
  if(k==='bear') return advanced(i,s)?5:4;
  if(k==='croc') return inW(cells,i)?6:3;
  if(k==='tig') return cells[SL+(s>0?0:1)]===1?7:6;
  return r;
}
function inW(cells,i){
  if(WATER[i]) return true;
  if(MARSH[i]&&!CLASSIC&&TERR){ var k=HK[cells[i]+9]; return k==='rat'||k==='croc'; }
  return false;
}
function isTur(c){ return c!==0&&(c===9||c===-9)&&HK[c+9]==='tur'; }
/* Quan dich ke ben chi bi khoa khi Cho dang o khu hang nha (Gau khong bi khoa). */
function locked(cells,i){
  var c=cells[i], s=c>0?1:-1, d, n;
  if(HK[c+9]==='bear') return false;
  for(d=0;d<4;d++){
    n=ADJ[i*4+d];
    if(n>=0&&cells[n]===-s*4&&HK[-s*4+9]==='dog'&&guarding(n,-s)) return true;
  }
  return false;
}

/* canCap: quan o i co an duoc quan dich o t khong. atk: bac tan cong nang tam thoi. */
function canCap(cells,i,t,atk){
  var c=cells[i], tc=cells[t], r=c>0?c:-c, dr=tc>0?tc:-tc, er, ar, dd;
  if(r===9) return false;
  if(isTur(tc)) return false;
  er=effRank(cells,i); if(er<=0) return false;
  var wi=inW(cells,i), wt=inW(cells,t);
  if(wi!==wt){
    if(!CLASSIC&&HK[c+9]==='croc'&&!wi&&wt&&dr===1) return true;
    return false;
  }
  ar=(atk&&atk>er)?atk:er;
  if(r===1&&dr===8) return true;
  dd=effRank(cells,t);
  if(r===8&&dr===1) return dd===0;
  return ar>=dd;
}
function stepOK(cells,i,t,atk){
  var c=cells[i], s=c>0?1:-1, tc=cells[t];
  if(DEN[t]===s) return false;
  if(DEN[t]&&isTur(c)) return false;
  /* Voi qua nang: khong buoc len cau go hep. */
  if(BRIDGE[t]&&TERR&&!CLASSIC&&HK[c+9]==='ele') return false;
  if(tc===0) return true;
  if(tc*s>0) return false;
  return canCap(cells,i,t,atk||0);
}

/* Bo rung huc: quan dich o t2 (khong phai Rua, khong o nuoc/dam lay-nuoc) bi day lui 1 o ve o b cung huong.
   b phai ton tai, trong, khong phai ho/hang, va hop le voi quan bi day (stepOK: Voi khong len cau go, khong vao hang nha).
   Chuot/Ca sau khong bi day vao dam lay (se thanh 'o nuoc'). Huc khong an quan; neu b la bay thi ap dung luat bay hien co. */
function pushOK(cells,s,t2,b){
  var v=cells[t2], k;
  if(v*s>=0||isTur(v)||WATER[t2]||DEN[t2]||inW(cells,t2)) return false;
  if(b<0||cells[b]!==0||WATER[b]||DEN[b]) return false;
  k=HK[v+9];
  if(TERR&&MARSH[b]&&(k==='rat'||k==='croc')) return false;
  return stepOK(cells,t2,b,0);
}
/* kind: 0 buoc, 1 nhay ho, 2 Meo treo, 3 Cao nuoc rut, 4 Bao di cheo, 5 Khi doi cho,
   6 Ca sau bat moi (khong roi cho), 7 Su tu vo xa (khong roi cho), 8 Bo rung lao, 9 Bo rung huc (day lui 1 o) quan dich bat ky tru Rua.
   Nuoc di ma hoa: tu | den<<7 | kind<<14. Voi kind 6, 7: den la o nan nhan. Voi kind 9: den la o cua quan bi huc (Bo rung buoc vao o giua, quan bi day lui 1 o cung huong; neu vao bay phe Bo rung thi bi ha bac theo luat bay). */
function movesFrom(cells,i,out){
  var code=cells[i]; if(code===0) return out;
  var s=code>0?1:-1, a=s>0?0:1, K=HK[code+9], lock=CLASSIC?false:locked(cells,i);
  var d,t,t2,b,p,q,blocked,r,c,dr,dc,nr,nc,tc;
  for(d=0;d<4;d++){
    t=ADJ[i*4+d]; if(t<0) continue;
    if(WATER[t]){
      if(K==='rat'||K==='croc'){
        if(stepOK(cells,i,t,0)) out.push(i|(t<<7));
      }else if(K==='tig'||K==='eagle'||(CLASSIC&&K==='lio')){
        if(lock) continue;
        p=t; blocked=false;
        while(p>=0&&WATER[p]){
          if(K!=='eagle'){
            q=cells[p];
            if(CLASSIC?(q===1||q===-1):(q===-s||(q===-s*5&&HK[q+9]==='croc'))){blocked=true;break;}
          }
          p=ADJ[p*4+d];
        }
        if(!blocked&&p>=0&&stepOK(cells,i,p,(!CLASSIC&&K==='tig')?7:0)) out.push(i|(p<<7)|(1<<14));
      }
      /* Ca sau duoi ho van bi quan tren bo bac >= 6 tan cong (danh tu bo, khong roi cho). */
      if(!CLASSIC&&!lock&&!WATER[i]&&K!=='rat'&&K!=='croc'&&cells[t]===-s*5&&HK[cells[t]+9]==='croc'&&effRank(cells,i)>=6) out.push(i|(t<<7)|(6<<14));
      continue;
    }
    if(stepOK(cells,i,t,0)) out.push(i|(t<<7));
    /* Ca sau trong dam lay cung la 'o duoi nuoc': quan tren can bac >= 6 danh tu xa nhu voi ca sau duoi ho. */
    if(!CLASSIC&&TERR&&!lock&&MARSH[t]&&cells[t]===-s*5&&HK[cells[t]+9]==='croc'&&!inW(cells,i)&&effRank(cells,i)>=6) out.push(i|(t<<7)|(6<<14));
    if(CLASSIC||lock) continue;
    if(K==='cat'){
      if(cells[t]!==0){
        t2=ADJ[t*4+d];
        if(t2>=0&&!WATER[t2]&&!DEN[t2]&&stepOK(cells,i,t2,0)) out.push(i|(t2<<7)|(2<<14));
      }
    }else if(K==='fox'){
      if(cells[t]===0&&!DEN[t]&&!BUSH[t]&&!MARSH[t]){
        t2=ADJ[t*4+d];
        if(t2>=0&&!WATER[t2]&&!DEN[t2]&&stepOK(cells,i,t2,0)) out.push(i|(t2<<7)|(3<<14));
      }
    }else if(K==='lio'){
      if(cells[SL+2+a]===0&&cells[t]===0&&!DEN[t]&&!BUSH[t]&&!MARSH[t]){
        t2=ADJ[t*4+d];
        if(t2>=0&&!WATER[t2]&&!DEN[t2]&&(!TERR||!(BUSH[t2]||MARSH[t2]))&&cells[t2]*s<0&&canCap(cells,i,t2,0)) out.push(i|(t2<<7)|(7<<14));
      }
    }else if(K==='bison'){
      /* Lao (kind 8): hoi chieu rieng SL+4+a (1 luot). Huc (kind 9): hoi chieu rieng SL+10+a (2 luot). */
      if(cells[t]===0&&!DEN[t]&&!BUSH[t]&&!MARSH[t]){
        t2=ADJ[t*4+d];
        if(t2>=0&&!WATER[t2]&&!DEN[t2]){
          if(cells[SL+4+a]===0&&stepOK(cells,i,t2,0)) out.push(i|(t2<<7)|(8<<14));
          if(cells[SL+10+a]===0&&pushOK(cells,s,t2,ADJ[t2*4+d])) out.push(i|(t2<<7)|(9<<14));
        }
      }
    }else if(K==='mon'){
      if(cells[SL+6+a]===0&&cells[t]!==0&&!DEN[t]&&!DEN[i]&&!isTur(cells[t])&&!(TERR&&BRIDGE[i]&&HK[cells[t]+9]==='ele')) out.push(i|(t<<7)|(5<<14));
    }else if(K==='croc'){
      if(inW(cells,i)&&cells[t]*s<0&&!DEN[t]&&(!TERR||(!BUSH[t]&&!MARSH[t]))&&!isTur(cells[t])&&effRank(cells,t)<=4) out.push(i|(t<<7)|(6<<14));
    }
  }
  if(!CLASSIC&&!lock&&K==='leo'){
    r=(i/COLS)|0; c=i%COLS;
    for(dr=-1;dr<=1;dr+=2)for(dc=-1;dc<=1;dc+=2){
      nr=r+dr; nc=c+dc;
      if(nr<0||nr>ROWS-1||nc<0||nc>COLS-1) continue;
      t=nr*COLS+nc;
      if(!WATER[t]&&!DEN[t]&&!ROCK[t]&&stepOK(cells,i,t,6)) out.push(i|(t<<7)|(4<<14));
    }
  }
  return out;
}
function genMoves(cells,s){
  var out=[], i, c, a=s>0?0:1, n, j, m, f, t, k, dst, cap, tmp, q, x;
  for(i=0;i<N;i++){
    c=cells[i];
    if(c===0||(c>0)!==(s>0)) continue;
    movesFrom(cells,i,out);
  }
  /* Tien don: chiem duoc o tien don thi duoc them 1 buoc thuong (khong an quan, khong vao hang). */
  if(BONUS&&!CLASSIC&&TERR&&cells[SL+8+a]===0){
    n=out.length;
    for(j=0;j<n;j++){
      m=out[j]; f=m&127; t=(m>>7)&127; k=(m>>14)&15;
      dst=(k===9)?((f+t)>>1):((k===6||k===7)?-1:t);
      if(dst<0||!OUTPOST[dst]||OUTPOST[f]) continue;
      cap=make(cells,f,t,k);
      for(i=0;i<N;i++){
        if(cells[i]*s<=0) continue;
        tmp=[]; movesFrom(cells,i,tmp);
        for(q=0;q<tmp.length;q++){
          x=tmp[q];
          if(((x>>14)&15)!==0) continue;
          if(cells[(x>>7)&127]!==0||DEN[(x>>7)&127]) continue;
          out.push(m|(i<<18)|(((x>>7)&127)<<25));
        }
      }
      unmake(cells,f,t,k,cap);
    }
  }
  return out;
}

/* ---------- Make / unmake (co ngan xep trang thai) ---------- */
var stk=new Int8Array(ST*1024), sp=0;
function make(cells,f,t,k,bonus){
  var c=cells[f], a=c>0?0:1, o=sp*ST, j, cap=0, d, e, b;
  for(j=0;j<ST;j++) stk[o+j]=cells[SL+j];
  sp++;
  if(bonus){ cells[t]=c; cells[f]=0; return 0; }
  cells[SL+a]=0;
  if(cells[SL+8+a]>0) cells[SL+8+a]--;
  if(cells[SL+2+a]>0) cells[SL+2+a]--;
  if(cells[SL+4+a]>0) cells[SL+4+a]--;
  if(cells[SL+6+a]>0) cells[SL+6+a]--;
  if(cells[SL+10+a]>0) cells[SL+10+a]--;
  if(k===5){ cap=cells[t]; cells[t]=c; cells[f]=cap; }
  else if(k===6){ cap=cells[t]; cells[t]=0; }
  else if(k===7){ cap=cells[t]; cells[t]=0; cells[SL+2+a]=2; }
  else if(k===9){ e=(f+t)>>1; d=dirOf(f,e); b=ADJ[t*4+d]; cells[b]=cells[t]; cells[t]=0; cells[e]=c; cells[f]=0; cells[SL+10+a]=2; }
  else{
    cap=cells[t]; cells[t]=c; cells[f]=0;
    if(k===1&&HK[c+9]==='tig') cells[SL+a]=1;
    else if(k===8) cells[SL+4+a]=1;
  }
  return cap;
}
function unmake(cells,f,t,k,cap){
  var o, j, d, e, b;
  sp--; o=sp*ST;
  if(k===5){ cells[f]=cells[t]; cells[t]=cap; }
  else if(k===6||k===7){ cells[t]=cap; }
  else if(k===9){ e=(f+t)>>1; d=dirOf(f,e); b=ADJ[t*4+d]; cells[t]=cells[b]; cells[b]=0; cells[f]=cells[e]; cells[e]=0; }
  else{ cells[f]=cells[t]; cells[t]=cap; }
  for(j=0;j<ST;j++) cells[SL+j]=stk[o+j];
}
/* Nuoc kep: buoc chinh | (f2<<18) | (t2<<25): sau khi chiem tien don duoc them 1 buoc thuong (khong an, khong vao hang). */
function makeM(cells,m){
  var f=m&127,t=(m>>7)&127,k=(m>>14)&15,bf=(m>>18)&127,bt=(m>>25)&127,cap=make(cells,f,t,k),a;
  if(bf!==bt){ a=cells[bf]>0?0:1; if(OUTCD>0) cells[SL+8+a]=OUTCD; make(cells,bf,bt,0,true); }
  return cap;
}
function unmakeM(cells,m,cap){
  var f=m&127,t=(m>>7)&127,k=(m>>14)&15,bf=(m>>18)&127,bt=(m>>25)&127;
  if(bf!==bt) unmake(cells,bf,bt,0,0);
  unmake(cells,f,t,k,cap);
}
function commitM(cells,m){ var s0=sp, cap=makeM(cells,m); sp=s0; return cap; }
/* Tien don: kiem tra truoc khi di (cells chua di) xem nuoc (f,t,k) co duoc thuong khong. */
function bonusEligible(cells,s,f,t,k){
  var a=s>0?0:1, dst=(k===9)?((f+t)>>1):((k===6||k===7)?-1:t);
  return BONUS&&!CLASSIC&&TERR&&cells[SL+8+a]===0&&dst>=0&&OUTPOST[dst]===1&&OUTPOST[f]!==1;
}
/* Cac buoc thuong hien co cua ben s (sau khi da di nuoc chinh): f | t<<7, chi buoc thuong vao o trong, khong vao hang. */
function bonusSteps(cells,s){
  var out=[], i, q, x, tmp;
  for(i=0;i<N;i++){
    if(cells[i]*s<=0) continue;
    tmp=[]; movesFrom(cells,i,tmp);
    for(q=0;q<tmp.length;q++){
      x=tmp[q];
      if(((x>>14)&15)!==0) continue;
      if(cells[(x>>7)&127]!==0||DEN[(x>>7)&127]) continue;
      out.push(x);
    }
  }
  return out;
}
/* Di that buoc thuong: khong tru hoi chieu cua cac quan, bat dau hoi chieu tien don. */
function commitBonus(cells,f,t){
  var a=cells[f]>0?0:1;
  if(OUTCD>0) cells[SL+8+a]=OUTCD;
  cells[t]=cells[f]; cells[f]=0;
}
/* Dung cho giao dien: di that, khong can unmake. */
function commit(cells,f,t,k){ var s0=sp, cap=make(cells,f,t,k); sp=s0; return cap; }

/* ---------- Hash ---------- */
var Z1=new Int32Array(N*19), Z2=new Int32Array(N*19), ZS1=new Int32Array(ST*4), ZS2=new Int32Array(ST*4), ZSIDE=0;
(function(){
  var x=2463534242;
  function rnd(){ x^=x<<13; x^=x>>>17; x^=x<<5; return x|0; }
  var i; for(i=0;i<Z1.length;i++){Z1[i]=rnd();Z2[i]=rnd();}
  for(i=0;i<ST*4;i++){ZS1[i]=rnd();ZS2[i]=rnd();}
  ZSIDE=rnd();
})();
var H1=0, H2=0, NTP=0, NTF=0;
function probe(cells,side){
  var h1=side>0?0:ZSIDE, h2=0, i, c, j, v, ntp=0, ntf=0;
  for(i=0;i<N;i++){
    c=cells[i]; if(!c) continue;
    h1^=Z1[i*19+c+9]; h2^=Z2[i*19+c+9];
    if(!(c===9||c===-9)||HK[c+9]!=='tur'){ if(c>0) ntp++; else ntf++; }
  }
  for(j=0;j<ST;j++){ v=cells[SL+j]&3; if(v){ h1^=ZS1[j*4+v]; h2^=ZS2[j*4+v]; } }
  H1=h1; H2=h2; NTP=ntp; NTF=ntf;
}

/* Khoang cach (so nuoc) toi hang theo tung kieu di chuyen. Chi so [w]: w=0 toi hang doi phuong cua ben duoi, w=1 toi hang cua ben duoi.
   DD: dat lien. DD8: co di cheo (Bao). DDJ: co nhay ho (Ho, Dai bang, Su tu co dien). DDW: boi duoc (Chuot, Ca sau). */
var DD=[null,null], DD8=[null,null], DDJ=[null,null], DDW=[null,null], DDE=[null,null];
(function(){
  function bfs(den,mode){
    var dist=new Int8Array(N).fill(99), q=[den], h=0, n, d, t, r, c, dr, dc, nr, nc, p;
    dist[den]=0;
    while(h<q.length){
      n=q[h++];
      for(d=0;d<4;d++){
        t=ADJ[n*4+d]; if(t<0) continue;
        if(WATER[t]){
          if(mode==='W'){ if(dist[t]===99){dist[t]=dist[n]+1;q.push(t);} }
          else if(mode==='J'&&!WATER[n]){
            p=t; while(p>=0&&WATER[p]) p=ADJ[p*4+d];
            if(p>=0&&dist[p]===99){dist[p]=dist[n]+1;q.push(p);}
          }
          continue;
        }
        if(mode==='E'&&BRIDGE[t]) continue;
        if(dist[t]===99){dist[t]=dist[n]+1;q.push(t);}
      }
      if(mode==='8'&&!DEN[n]){
        r=(n/COLS)|0; c=n%COLS;
        for(dr=-1;dr<=1;dr+=2)for(dc=-1;dc<=1;dc+=2){
          nr=r+dr; nc=c+dc; if(nr<0||nr>=ROWS||nc<0||nc>=COLS) continue;
          t=nr*COLS+nc; if(WATER[t]||ROCK[t]||DEN[t]||dist[t]!==99) continue;
          dist[t]=dist[n]+1; q.push(t);
        }
      }
    }
    return dist;
  }
  [DENFOE,DENME].forEach(function(den,w){
    DD[w]=bfs(den,'4'); DD8[w]=bfs(den,'8'); DDJ[w]=bfs(den,'J'); DDW[w]=bfs(den,'W'); DDE[w]=bfs(den,'E');
  });
})();
function pieceDist(k,w,i){
  var d;
  if(k==='leo'&&!CLASSIC) return DD8[w][i];
  if(k==='tig'||k==='eagle'||(CLASSIC&&k==='lio')) return DDJ[w][i];
  if(k==='rat'||k==='croc') return DDW[w][i];
  if(k==='ele'&&!CLASSIC&&TERR) return DDE[w][i];
  d=DD[w][i];
  if(!CLASSIC&&(k==='fox'||k==='bison')&&d>1&&d<99) d=Math.ceil(d*.75);
  return d;
}
function contested(cells,i,p){
  /* quan o i (ben p) co bi quan dich chan duoc khong: co quan dich du bac trong 2 o */
  var s=p?-1:1, ci=Math.abs(cells[i]), er=effRank(cells,i), j, c, cr, yr, d;
  if(isTur(cells[i])) return false;
  for(j=0;j<N;j++){
    c=cells[j]; if(c*s<=0) continue;
    cr=c*s; if(cr===9) continue;
    d=Math.abs(((j/COLS)|0)-((i/COLS)|0))+Math.abs(j%COLS-i%COLS);
    if(d>2) continue;
    yr=effRank(cells,j); if(yr<=0) continue;
    if(cr===1&&ci===8) return true;
    if(cr===8&&ci===1) continue;
    if(yr>=er) return true;
  }
  return false;
}
/* ---------- AI v2: tinh hieu qua thuc su cua cac moi de doa va duong vong ---------- */
var AI2=0; /* bit 1: de doa hop le, bit 2: duong vong, bit 4: giu cau/tien don; 0 = AI cu */
/* Quan o i (ben p) co bi quan dich bat HOP LE khong (tinh ca ky nang: vo, phuc kich, ban, lao, va dia hinh). */
function threatened(cells,i,p){
  var s=p?-1:1, ir=(i/COLS)|0, ic=i%COLS, j, c, tmp, q, m, d;
  for(j=0;j<N;j++){
    c=cells[j]; if(c*s<=0) continue;
    d=Math.abs(((j/COLS)|0)-ir)+Math.abs(j%COLS-ic); if(d>3) continue;
    tmp=[]; movesFrom(cells,j,tmp);
    for(q=0;q<tmp.length;q++){ m=tmp[q]; if(((m>>7)&127)===i&&((m>>14)&15)!==5) return true; }
  }
  return false;
}
/* Chi phi duong vong: neu moi o tien gan hang hon deu bi chan (quan ta hoac quan dich khong an duoc) thi phai di vong. */
function detourCost(cells,i,k,p,dd){
  var w=p?0:1, s=p?1:-1, d, n, dn, c, free=false, blockedEnemy=false;
  if(k==='tig'||k==='eagle'||k==='leo'||k==='rat'||k==='croc'||k==='fox'||k==='bison'||k==='mon') return 0;
  for(d=0;d<4;d++){
    n=ADJ[i*4+d]; if(n<0) continue;
    dn=pieceDist(k,w,n); if(dn>=dd) continue;
    c=cells[n];
    if(c===0){ free=true; break; }
    if(c*s<0){ if(canCap(cells,i,n,0)){ free=true; break; } blockedEnemy=true; }
  }
  if(free) return 0;
  return blockedEnemy?2:1;
}
/* ---------- Evaluation (diem cho ben duoi, +) ---------- */
var VALK={rat:300,cat:230,fox:245,wolf:340,boar:350,dog:410,bear:425,leo:470,croc:440,tig:640,eagle:620,lio:660,bison:650,ele:760,mon:150,tur:230};
function evaluate(cells){
  var sc=0,i,c,p,r,k,v,er,dist,ratP=0,ratF=0,eP=0,eF=0,trapped,ownDen,td,dd,bonus;
  for(i=0;i<N;i++){
    c=cells[i]; if(!c) continue;
    p=c>0; r=p?c:-c; k=HK[c+9]||'';
    if(CLASSIC&&r<=8) v=[0,300,230,340,410,470,640,660,760][r]; else v=VALK[k]||300;
    er=effRank(cells,i);
    if(r!==9) v+=er*22;
    if(r===1){ if(p)ratP=1; else ratF=1; }
    if(r===8){ if(p)eP=1; else eF=1; }
    ownDen=p?DENME:DENFOE;
    trapped=TRAP[i]===(p?-1:1);
    if(k!=='tur'){
      dd=pieceDist(k,p?0:1,i);
      if((AI2&2)&&dd>1&&dd<=7) dd+=detourCost(cells,i,k,p,dd);
      if(dd>12) dd=12;
      v+=(12-dd)*6;
      if(dd<=4){
        bonus=(5-dd)*(5-dd)*16;
        if(trapped) bonus*=.45;
        if(dd<=3&&((AI2&1)?threatened(cells,i,p):contested(cells,i,p))) bonus*=.4;
        v+=bonus;
      }
      if(trapped&&r!==9) v-=(r===8?70:v*.6);
      td=Math.abs(((i/COLS)|0)-((ownDen/COLS)|0))+Math.abs(i%COLS-ownDen%COLS);
      if(td<=2&&er>=3) v+=26;
    }else{
      v+=(TRAP[i]===(p?1:-1)?18:0);
    }
    sc+=p?v:-v;
  }
  if(eP&&ratF) sc-=170;
  if(eF&&ratP) sc+=170;
  if((AI2&4)&&!CLASSIC&&TERR){
    var d2,n2,c2,gB=[0,0],gO=[0,0],ri,hold,owner,rankNow;
    for(i=0;i<N;i++){
      if(!BRIDGE[i]&&!OUTPOST[i]) continue;
      gB[0]=gB[1]=0; gO[0]=gO[1]=0;
      for(d2=0;d2<4;d2++){
        n2=ADJ[i*4+d2]; if(n2<0) continue; c2=cells[n2];
        if(!c2||isTur(c2)||c2===9||c2===-9) continue;
        p=c2>0; ri=(n2/COLS)|0;
        if(BRIDGE[i]&&(p?ri>4:ri<4)&&effRank(cells,n2)>=4) gB[p?0:1]=1;
        if(OUTPOST[i]&&cells[i]===0&&cells[SL+(p?8:9)]===0&&effRank(cells,n2)>=2) gO[p?0:1]=1;
      }
      if(BRIDGE[i]) sc+=10*(gB[0]-gB[1]);
      if(OUTPOST[i]){
        if(cells[i]!==0&&!isTur(cells[i])){
          owner=cells[i]>0?0:1;
          rankNow=effRank(cells,i);
          hold=28+(rankNow>=5?8:0);
          if(threatened(cells,i,cells[i]>0)) hold-=20;
          sc+=(owner===0?hold:-hold);
        }else if(cells[i]===0){
          /* Approaching a free outpost has value, but less than occupying it. */
          sc+=8*(gO[0]-gO[1]);
        }
      }
    }
  }
  return sc;
}

/* ---------- Search ---------- */
var WIN=100000, nodes=0, deadline=0, aborted=false, useQ=true, useTT=true;
var TTN=1<<18, TTM=TTN-1, ttKey=new Int32Array(TTN), ttDepth=new Int8Array(TTN).fill(-1), ttFlag=new Int8Array(TTN), ttScore=new Int32Array(TTN), ttMove=new Int32Array(TTN);
var killers=new Int32Array(80*2), hist=new Int32Array(128*128);
function victimVal(cells,m){
  var t=(m>>7)&127, k=(m>>14)&15, v=cells[t], vv;
  if(k===9) return 90;
  if(k===5) return 5;
  if(!v) return 0;
  vv=VALK[HK[v+9]]||300;
  return vv;
}
function moveScore(cells,m,ply,ttm){
  var t,k,f,v,sc;
  if(m===ttm) return 1e7;
  t=(m>>7)&127; k=(m>>14)&15; f=m&127;
  if(DEN[t]&&k===0) return 9e6;
  v=victimVal(cells,m);
  if(v>0&&k!==5&&k!==9) sc=2e6+v*10-(VALK[HK[cells[f]+9]]||300)/10;
  else if(k===9) sc=1.9e6;
  else if(killers[ply*2]===m) sc=1e6;
  else if(killers[ply*2+1]===m) sc=9e5;
  else sc=hist[f*128+t];
  return sc;
}
function orderMoves(cells,moves,ply,ttm){
  var sc=new Array(moves.length), i, j, x, y;
  for(i=0;i<moves.length;i++) sc[i]=moveScore(cells,moves[i],ply,ttm);
  for(i=1;i<moves.length;i++){
    x=moves[i]; y=sc[i]; j=i-1;
    while(j>=0&&sc[j]<y){ moves[j+1]=moves[j]; sc[j+1]=sc[j]; j--; }
    moves[j+1]=x; sc[j+1]=y;
  }
}
function denWin(moves,side){
  for(var k=0;k<moves.length;k++){ if(((moves[k]>>14)&15)===0&&DEN[(moves[k]>>7)&127]===-side) return true; }
  return false;
}
function qsearch(cells,side,alpha,beta,ply,qd){
  if((++nodes&255)===0&&Date.now()>deadline) aborted=true;
  if(aborted) return 0;
  var moves=genMoves(cells,side), k, m, f, t, kd, cap, v, stand, mv, threat, best;
  if(!moves.length) return 0;
  if(denWin(moves,side)) return WIN-ply;
  stand=side*evaluate(cells);
  if(qd<=-4) return stand-500;
  threat=false;
  if(qd<=0){
    /* hang chua bi de doa thi dung ngay */
    if(!denWin(genMoves(cells,-side),-side)) return stand;
    threat=true;
  }else{
    threat=denWin(genMoves(cells,-side),-side);
  }
  if(threat){
    best=-Infinity; mv=moves;
  }else{
    if(stand>=beta) return stand;
    if(stand>alpha) alpha=stand;
    best=stand;
    mv=[];
    for(k=0;k<moves.length;k++){
      m=moves[k]; t=(m>>7)&127; kd=(m>>14)&15;
      if(kd===9||kd===6||kd===7||(kd!==5&&cells[t]!==0)) mv.push(m);
    }
  }
  orderMoves(cells,mv,ply,0);
  for(k=0;k<mv.length;k++){
    m=mv[k]; f=m&127; t=(m>>7)&127; kd=(m>>14)&15;
    cap=makeM(cells,m);
    probe(cells,-side);
    if(side>0?NTF===0:NTP===0){ unmakeM(cells,m,cap); return WIN-ply; }
    v=-qsearch(cells,-side,-beta,-alpha,ply+1,qd-1);
    unmakeM(cells,m,cap);
    if(aborted) return 0;
    if(v>best) best=v;
    if(v>=beta) return v;
    if(v>alpha) alpha=v;
  }
  return best;
}
function negamax(cells,side,depth,alpha,beta,ply){
  if((++nodes&255)===0&&Date.now()>deadline) aborted=true;
  if(aborted) return 0;
  var moves=genMoves(cells,side), k, m, f, t, kd, cap, v, best=-Infinity, a0=alpha, idx, ttm=0, h1, h2, bm=0, flag;
  if(!moves.length) return 0;
  if(denWin(moves,side)) return WIN-ply;
  if(depth<=0) return useQ?qsearch(cells,side,alpha,beta,ply,4):side*evaluate(cells);
  probe(cells,side); h1=H1; h2=H2;
  idx=h1&TTM;
  if(useTT&&ttDepth[idx]>=0&&ttKey[idx]===h2){
    ttm=ttMove[idx];
    if(ttDepth[idx]>=depth&&ply>0){
      v=ttScore[idx];
      if(ttFlag[idx]===0) return v;
      if(ttFlag[idx]===1&&v>alpha) alpha=v;
      else if(ttFlag[idx]===2&&v<beta) beta=v;
      if(alpha>=beta) return v;
    }
  }
  orderMoves(cells,moves,ply,ttm);
  for(k=0;k<moves.length;k++){
    m=moves[k]; f=m&127; t=(m>>7)&127; kd=(m>>14)&15;
    cap=makeM(cells,m);
    probe(cells,-side);
    if(side>0?NTF===0:NTP===0) v=WIN-ply;
    else v=-negamax(cells,-side,depth-1,-beta,-alpha,ply+1);
    unmakeM(cells,m,cap);
    if(aborted) return 0;
    if(v>best){ best=v; bm=m; }
    if(v>alpha) alpha=v;
    if(alpha>=beta){
      if(cap===0&&kd!==6&&kd!==7){
        if(killers[ply*2]!==m){ killers[ply*2+1]=killers[ply*2]; killers[ply*2]=m; }
        hist[f*128+t]+=depth*depth;
      }
      break;
    }
  }
  if(useTT&&best>-WIN+200&&best<WIN-200){
    flag=best<=a0?2:(best>=beta?1:0);
    ttKey[idx]=h2; ttDepth[idx]=depth; ttFlag[idx]=flag; ttScore[idx]=best; ttMove[idx]=bm;
  }
  return best;
}
function shuffle(a){
  for(var i=a.length-1;i>0;i--){var j=(Math.random()*(i+1))|0,x=a[i];a[i]=a[j];a[j]=x;}
  return a;
}
/* Cap do may: 1 Tap su, 2 De, 3 Vua, 4 Kho, 5 Cao thu */
var LEVELS={
  1:{depth:1,ms:80,noise:0,rnd:.6,q:false,greedy:true},
  2:{depth:3,ms:400,noise:70,rnd:.08,q:true,full:true},
  3:{depth:6,ms:1000,noise:12,rnd:0,q:true},
  4:{depth:10,ms:2400,noise:2,rnd:0,q:true},
  5:{depth:20,ms:5000,noise:0,rnd:0,q:true}
};
function toMove(m,score,d){ return {m:m,bf:(m>>18)&127,bt:(m>>25)&127,f:m&127,t:(m>>7)&127,k:(m>>14)&15,score:score,depth:d,nodes:nodes}; }
/* recent: mang hash h1 cua cac the co da xuat hien (de may tranh lap lai). */
function search(cells0,side,level,recent,ban){
  var L=LEVELS[level]||LEVELS[3], cells=Int8Array.from(cells0), moves=genMoves(cells,side), k, m, f, t, kd, cap, v, d, best, bestScore, alpha, complete, scores, rep, i, rn, noiseMargin;
  sp=0; nodes=0; aborted=false; useQ=L.q; deadline=Date.now()+L.ms;
  /* Keep root alpha-beta bounds wider than the full score jitter range. */
  noiseMargin=L.noise?2*L.noise:2;
  if(ban&&ban.length) moves=moves.filter(function(x){return ban.indexOf(x)<0;});
  if(!moves.length) return null;
  for(k=0;k<moves.length;k++){ m=moves[k]; if(((m>>14)&15)===0&&DEN[(m>>7)&127]===-side) return toMove(m,WIN,0); }
  if(level>=4){ hist.fill(0); killers.fill(0); }
  shuffle(moves);
  if(L.rnd&&Math.random()<L.rnd){ m=moves[0]; return toMove(m,0,0); }
  /* penalty for repeating positions */
  rep={};
  if(recent&&recent.length&&level>=2){
    for(k=0;k<moves.length;k++){
      m=moves[k]; f=m&127; t=(m>>7)&127; kd=(m>>14)&15;
      cap=makeM(cells,m); probe(cells,-side); unmakeM(cells,m,cap);
      rn=0; for(i=0;i<recent.length;i++) if(recent[i]===H1) rn++;
      rep[m]=rn*(level>=4?60:25);
    }
  }
  orderMoves(cells,moves,0,0);
  if(L.greedy){
    /* Tap su: thich an quan, con lai di ngau nhien. */
    best=moves[0]; bestScore=-1;
    for(k=0;k<moves.length;k++){ v=victimVal(cells,moves[k])+Math.random()*250; if(v>bestScore){bestScore=v;best=moves[k];} }
    return toMove(best,0,1);
  }
  best=moves[0]; bestScore=-Infinity;
  /* khoi tao diem goc de co nuoc di du phong neu het gio o do sau 1 */
  for(d=1;d<=L.depth;d++){
    var curBest=null, curScore=-Infinity; alpha=-Infinity; complete=true;
    for(k=0;k<moves.length;k++){
      m=moves[k]; f=m&127; t=(m>>7)&127; kd=(m>>14)&15;
      cap=makeM(cells,m);
      probe(cells,-side);
      if(side>0?NTF===0:NTP===0) v=WIN;
      else v=-negamax(cells,-side,d-1,-Infinity,L.full?Infinity:-(alpha-noiseMargin),1);
      unmakeM(cells,m,cap);
      if(aborted){complete=false;break;}
      /* A fail-low bound cannot win after score jitter; don't rank it as exact. */
      if(!L.full&&alpha>-Infinity&&v<=alpha-noiseMargin) continue;
      v-=rep[m]||0;
      v+=L.noise?(Math.random()-.5)*2*L.noise:Math.random()*2;
      if(v>curScore){curScore=v;curBest=m;}
      if(!L.full&&v>alpha) alpha=v;
    }
    if(!complete) break;
    best=curBest; bestScore=curScore;
    /* dua nuoc tot nhat len dau cho vong sau */
    (function(b){ moves.sort(function(x,y){return x===b?-1:y===b?1:0;}); })(best);
    if(curScore>WIN-100||curScore<-WIN+100) break;
    if(Date.now()>deadline) break;
  }
  return toMove(best,bestScore,d);
}
function hashOf(cells,side){ probe(cells,side); return H1; }
function counts(cells){ probe(cells,1); return [NTP,NTF]; }
return {
  COLS:COLS,ROWS:ROWS,N:N,SL:SL,ST:ST,DENME:DENME,DENFOE:DENFOE,MAPROWS:MAPROWS,STARTS:STARTS,EXTRA:EXTRA,ROCK:ROCK,BUSH:BUSH,BRIDGE:BRIDGE,WATER:WATER,TRAP:TRAP,DEN:DEN,ADJ:ADJ,SQ:SQ,HK:HK,LEVELS:LEVELS,
  isClassic:function(){return CLASSIC;},setClassic:setClassic,setKeys:setKeys,initialCells:initialCells,genMoves:genMoves,movesFrom:movesFrom,
  make:make,unmake:unmake,commit:commit,makeM:makeM,unmakeM:unmakeM,commitM:commitM,bonusEligible:bonusEligible,bonusSteps:bonusSteps,commitBonus:commitBonus,outCd:function(c,s){return c[SL+(s>0?8:9)];},setOutCd:function(v){OUTCD=v|0;},setBonus:function(v){BONUS=!!v;},setAI:function(v){AI2=(v===true)?7:(v===false)?0:(v|0);},MARSH:MARSH,OUTPOST:OUTPOST,effRank:effRank,hashOf:hashOf,counts:counts,search:search,evaluate:evaluate,
  hasMate:hasMate,inW:inW,nearWater:nearWater,advanced:advanced,guarding:guarding,isTur:isTur,
  probe:probe,getH:function(){return H1;},
  negamax:function(c,s,d,a,b){nodes=0;aborted=false;deadline=Date.now()+1e9;return negamax(c,s,d,a,b,0);},
  setTerr:function(v){TERR=!!v;},setQ:function(v){useQ=v;},setTT:function(v){useTT=v;},clearTT:function(){ttDepth.fill(-1);}
};
}
