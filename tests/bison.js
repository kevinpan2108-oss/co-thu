/* Kiem thu Bo rung: lao (kind 8, an quan, hoi chieu 1 luot) va huc (kind 9, day lui 1 o, chi quan khong an duoc bang lao - Voi, hoi chieu 2 luot),
   hai bo dem doc lap; quan bi huc bi choang 1 luot cua phe no (slot SL+12/13 = vi tri+1).
   Moi kich ban chay cho CA HAI PHE (guong doc). Ban do: xem MAPROWS. Phe + = duoi (hang o (8,4)), phe - = tren.
   Bay phe + : (7,4) (8,3) (8,5). Bo rung huc quan dich VE PHIA bay cua phe minh khi huc ve phia hang minh. */
const fs=require('fs'),path=require('path');
const E=new Function(fs.readFileSync(process.env.ENGINE||path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
// Kich ban dung cot giua; bui moi (3,4),(5,4) la dia hinh rieng nen xoa o day de cac kich ban cu giu nguyen y nghia.
E.BUSH[3*9+4]=0;E.BUSH[5*9+4]=0;
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

/* ===== 1. Huc thanh cong voi Voi; Lao uu tien voi quan an duoc ===== */
scn('huc Voi',BIS,[[4,4,7],[6,4,-8]],c=>{
  c.ck('co nuoc huc (kind 9) vao Voi dich cach 2 o',c.has(c.sg,9,4,4,6,4));
  c.ck('khong co nuoc lao an Voi (bac 7 < 8)',!c.has(c.sg,8,4,4,6,4));
  const before=count(c.cells,-c.sg);
  mk(c,c.sg,4,4,6,4,9);
  c.ck('Bo rung tien vao o giua',c.code(5,4)===7*c.sg&&c.code(4,4)===0);
  c.ck('Voi bi day lui 1 o cung huong (khong bi an)',c.code(7,4)===-8*c.sg&&c.code(6,4)===0&&count(c.cells,-c.sg)===before);
  c.ck('huc khoi dong hoi chieu huc = 2, khong dung bo dem lao',c.slot(10)===2&&c.slot(4)===0);
});
[[3,'Soi'],[2,'Meo'],[5,'Bao'],[6,'Ho'],[7,'Su tu'],[4,'Cho'],[1,'Chuot']].forEach(([vc,nm])=>{
  scn('lao uu tien '+nm,BIS,[[4,4,7],[6,4,-vc]],c=>{
    c.ck(nm+' an duoc bang Lao: co nuoc Lao (kind 8)',c.has(c.sg,8,4,4,6,4));
    c.ck(nm+' an duoc bang Lao: KHONG co nuoc Huc',!c.has(c.sg,9,4,4,6,4)&&!c.anyK(c.sg,9));
  });
});
scn('huc ngang',BIS,[[6,3,7],[6,5,-8]],c=>{
  c.ck('huc Voi theo hang ngang day ve (6,6)',(()=>{ if(!c.has(c.sg,9,6,3,6,5)) return false; mk(c,c.sg,6,3,6,5,9); return c.code(6,4)===7*c.sg&&c.code(6,6)===-8*c.sg; })());
});
scn('Voi dung tren bay phe Bo rung (bac 4) an duoc bang Lao',BIS,[[5,4,7],[7,4,-8]],c=>{
  c.ck('Voi o bay (7,4) co bac 4: Lao an duoc, khong huc',c.eff(7,4)===4&&c.has(c.sg,8,5,4,7,4)&&!c.anyK(c.sg,9));});
scn('Lao dang hoi chieu van khong cho huc quan an duoc',BIS,[[4,4,7],[6,4,-3]],c=>{
  c.cells[SL+4+c.A]=1;
  c.ck('Soi an duoc bang Lao nhung Lao dang hoi chieu: khong duoc huc thay the (luat: dua tren kha nang an)',!c.anyK(c.sg,9)&&!c.anyK(c.sg,8));});

/* ===== 2. Khong huc duoc ===== */
scn('khong huc Rua',BISTUR,[[4,4,7],[6,4,-9]],c=>{
  c.ck('Rua mien nhiem huc',!c.has(c.sg,9,4,4,6,4)&&!c.anyK(c.sg,9));});
scn('khong huc dong doi',BIS,[[4,4,7],[6,4,8]],c=>{
  c.ck('khong huc Voi phe minh',!c.anyK(c.sg,9));});
scn('khong dung khoang cach',BIS,[[4,4,7],[5,4,-8]],c=>{
  c.ck('Voi dich ke ben (cach 1 o) khong huc duoc',!c.anyK(c.sg,9));});
scn('khong dung khoang cach',BIS,[[3,4,7],[6,4,-8]],c=>{
  c.ck('Voi dich cach 3 o khong huc duoc',!c.anyK(c.sg,9));});
scn('khong huc cheo/lech hang',BIS,[[4,4,7],[6,5,-8]],c=>{
  c.ck('muc tieu lech hang khong huc duoc',!c.anyK(c.sg,9));});
scn('muc tieu o hang',BIS,[[2,4,7],[0,4,-8]],c=>{
  c.ck('quan trong hang khong bi huc',!c.has(c.sg,9,2,4,0,4));});
scn('muc tieu trong dam lay (Voi)',BIS,[[5,4,7],[5,6,-8]],c=>{
  c.ck('o giua (5,5) trong, muc tieu Voi o dam lay (5,6), o sau (5,7) dam lay trong: huc duoc (luat nen cho phep)',c.has(c.sg,9,5,4,5,6));});

/* ===== 3. O giua / o sau bi chan ===== */
scn('o giua bi chan',BIS,[[4,4,7],[5,4,-1],[6,4,-8]],c=>{
  c.ck('o giua co quan: khong huc',!c.has(c.sg,9,4,4,6,4));});
scn('o giua bi chan boi quan minh',BIS,[[4,4,7],[5,4,2],[6,4,-8]],c=>{
  c.ck('o giua co quan minh: khong huc',!c.has(c.sg,9,4,4,6,4));});
scn('o giua la bui',BIS,[[0,2,7],[2,2,-8]],c=>{
  c.ck('o giua la bui (1,2): khong huc xuyen bui',!c.has(c.sg,9,0,2,2,2));});
scn('o giua la dam lay',BIS,[[5,5,7],[5,7,-8]],c=>{
  c.ck('o giua la dam lay (5,6): khong huc xuyen dam lay',!c.has(c.sg,9,5,5,5,7));});
scn('o giua la nuoc',BIS,[[3,3,7],[5,3,-8]],c=>{
  c.ck('o giua la mat nuoc (4,3): khong huc',!c.anyK(c.sg,9));});
scn('o sau ngoai ban',BIS,[[6,0,7],[8,0,-8]],c=>{
  c.ck('o sau nam ngoai ban: khong huc',!c.has(c.sg,9,6,0,8,0));});
scn('o sau co quan',BIS,[[4,4,7],[6,4,-8],[7,4,-2]],c=>{
  c.ck('o sau co quan (dich): khong huc',!c.has(c.sg,9,4,4,6,4));});
scn('o sau co quan minh',BIS,[[4,4,7],[6,4,-8],[7,4,2]],c=>{
  c.ck('o sau co quan (minh): khong huc',!c.has(c.sg,9,4,4,6,4));});
scn('o sau la hang',BIS,[[5,4,7],[7,4,-8]],c=>{
  c.ck('o sau la hang (8,4): khong day vao hang',!c.has(c.sg,9,5,4,7,4));});
scn('o sau la nuoc',BIS,[[1,0,7],[3,0,-8]],c=>{
  c.ck('o sau la ho (4,0): khong day xuong ho',!c.has(c.sg,9,1,0,3,0));});
scn('Voi khong len cau go',BIS,[[1,8,7],[3,8,-8]],c=>{
  c.ck('o sau la cau go hep (4,8): khong day Voi len cau',!c.has(c.sg,9,1,8,3,8));});
scn('Voi vao dam lay',BIS,[[0,6,7],[2,6,-8]],c=>{
  c.ck('Voi bi day vao dam lay (3,6) duoc (luat nen cho phep quan khong phai Chuot/Ca sau)',c.has(c.sg,9,0,6,2,6));});

/* ===== 4. Bay ===== */
scn('huc vao bay',BIS,[[4,4,7],[6,4,-8]],c=>{
  c.ck('Voi o (6,4) bac 8 truoc khi bi huc',c.eff(6,4)===8);
  mk(c,c.sg,4,4,6,4,9);
  c.ck('Voi bi day vao bay (7,4): giu bac 4 (ngoai le cua Voi)',c.eff(7,4)===4);
});
scn('huc vao bay (8,3)',BIS,[[5,3,7],[7,3,-8]],c=>{
  c.ck('co nuoc huc vao bay canh hang',c.has(c.sg,9,5,3,7,3));
  mk(c,c.sg,5,3,7,3,9);
  c.ck('Voi bi day vao bay (8,3): bac 4',c.code(8,3)===-8*c.sg&&c.eff(8,3)===4);
});
scn('huc ve phia hang dich (bay cua chinh no)',BIS,[[3,3,7],[1,3,-8]],c=>{
  c.ck('day ve phia hang dich: co nuoc huc',c.has(c.sg,9,3,3,1,3));
  mk(c,c.sg,3,3,1,3,9);
  c.ck('Voi bi day vao bay cua CHINH NO (0,3): khong mat bac',c.code(0,3)===-8*c.sg&&c.eff(0,3)===8);
});

/* ===== 5. Hoi chieu: lao 1 luot, huc 2 luot ===== */
scn('hoi chieu huc',BIS,[[4,4,7],[6,4,-8],[7,0,1],[1,0,-1]],c=>{
  mk(c,c.sg,4,4,6,4,9);
  c.cells[c.I(3,4)]=-8*c.sg; c.cells[c.I(7,4)]=0; // Voi moi cach 2 o ve phia truoc Bo rung (5,4)
  const pushNow=()=>E.movesFrom(c.cells,c.I(5,4),[]).some(m=>((m>>14)&15)===9);
  c.ck('ngay sau huc: huc bi khoa, bo dem huc = 2, lao = 0',!pushNow()&&c.slot(10)===2&&c.slot(4)===0);
  mk(c,c.sg,1,0,1,1,0);
  c.ck('nuoc di cua doi phuong khong giam bo dem huc',c.slot(10)===2);
  mk(c,c.sg,7,0,7,1,0);
  c.ck('sau 1 luot cua phe minh: huc con 1, van khoa',c.slot(10)===1&&!pushNow());
  mk(c,c.sg,1,1,1,2,0);
  mk(c,c.sg,7,1,7,2,0);
  c.ck('sau 2 luot cua phe minh: huc ve 0, dung lai duoc',c.slot(10)===0&&pushNow());
});
scn('hoi chieu lao',BIS,[[4,4,7],[6,4,-3],[7,0,1],[1,0,-1]],c=>{
  mk(c,c.sg,4,4,6,4,8);
  const b=c.I(6,4);
  c.ck('lao khoi dong hoi chieu lao = 1, khong dung bo dem huc',c.slot(4)===1&&c.slot(10)===0);
  c.cells[c.I(6,2)]=-3*c.sg; c.cells[c.I(6,6)]=-8*c.sg;
  const kinds=()=>E.movesFrom(c.cells,b,[]).map(m=>(m>>14)&15);
  c.ck('ngay sau lao: lao bi khoa, huc Voi dung duoc',!kinds().includes(8)&&kinds().includes(9));
  mk(c,c.sg,7,0,7,1,0);
  c.ck('sau 1 luot cua phe minh: lao dung lai duoc',c.slot(4)===0&&kinds().includes(8));
});
scn('lao khoa nhung huc dung',BIS,[[4,4,7],[6,4,-8],[7,0,1]],c=>{
  c.cells[SL+4+c.A]=1;
  const k=E.movesFrom(c.cells,c.I(4,4),[]).map(m=>(m>>14)&15);
  c.ck('lao dang hoi chieu: huc Voi van dung duoc',!k.includes(8)&&k.includes(9));
});
scn('huc khoa nhung lao dung',BIS,[[4,4,7],[6,4,-3],[2,4,-8]],c=>{
  c.cells[SL+10+c.A]=2;
  const k=E.movesFrom(c.cells,c.I(4,4),[]).map(m=>(m>>14)&15);
  c.ck('huc dang hoi chieu: lao an Soi van dung duoc, huc Voi khong',k.includes(8)&&!k.includes(9));
});
scn('hai bo dem giam doc lap',BIS,[[4,4,7],[7,0,1],[1,0,-1]],c=>{
  c.cells[SL+4+c.A]=1; c.cells[SL+10+c.A]=2;
  mk(c,c.sg,7,0,7,1,0);
  c.ck('sau 1 luot: lao 1->0, huc 2->1',c.slot(4)===0&&c.slot(10)===1);
  mk(c,c.sg,7,1,7,2,0);
  c.ck('sau 2 luot: lao 0, huc 0',c.slot(4)===0&&c.slot(10)===0);
});
scn('bo dem giam ca khi dung ky nang khac',BIS,[[4,4,7],[7,0,1]],c=>{
  c.cells[SL+10+c.A]=2;
  mk(c,c.sg,4,4,5,4,0);
  c.ck('Bo rung di buoc thuong van lam huc giam 2->1',c.slot(10)===1);
});
scn('hai phe doc lap',BIS,[[4,4,7],[4,5,-7],[7,0,1]],c=>{
  c.cells[SL+10+c.A]=2;
  c.ck('bo dem cua phe kia khong bi doi',c.cells[SL+10+(1-c.A)]===0);
});

/* ===== 6. Co dien, Cho khoa ===== */
scn('Co dien khong co lao/huc',BIS,[[4,4,7],[6,4,-8]],c=>{
  c.ck('che do Co dien: khong co kind 8/9',!c.anyK(c.sg,8)&&!c.anyK(c.sg,9));},{classic:true});
scn('Cho khoa Bo rung',BIS,[[2,3,7],[2,5,-8]],c=>{
  c.ck('khong co Cho: huc Voi duoc',c.has(c.sg,9,2,3,2,5));
  c.cells[c.I(1,3)]=-4*c.sg;
  c.ck('Cho dich (dang giu hang) ke ben: khoa huc',!c.anyK(c.sg,9)&&!c.anyK(c.sg,8));
});

/* ===== 7. CHOANG: chi quan bi huc bi choang 1 luot cua phe no ===== */
scn('choang co ban',BIS,[[4,4,7],[6,4,-8],[0,0,-1],[8,8,1]],c=>{
  const V=c.sg>0?1:0; // chi so phe bi huc
  mk(c,c.sg,4,4,6,4,9);
  const vi=c.I(7,4);
  c.ck('quan bi huc duoc danh dau choang (SL+12/13 = vi tri moi + 1)',c.cells[SL+12+(1-c.A)]===vi+1);
  c.ck('Bo rung KHONG bi choang',c.cells[SL+12+c.A]===0&&E.movesFrom(c.cells,c.I(5,4),[]).length>0);
  c.ck('quan choang khong co nuoc di nao',E.movesFrom(c.cells,vi,[]).length===0);
  const vm=E.genMoves(c.cells,-c.sg);
  c.ck('phe bi huc van co quan khac di duoc, nhung khong co nuoc nao xuat phat tu quan choang',vm.length>0&&vm.every(m=>(m&127)!==vi));
  mk(c,c.sg,0,0,0,1,0);
  c.ck('sau khi phe bi huc di xong luot: het choang',c.cells[SL+12+(1-c.A)]===0&&E.movesFrom(c.cells,vi,[]).length>0);
});
scn('choang khong ap dung cho Bo rung luot ke',BIS,[[4,4,7],[6,4,-8],[0,0,-1],[8,8,1],[2,2,-3]],c=>{
  mk(c,c.sg,4,4,6,4,9);
  mk(c,c.sg,0,0,0,1,0); // phe bi huc di quan khac
  const mine=E.genMoves(c.cells,c.sg);
  c.ck('Bo rung di lai binh thuong o luot ke tiep (co nuoc di cua Bo rung)',mine.some(m=>(m&127)===c.I(5,4)));
});
/* Regression: Huc -> quan dich vao bay gan hang -> choang -> khong vao hang ngay -> het choang moi di duoc */
scn('REGRESSION huc-bay-hang',BIS,[[4,4,7],[6,4,-8],[0,0,-1],[8,8,1],[7,0,1]],c=>{
  const vi=c.I(7,4), denI=c.I(8,4);
  c.ck('truoc huc: Voi o (6,4) chua o gan hang (khong co nuoc vao hang)',!E.genMoves(c.cells,-c.sg).some(m=>(m&127)===c.I(6,4)&&((m>>7)&127)===denI));
  mk(c,c.sg,4,4,6,4,9);
  c.ck('sau huc: Voi dung o bay (7,4) ke hang, bac 4',c.code(7,4)===-8*c.sg&&c.eff(7,4)===4&&E.DEN[denI]===c.sg);
  const m1=E.genMoves(c.cells,-c.sg);
  c.ck('luot ke cua phe bi huc: KHONG co nuoc vao hang (8,4) tu quan bi huc',!m1.some(m=>(m&127)===vi)&&!m1.some(m=>((m>>7)&127)===denI&&(m&127)===vi));
  c.ck('phe bi huc khong thang ngay (khong co nuoc vao hang nao)',!m1.some(m=>((m>>14)&15)===0&&((m>>7)&127)===denI));
  mk(c,c.sg,0,0,0,1,0);   // phe bi huc di quan khac -> het choang
  mk(c,c.sg,7,0,7,1,0);   // phe Bo rung di mot nuoc khac, khong an Voi
  const m2=E.genMoves(c.cells,-c.sg);
  c.ck('sau khi het choang: Voi vao hang duoc (nuoc di binh thuong)',m2.some(m=>(m&127)===vi&&((m>>7)&127)===denI&&((m>>14)&15)===0));
});
scn('REGRESSION huc-bay-hang: ben (8,3)',BIS,[[5,3,7],[7,3,-8],[0,0,-1],[8,8,1]],c=>{
  const vi=c.I(8,3);
  mk(c,c.sg,5,3,7,3,9);
  const m1=E.genMoves(c.cells,-c.sg);
  c.ck('Voi bi day vao bay (8,3) cung bi choang: khong co nuoc nao tu (8,3) (khong vao hang (8,4))',c.code(8,3)===-8*c.sg&&!m1.some(m=>(m&127)===vi));
});
scn('choang + buoc thuong tien don',BIS,[[4,1,7],[2,1,-8],[0,0,-1],[8,8,1],[7,0,1]],c=>{
  // Bo rung (4,1) tren cau, o giua (3,1) la tien don, Voi o bui (2,1), o sau (1,1)
  const outp=c.I(3,1);
  const cm=E.genMoves(c.cells,c.sg).filter(m=>(m&127)===c.I(4,1)&&((m>>14)&15)===9);
  c.ck('huc co nuoc kep (huc + buoc thuong tien don)',cm.some(m=>((m>>18)&127)!==((m>>25)&127))&&cm.some(m=>((m>>18)&127)===((m>>25)&127)));
  const comp=cm.find(m=>((m>>18)&127)!==((m>>25)&127));
  E.commitM(c.cells,comp);
  const vi=c.I(1,1);
  c.ck('sau nuoc kep (huc + buoc thuong): choang van con (khong bi xoa som boi buoc thuong)',c.cells[SL+12+(1-c.A)]===vi+1&&c.code(1,1)===-8*c.sg);
  c.ck('Voi choang khong di duoc o luot cua phe no',!E.genMoves(c.cells,-c.sg).some(m=>(m&127)===vi));
  mk(c,c.sg,0,0,0,1,0);
  c.ck('het choang sau khi phe no di xong luot',c.cells[SL+12+(1-c.A)]===0);
});
scn('choang tu bien mat khi quan bi an',BIS,[[0,0,-1],[8,8,1],[3,3,3]],c=>{
  const vi=c.I(5,5); c.cells[vi]=-8*c.sg; c.cells[SL+12+(1-c.A)]=vi+1;
  c.cells[vi]=c.sg*3; // quan cua phe Bo rung chiem o do (quan choang da bi an)
  c.ck('con tro choang cu khong anh huong quan khac phe ung vao o do',E.movesFrom(c.cells,vi,[]).length>0);
});
scn('choang va Khi doi cho',{9:0,6:1},[[4,4,6],[4,5,-8]],c=>{
  c.cells[SL+12+(1-c.A)]=c.I(4,5)+1;
  c.ck('Khi (neu co) khong doi cho voi quan dang choang: quan choang khong dung duoc',E.movesFrom(c.cells,c.I(4,5),[]).length===0);
});
scn('choang khong ap dung o Co dien',BIS,[[4,4,7],[6,4,-8]],c=>{
  c.ck('Co dien: khong sinh nuoc huc nen khong co choang',E.genMoves(c.cells,c.sg).every(m=>((m>>14)&15)<8));},{classic:true});
scn('hash phan biet choang',BIS,[[4,4,7],[6,4,-8]],c=>{
  const h0=E.hashOf(c.cells,c.sg); c.cells[SL+12+(1-c.A)]=c.I(6,4)+1; const h1=E.hashOf(c.cells,c.sg); c.cells[SL+12+(1-c.A)]=c.I(6,3)+1; const h2=E.hashOf(c.cells,c.sg);
  c.ck('hash khac nhau theo vi tri quan choang',h0!==h1&&h1!==h2&&h0!==h2);
});

/* ===== 8. Hoan tac (make/unmake), bat bien trang thai va hash ===== */
{
  let seed=20261029; const R=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  let pushSeen=0, laoSeen=0, mism=0, hashMism=0, nodes=0, posCnt=0, withCd=0, withStun=0;
  const same=(a,b)=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return false;return true;};
  const walk=(cells,side,d)=>{
    if(d===0) return;
    const moves=E.genMoves(cells,side);
    for(const m of moves){
      const k=(m>>14)&15; if(k===9) pushSeen++; if(k===8) laoSeen++;
      const snap=Int8Array.from(cells), h0=E.hashOf(cells,side);
      const cap=E.makeM(cells,m); nodes++;
      if(cells[SL+10]>0||cells[SL+11]>0) withCd++;
      if(cells[SL+12]>0||cells[SL+13]>0) withStun++;
      walk(cells,-side,d-1);
      E.unmakeM(cells,m,cap);
      if(!same(snap,cells)) mism++;
      if(E.hashOf(cells,side)!==h0) hashMism++;
    }
  };
  // vi tri tu tao (co Voi o gan Bo rung) + vi tri tu cac van ngau nhien
  const crafted=[ [[4,4,7],[6,4,-8],[0,0,-1],[8,8,1]], [[4,1,7],[2,1,-8],[0,0,-1],[8,8,1],[7,0,1]], [[5,4,7],[3,4,-8],[3,5,-3],[8,8,1]], [[3,3,-7],[5,3,8],[0,0,-1],[8,8,1]] ];
  crafted.forEach(pcs=>{ E.setClassic(false); E.SQ[0]=sq(BIS); E.SQ[1]=sq(BIS); E.setKeys(); const c=new Int8Array(N+ST); pcs.forEach(p=>{c[p[0]*COLS+p[1]]=p[2];}); [1,-1].forEach(sd=>{posCnt++; walk(c,sd,4);}); });
  const HKis=(cells,i)=>Math.abs(cells[i])===7&&E.HK[cells[i]+9]==='bison';
  for(let g=0;g<20;g++){
    E.setClassic(false); const s=Z.slice(); for(let r=2;r<=7;r++)s[r]=r===7?1:(R()*2|0); s[9]=R()*3|0; E.SQ[0]=s.slice(); E.SQ[1]=s.slice(); E.setKeys();
    const cells=E.initialCells(); let side=1;
    for(let i=0;i<24+((R()*20)|0);i++){
      const all=E.genMoves(cells,side); if(!all.length) break;
      const bis=all.filter(m=>HKis(cells,m&127)); const pick=(bis.length&&R()<.6)?bis[(R()*bis.length)|0]:all[(R()*all.length)|0];
      E.commitM(cells,pick); side=-side;
    }
    posCnt++; walk(cells,side,2);
  }
  ok('make/unmake khoi phuc chinh xac vi tri va moi bo dem/choang ('+nodes+' nut, '+posCnt+' vi tri)',mism===0);
  ok('hash khong doi sau make/unmake',hashMism===0);
  ok('stress da gap nuoc huc ('+pushSeen+'), lao ('+laoSeen+'), hoi chieu>0 ('+withCd+'), choang>0 ('+withStun+')',pushSeen>0&&laoSeen>0&&withCd>0&&withStun>0);
}
scn('commit/undo hoan nguyen',BIS,[[4,4,7],[6,4,-8],[7,0,1]],c=>{
  const snap=Int8Array.from(c.cells), m=c.I(4,4)|(c.I(6,4)<<7)|(9<<14);
  const cap=E.makeM(c.cells,m); E.unmakeM(c.cells,m,cap);
  let same=true; for(let i=0;i<snap.length;i++) if(snap[i]!==c.cells[i]) same=false;
  c.ck('makeM/unmakeM nuoc huc Voi tra ve dung vi tri, bo dem va choang',same);
});

/* ===== 9. AI ===== */
E.LEVELS[3].depth=3; E.LEVELS[3].ms=1e6;
scn('AI Lao uu tien',BIS,[[6,3,7],[6,5,-3],[8,0,1],[0,0,-1]],c=>{
  const all=E.genMoves(c.cells,c.sg);
  c.ck('quan an duoc: engine chi sinh Lao (khong sinh Huc cho quan do)',all.some(m=>((m>>14)&15)===8)&&!all.some(m=>((m>>14)&15)===9));
  E.clearTT(); const r=E.search(c.cells,c.sg,3,[],[]);
  c.ck('AI chon nuoc Lao an quan khi do la nuoc an chac',r&&((r.m>>14)&15)===8&&r.t===c.I(6,5));
});
scn('AI Huc',BIS,[[4,4,7],[6,4,-8],[8,0,3],[0,0,-3]],c=>{
  const all=E.genMoves(c.cells,c.sg);
  const hucs=all.filter(m=>((m>>14)&15)===9);
  c.ck('khong an duoc Voi: engine sinh nuoc Huc',hucs.length>0);
  E.clearTT(); const r=E.search(c.cells,c.sg,3,[],all.filter(m=>((m>>14)&15)!==9));
  c.ck('khi chi con nuoc Huc, AI tim kiem va chon nuoc Huc hop le',r&&hucs.indexOf(r.m)>=0);
  const snap=Int8Array.from(c.cells); E.clearTT(); E.search(c.cells,c.sg,3,[],[]);
  let same=true; for(let i=0;i<snap.length;i++) if(snap[i]!==c.cells[i]) same=false;
  c.ck('tim kiem khong lam thay doi trang thai ban dau',same);
});
scn('AI: huc vao bay khong tao thang ngay cho doi phuong',BIS,[[4,4,7],[6,4,-8],[8,0,3],[0,0,-3]],c=>{
  const m=E.genMoves(c.cells,c.sg).find(x=>((x>>14)&15)===9&&(x&127)===c.I(4,4));
  const cap=E.makeM(c.cells,m);
  const replies=E.genMoves(c.cells,-c.sg);
  const winNow=replies.some(x=>((x>>14)&15)===0&&E.DEN[(x>>7)&127]===c.sg);
  E.unmakeM(c.cells,m,cap);
  c.ck('sau huc vao bay canh hang: doi phuong KHONG co nuoc thang ngay (nho choang)',!winNow);
});
scn('AI: Bo rung hanh dong binh thuong sau huc',BIS,[[4,4,7],[6,4,-8],[8,0,3],[0,0,-3]],c=>{
  const m=E.genMoves(c.cells,c.sg).find(x=>((x>>14)&15)===9);
  const cap=E.makeM(c.cells,m);
  const r1=E.genMoves(c.cells,-c.sg); const rep=r1.find(x=>(x&127)===c.I(0,0));
  E.makeM(c.cells,rep);
  const mine=E.genMoves(c.cells,c.sg).filter(x=>(x&127)===c.I(5,4));
  c.ck('Bo rung co nuoc di o luot ke tiep (buoc thuong), khong bi choang hay khoa',mine.length>0&&mine.some(x=>((x>>14)&15)===0));
  c.ck('Bo dem lao doc lap: lao khong bi khoa sau huc',c.slot(4)===0);
});
console.log('bison pass',pass,'fail',fails); process.exit(fails?1:0);
