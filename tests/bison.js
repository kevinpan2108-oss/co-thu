/* Kiem thu Bo rung: lao (kind 8, hoi chieu 1 luot) va huc (kind 9, day lui 1 o, hoi chieu 2 luot), hai bo dem doc lap.
   Moi kich ban chay cho CA HAI PHE (guong doc). Ban do: xem MAPROWS. Phe + = duoi (hang o (8,4)), phe - = tren.
   Bay phe + : (7,4) (8,3) (8,5). Bo rung huc quan dich VE PHIA bay cua phe minh khi huc ve phia hang minh. */
const fs=require('fs'),path=require('path');
const E=new Function(fs.readFileSync(process.env.ENGINE||path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
const {N,ST,COLS,ROWS,SL}=E; const Z=[0,0,0,0,0,0,0,0,0,0];
let pass=0,fails=0; const ok=(n,c)=>{if(c)pass++;else{fails++;console.log('FAIL',n);}};
const sq=o=>{const a=Z.slice();Object.keys(o).forEach(k=>a[k]=o[k]);return a;};
const BIS={7:1}, BISTUR={7:1,9:2};
function scn(name,variants,pieces,fn,opts){
  [0,1].forEach(mir=>{
    E.setClassic(!!(opts&&opts.classic)); const a=sq(variants); E.SQ[0]=a.slice(); E.SQ[1]=a.slice(); E.setKeys();
    const sg=mir?-1:1, R=r=>mir?ROWS-1-r:r, I=(r,c)=>R(r)*COLS+c, A=mir?1:0;
    const cells=new Int8Array(N+ST); pieces.forEach(p=>{cells[I(p[0],p[1])]=p[2]*sg;});
    const mv=(side)=>E.genMoves(cells,side);
    const has=(side,kind,fr,fc,tr,tc)=>mv(side).some(m=>(m&127)===I(fr,fc)&&((m>>7)&127)===I(tr,tc)&&((m>>14)&15)===kind&&((m>>18)&127)===((m>>25)&127));
    const anyK=(side,kind)=>mv(side).some(m=>((m>>14)&15)===kind);
    const slot=(j)=>cells[SL+j+A];  // j: 4 lao, 10 huc (cua phe + o chi so 0, phe - o chi so 1)
    const code=(r,c)=>cells[I(r,c)];
    fn({cells,I,sg,A,has,anyK,mv,slot,code,eff:(r,c)=>E.effRank(cells,I(r,c)),ck:(n,c)=>ok(name+' | '+n+(mir?' [phe tren]':' [phe duoi]'),c)});
    E.setClassic(false);
  });
}
const mk=(c,sg,fr,fc,tr,tc,k)=>E.commit(c.cells,c.I(fr,fc),c.I(tr,tc),k);
const count=(cells,s)=>{let n=0;for(let i=0;i<N;i++)if(cells[i]*s>0)n++;return n;};

/* ===== 1. Huc thanh cong voi Voi va cac quan khac ===== */
[[8,'Voi'],[3,'Soi'],[2,'Meo'],[5,'Bao'],[6,'Ho'],[7,'Su tu'],[4,'Cho'],[1,'Chuot']].forEach(([vc,nm])=>{
  scn('huc '+nm,BIS,[[4,4,7],[6,4,-vc]],c=>{
    c.ck('co nuoc huc (kind 9) vao '+nm+' dich cach 2 o',c.has(c.sg,9,4,4,6,4));
    const before=count(c.cells,-c.sg);
    mk(c,c.sg,4,4,6,4,9);
    c.ck('Bo rung tien vao o giua',c.code(5,4)===7*c.sg&&c.code(4,4)===0);
    c.ck(nm+' bi day lui 1 o cung huong (khong bi an)',c.code(7,4)===-vc*c.sg&&c.code(6,4)===0&&count(c.cells,-c.sg)===before);
    c.ck('huc khoi dong hoi chieu huc = 2, khong dung bo dem lao',c.slot(10)===2&&c.slot(4)===0);
  });
});
scn('huc ngang',BIS,[[7,2,7],[7,4,-3]],c=>{
  c.ck('huc ngang (7,2)->(7,4) day ve (7,5)',(()=>{ if(!c.has(c.sg,9,7,2,7,4)) return false; mk(c,c.sg,7,2,7,4,9); return c.code(7,3)===7*c.sg&&c.code(7,5)===-3*c.sg; })());
});
scn('lao va huc cung muc tieu',BIS,[[5,3,7],[7,3,-3]],c=>{
  c.ck('Soi cach 2 o: vua co lao an (kind 8) vua co huc (kind 9)',c.has(c.sg,8,5,3,7,3)&&c.has(c.sg,9,5,3,7,3));
});

/* ===== 2. Khong huc duoc ===== */
scn('khong huc Rua',BISTUR,[[4,4,7],[6,4,-9]],c=>{
  c.ck('Rua mien nhiem huc',!c.has(c.sg,9,4,4,6,4)&&!c.anyK(c.sg,9));});
scn('khong huc dong doi',BIS,[[4,4,7],[6,4,3]],c=>{
  c.ck('khong huc quan phe minh',!c.anyK(c.sg,9));});
scn('khong dung khoang cach',BIS,[[4,4,7],[5,4,-3]],c=>{
  c.ck('quan dich ke ben (cach 1 o) khong huc duoc',!c.anyK(c.sg,9));});
scn('khong dung khoang cach',BIS,[[3,4,7],[6,4,-3]],c=>{
  c.ck('quan dich cach 3 o khong huc duoc',!c.anyK(c.sg,9));});
scn('khong huc cheo/lech hang',BIS,[[4,4,7],[6,5,-3]],c=>{
  c.ck('muc tieu lech hang khong huc duoc',!c.anyK(c.sg,9));});
scn('muc tieu o nuoc',BIS,[[6,0,7],[4,0,-3]],c=>{
  c.ck('quan dich o mat nuoc khong bi huc',!c.anyK(c.sg,9));});
scn('muc tieu chuot o nuoc',BIS,[[6,0,7],[4,0,-1]],c=>{
  c.ck('Chuot o mat nuoc khong bi huc',!c.anyK(c.sg,9));});
scn('muc tieu chuot o dam lay',BIS,[[5,4,7],[5,6,-1]],c=>{
  c.ck('Chuot o dam lay (o nuoc) khong bi huc',!c.anyK(c.sg,9));});
scn('muc tieu o hang',BIS,[[2,4,7],[0,4,-3]],c=>{
  c.ck('quan trong hang khong bi huc',!c.has(c.sg,9,2,4,0,4));});

/* ===== 3. O giua / o sau bi chan ===== */
scn('o giua bi chan',BIS,[[4,4,7],[5,4,-1],[6,4,-3]],c=>{
  c.ck('o giua co quan: khong huc',!c.has(c.sg,9,4,4,6,4));});
scn('o giua bi chan boi quan minh',BIS,[[4,4,7],[5,4,2],[6,4,-3]],c=>{
  c.ck('o giua co quan minh: khong huc',!c.has(c.sg,9,4,4,6,4));});
scn('o giua la bui',BIS,[[0,2,7],[2,2,-3]],c=>{
  c.ck('o giua la bui (1,2): khong huc xuyen bui',!c.has(c.sg,9,0,2,2,2));});
scn('o giua la dam lay',BIS,[[5,5,7],[5,7,-3]],c=>{
  c.ck('o giua la dam lay (5,6): khong huc xuyen dam lay',!c.has(c.sg,9,5,5,5,7));});
scn('o giua la nuoc',BIS,[[3,3,7],[5,3,-3]],c=>{
  c.ck('o giua la mat nuoc (4,3): khong huc',!c.anyK(c.sg,9));});
scn('o sau ngoai ban',BIS,[[6,0,7],[8,0,-3]],c=>{
  c.ck('o sau nam ngoai ban: khong huc',!c.has(c.sg,9,6,0,8,0));});
scn('o sau co quan',BIS,[[4,4,7],[6,4,-3],[7,4,-2]],c=>{
  c.ck('o sau co quan (dich): khong huc',!c.has(c.sg,9,4,4,6,4));});
scn('o sau co quan minh',BIS,[[4,4,7],[6,4,-3],[7,4,2]],c=>{
  c.ck('o sau co quan (minh): khong huc',!c.has(c.sg,9,4,4,6,4));});
scn('o sau la hang',BIS,[[5,4,7],[7,4,-3]],c=>{
  c.ck('o sau la hang (8,4): khong day vao hang',!c.has(c.sg,9,5,4,7,4));});
scn('o sau la nuoc',BIS,[[1,0,7],[3,0,-3]],c=>{
  c.ck('o sau la ho (4,0): khong day xuong ho',!c.has(c.sg,9,1,0,3,0));});
scn('Voi khong len cau go',BIS,[[1,8,7],[3,8,-8]],c=>{
  c.ck('o sau la cau go hep (4,8): khong day Voi len cau',!c.has(c.sg,9,1,8,3,8));});
scn('Soi len cau go',BIS,[[1,8,7],[3,8,-3]],c=>{
  c.ck('Soi thi bi day len cau go duoc',c.has(c.sg,9,1,8,3,8));});
scn('Chuot vao dam lay',BIS,[[0,6,7],[2,6,-1]],c=>{
  c.ck('Chuot khong bi day vao dam lay (3,6)',!c.has(c.sg,9,0,6,2,6));});
scn('Ca sau vao dam lay',{5:1,7:1},[[0,6,7],[2,6,-5]],c=>{
  c.ck('Ca sau khong bi day vao dam lay (3,6)',!c.has(c.sg,9,0,6,2,6));});
scn('Soi vao dam lay',BIS,[[0,6,7],[2,6,-3]],c=>{
  c.ck('Soi bi day vao dam lay duoc',c.has(c.sg,9,0,6,2,6));});

/* ===== 4. Bay ===== */
scn('huc vao bay',BIS,[[4,4,7],[6,4,-8]],c=>{
  c.ck('Voi o (6,4) dang bac 8 truoc khi bi huc',c.eff(6,4)===8);
  mk(c,c.sg,4,4,6,4,9);
  c.ck('Voi bi day vao bay (7,4): giu bac 4 (ngoai le cua Voi)',c.eff(7,4)===4);
});
scn('huc vao bay',BIS,[[4,4,7],[6,4,-3]],c=>{
  mk(c,c.sg,4,4,6,4,9);
  c.ck('Soi bi day vao bay (7,4): mat het suc (bac 0)',c.eff(7,4)===0);
});
scn('huc vao bay',BIS,[[4,4,7],[6,4,-6]],c=>{
  mk(c,c.sg,4,4,6,4,9);
  c.ck('Ho bi day vao bay (7,4): bac 0',c.eff(7,4)===0);
});
scn('huc vao bay (8,3)',BIS,[[5,3,7],[7,3,-7]],c=>{
  c.ck('co nuoc huc vao bay canh hang',c.has(c.sg,9,5,3,7,3));
  mk(c,c.sg,5,3,7,3,9);
  c.ck('Su tu bi day vao bay (8,3): bac 0',c.code(8,3)===-7*c.sg&&c.eff(8,3)===0);
});
scn('huc vao bay phe dich cua chinh quan bi day',BIS,[[3,3,7],[1,3,-3]],c=>{
  c.ck('day ve phia hang dich: co nuoc huc',c.has(c.sg,9,3,3,1,3));
  mk(c,c.sg,3,3,1,3,9);
  c.ck('Soi bi day vao bay cua CHINH NO (0,3): khong mat bac (bay chi hai quan dich)',c.code(0,3)===-3*c.sg&&c.eff(0,3)===3);
});

/* ===== 5. Hoi chieu: lao 1 luot, huc 2 luot ===== */
function pushScene(cb){
  scn('hoi chieu huc',BIS,[[4,4,7],[6,4,-3],[7,0,1],[1,0,-1]],c=>cb(c));
}
pushScene(c=>{
  const f=c.I(4,4), moves=()=>E.movesFrom(c.cells,c.I(5,4),[]);
  mk(c,c.sg,4,4,6,4,9);
  // dat them muc tieu cach 2 o quanh Bo rung (5,4): doc (7,4) la quan bi day; them quan dich o (5,2)
  c.cells[c.I(3,4)]=-3*c.sg; c.cells[c.I(7,4)]=0;
  const pushNow=()=>E.movesFrom(c.cells,c.I(5,4),[]).some(m=>((m>>14)&15)===9);
  const laoNow=()=>E.movesFrom(c.cells,c.I(5,4),[]).some(m=>((m>>14)&15)===8);
  c.ck('ngay sau huc: huc bi khoa',!pushNow()&&c.slot(10)===2);
  c.ck('ngay sau huc: bo dem lao van 0 (doc lap)',c.slot(4)===0);
  // opponent di mot nuoc: khong giam bo dem cua phe minh
  mk(c,c.sg,1,0,1,1,0);
  c.ck('nuoc di cua doi phuong khong giam bo dem huc',c.slot(10)===2);
  // luot 1 cua phe minh: nuoc thuong (Chuot)
  mk(c,c.sg,7,0,7,1,0);
  c.ck('sau 1 luot cua phe minh: huc con 1, van khoa',c.slot(10)===1&&!pushNow());
  mk(c,c.sg,1,1,1,2,0);
  mk(c,c.sg,7,1,7,2,0);
  c.ck('sau 2 luot cua phe minh: huc ve 0, dung lai duoc',c.slot(10)===0&&pushNow());
});
scn('hoi chieu lao',BIS,[[4,4,7],[6,4,-3],[7,0,1],[1,0,-1]],c=>{
  c.cells[c.I(6,4)]=0;
  mk(c,c.sg,4,4,6,4,8);
  const b=c.I(6,4);
  c.ck('lao khoi dong hoi chieu lao = 1, khong dung bo dem huc',c.slot(4)===1&&c.slot(10)===0);
  c.cells[c.I(6,2)]=-3*c.sg; c.cells[c.I(6,6)]=-3*c.sg;
  const kinds=()=>E.movesFrom(c.cells,b,[]).map(m=>(m>>14)&15);
  c.ck('ngay sau lao: lao bi khoa, huc dung duoc',!kinds().includes(8)&&kinds().includes(9));
  mk(c,c.sg,7,0,7,1,0);
  c.ck('sau 1 luot cua phe minh: lao dung lai duoc',c.slot(4)===0&&kinds().includes(8));
});
scn('lao khoa nhung huc dung',BIS,[[4,4,7],[6,4,-3],[7,0,1]],c=>{
  c.cells[SL+4+c.A]=1;
  const kinds=E.movesFrom(c.cells,c.I(4,4),[]).map(m=>(m>>14)&15);
  c.ck('lao dang hoi chieu: huc van dung duoc',!kinds.includes(8)&&kinds.includes(9));
});
scn('huc khoa nhung lao dung',BIS,[[4,4,7],[6,4,-3]],c=>{
  c.cells[SL+10+c.A]=2; c.cells[c.I(6,4)]=0; c.cells[c.I(6,4)]=-3*c.sg;
  const k=E.movesFrom(c.cells,c.I(4,4),[]).map(m=>(m>>14)&15);
  c.ck('huc dang hoi chieu: lao an Soi van dung duoc, huc khong',k.includes(8)&&!k.includes(9));
});
scn('hai bo dem giam doc lap',BIS,[[4,4,7],[7,0,1],[1,0,-1]],c=>{
  c.cells[SL+4+c.A]=1; c.cells[SL+10+c.A]=2;
  mk(c,c.sg,7,0,7,1,0);
  c.ck('sau 1 luot: lao 1->0, huc 2->1',c.slot(4)===0&&c.slot(10)===1);
  mk(c,c.sg,7,1,7,2,0);
  c.ck('sau 2 luot: lao 0, huc 0',c.slot(4)===0&&c.slot(10)===0);
});
scn('bo dem giam ca khi dung ky nang khac (Khi/Soi)',BIS,[[4,4,7],[7,0,1]],c=>{
  c.cells[SL+10+c.A]=2;
  mk(c,c.sg,4,4,5,4,0);
  c.ck('Bo rung di buoc thuong van lam huc giam 2->1',c.slot(10)===1);
});
scn('hai phe doc lap',BIS,[[4,4,7],[4,5,-7],[7,0,1]],c=>{
  c.cells[SL+10+c.A]=2;
  c.ck('bo dem cua phe kia (SL+11-A) khong bi doi',c.cells[SL+10+(1-c.A)]===0);
});

/* ===== 6. Che do Co dien, Cho khoa ===== */
scn('Co dien khong co lao/huc',BIS,[[4,4,7],[6,4,-3]],c=>{
  c.ck('che do Co dien: khong co kind 8/9',!c.anyK(c.sg,8)&&!c.anyK(c.sg,9));},{classic:true});
scn('Cho khoa Bo rung',BIS,[[2,3,7],[2,5,-3]],c=>{
  c.ck('khong co Cho: huc va lao deu duoc',c.has(c.sg,9,2,3,2,5)&&c.has(c.sg,8,2,3,2,5));
  c.cells[c.I(1,3)]=-4*c.sg;
  c.ck('Cho dich (dang giu hang) ke ben: khoa ca lao lan huc',!c.anyK(c.sg,9)&&!c.anyK(c.sg,8));
});

/* ===== 7. Hoan tac (make/unmake), bat bien trang thai va hash ===== */
{
  let seed=20261029; const R=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const HKis=(cells,i)=>Math.abs(cells[i])===7&&E.HK[cells[i]+9]==='bison';
  let pushSeen=0, laoSeen=0, mism=0, hashMism=0, nodes=0, posCnt=0, withCd=0;
  const same=(a,b)=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;};
  const walk=(cells,side,d)=>{
    if(d===0) return;
    const moves=E.genMoves(cells,side);
    for(const m of moves){
      const k=(m>>14)&15; if(k===9) pushSeen++; if(k===8) laoSeen++;
      const snap=Int8Array.from(cells), h0=E.hashOf(cells,side);
      const cap=E.makeM(cells,m); nodes++;
      if(cells[SL+10]>0||cells[SL+11]>0) withCd++;
      walk(cells,-side,d-1);
      E.unmakeM(cells,m,cap);
      if(!same(snap,cells)) mism++;
      if(E.hashOf(cells,side)!==h0) hashMism++;
    }
  };
  for(let g=0;g<30;g++){
    E.setClassic(false); const s=Z.slice(); for(let r=2;r<=7;r++)s[r]=r===7?1:(R()*2|0); s[9]=R()*3|0; E.SQ[0]=s.slice(); E.SQ[1]=s.slice(); E.setKeys();
    const cells=E.initialCells(); let side=1;
    for(let i=0;i<24+((R()*20)|0);i++){ // phat ngau nhien de dua Bo rung vao giua ban
      const all=E.genMoves(cells,side); if(!all.length) break;
      const bis=all.filter(m=>HKis(cells,m&127)); const pick=(bis.length&&R()<.6)?bis[(R()*bis.length)|0]:all[(R()*all.length)|0];
      E.commitM(cells,pick); side=-side;
    }
    posCnt++; walk(cells,side,2);
  }
  ok('make/unmake khoi phuc chinh xac vi tri va moi bo dem ('+nodes+' nut, '+posCnt+' vi tri)',mism===0);
  ok('hash khong doi sau make/unmake',hashMism===0);
  ok('mo phong da gap nuoc huc ('+pushSeen+') va lao ('+laoSeen+') va bo dem hoi chieu >0 ('+withCd+')',pushSeen>0&&laoSeen>0&&withCd>0);
}
scn('hash phan biet bo dem huc',BIS,[[4,4,7],[6,4,-3]],c=>{
  const h0=E.hashOf(c.cells,c.sg); c.cells[SL+10+c.A]=2; const h1=E.hashOf(c.cells,c.sg); c.cells[SL+10+c.A]=1; const h2=E.hashOf(c.cells,c.sg);
  c.ck('hash khac nhau theo gia tri bo dem huc',h0!==h1&&h1!==h2&&h0!==h2);
});
scn('commit/undo hoan nguyen',BIS,[[4,4,7],[6,4,-8],[7,0,1]],c=>{
  const snap=Int8Array.from(c.cells), m=c.I(4,4)|(c.I(6,4)<<7)|(9<<14);
  const cap=E.makeM(c.cells,m); E.unmakeM(c.cells,m,cap);
  let same=true; for(let i=0;i<snap.length;i++) if(snap[i]!==c.cells[i]) same=false;
  c.ck('makeM/unmakeM nuoc huc Voi tra ve dung vi tri va bo dem',same);
});

/* ===== 8. AI xem xet ca lao va huc ===== */
scn('AI',BIS,[[4,4,7],[6,4,-8],[8,0,3],[0,0,-3]],c=>{
  const all=E.genMoves(c.cells,c.sg);
  const hucs=all.filter(m=>((m>>14)&15)===9), laos=all.filter(m=>((m>>14)&15)===8);
  c.ck('genMoves sinh ra ca nuoc huc va nuoc lao',hucs.length>0&&laos.length>0);
  const ban=all.filter(m=>((m>>14)&15)!==9);
  E.LEVELS[3].depth=3; E.LEVELS[3].ms=1e6; E.clearTT();
  const r=E.search(c.cells,c.sg,3,[],ban);
  c.ck('khi chi con nuoc huc, AI tim kiem va chon nuoc huc hop le',r&&((r.m>>14)&15)===9&&hucs.indexOf(r.m)>=0);
  const ban2=all.filter(m=>((m>>14)&15)!==8);
  E.clearTT(); const r2=E.search(c.cells,c.sg,3,[],ban2);
  c.ck('khi chi con nuoc lao, AI chon nuoc lao hop le',r2&&((r2.m>>14)&15)===8);
  const snap=Int8Array.from(c.cells); E.clearTT(); E.search(c.cells,c.sg,3,[],[]);
  let same=true; for(let i=0;i<snap.length;i++) if(snap[i]!==c.cells[i]) same=false;
  c.ck('tim kiem khong lam thay doi trang thai ban dau',same);
});
console.log('bison pass',pass,'fail',fails); process.exit(fails?1:0);
