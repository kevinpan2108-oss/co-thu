/* Kiem thu tuong tac dia hinh: dam lay, song, cau, bui, da, Ca sau, Su tu, Cao, Bo rung, Ho, Dai bang.
   Moi kich ban chay cho CA HAI PHE (guong doc): phe duoi (+) va phe tren (-). */
const fs=require('fs'),path=require('path');
const E=new Function(fs.readFileSync(path.join(__dirname,'..','src','engine.js'),'utf8')+';return makeEngine();')();
const {N,ST,COLS,ROWS}=E; const Z=[0,0,0,0,0,0,0,0,0,0];
let pass=0,fails=0; const ok=(n,c)=>{if(c)pass++;else{fails++;console.log('FAIL',n);}};
const sq=o=>{const a=Z.slice();Object.keys(o).forEach(k=>a[k]=o[k]);return a;};
/* name, bien the quan {hang:chi so}, quan [[r,c,ma]] (dat o phe +, duoi), fn(ctx) */
function scn(name,variants,pieces,fn){
  [0,1].forEach(mir=>{
    E.setClassic(false); const a=sq(variants); E.SQ[0]=a.slice(); E.SQ[1]=a.slice(); E.setKeys();
    const sg=mir?-1:1, R=r=>mir?ROWS-1-r:r, I=(r,c)=>R(r)*COLS+c;
    const cells=new Int8Array(N+ST); pieces.forEach(p=>{cells[I(p[0],p[1])]=p[2]*sg;});
    const mv=(side)=>E.genMoves(cells,side);
    const has=(side,kind,fr,fc,tr,tc)=>mv(side).some(m=>(m&127)===I(fr,fc)&&((m>>7)&127)===I(tr,tc)&&((m>>14)&15)===kind&&((m>>18)&127)===((m>>25)&127));
    const any=(side,fr,fc,tr,tc)=>mv(side).some(m=>(m&127)===I(fr,fc)&&((m>>7)&127)===I(tr,tc));
    fn({cells,I,sg,has,any,mv,ck:(n,c)=>ok(name+' | '+n+(mir?' [phe tren]':' [phe duoi]'),c),eff:(r,c)=>E.effRank(cells,I(r,c))});
  });
}
const CROC={5:1}, WOLF={3:0}, TIG={6:0}, EAG={6:1};
/* Ban do: song hang 4 (cot 0 cau,1 cau,..), dam lay (3,6)(3,7)(5,6)(5,7), bai can (4,4)(4,5), cau (4,1)(4,8) */
// ---------- Ca sau phuc kich ----------
scn('croc ambush',CROC,[[4,6,5],[5,6,-3]],c=>{ // croc song (4,6); soi trong dam lay (5,6)
  c.ck('khong phuc kich quan dung trong dam lay (tu song)',!c.has(c.sg,6,4,6,5,6)&&!c.any(c.sg,4,6,5,6));});
scn('croc ambush',CROC,[[5,6,5],[5,7,-3]],c=>{ // croc trong dam lay, soi trong dam lay ke ben
  c.ck('khong phuc kich quan trong dam lay (tu dam lay)',!c.has(c.sg,6,5,6,5,7));});
scn('croc ambush',CROC,[[5,6,5],[5,5,-3]],c=>{
  c.ck('phuc kich quan tren bo tu dam lay',c.has(c.sg,6,5,6,5,5));
  c.ck('khong buoc/an thuong (Ca sau o dam lay mang uu the nuoc)',!c.has(c.sg,0,5,6,5,5));});
scn('croc ambush',CROC,[[4,6,5],[3,5,-3]],c=>{ // (3,5) bo, ke (4,5)? khong ke. dung (4,5) bai can
  c.ck('khong phuc kich quan khong ke (3,5)',!c.any(c.sg,4,6,3,5));});
scn('croc ambush',CROC,[[4,7,5],[4,8,-3]],c=>{ c.ck('phuc kich quan tren cau (4,8)',c.has(c.sg,6,4,7,4,8));});
scn('croc ambush',CROC,[[4,6,5],[3,6,-1]],c=>{ c.ck('Chuot trong dam lay khong bi phuc kich',!c.has(c.sg,6,4,6,3,6));});
scn('croc rank',CROC,[[4,6,5],[5,6,-5],[6,6,-5],[6,5,5]],c=>{
  c.ck('Ca sau o song hieu luc 6',c.eff(4,6)===6);
  c.ck('Ca sau o dam lay hieu luc 6',c.eff(5,6)===6);
  c.ck('Ca sau tren bo hieu luc 3',c.eff(6,5)===3);});
scn('croc target rank',{...CROC,3:0},[[5,6,5],[5,5,-3],[6,5,-3],[6,4,-2]],c=>{
  // soi (5,5) co dong doi ke (6,5): hieu luc 4 van <=4 -> phuc kich duoc
  c.ck('Soi hieu luc 4 van bi phuc kich',c.eff(5,5)===4&&c.has(c.sg,6,5,6,5,5));});
scn('croc target rank',{5:1,4:1},[[5,6,5],[5,5,-4],[1,4,0]],c=>{
  // Gau (-4) dung (5,5): chua o 'tien cong' voi phe tren? kiem tra bac hieu luc dung voi ham effRank
  const e=c.eff(5,5); c.ck('Gau o bac '+e+' ; phuc kich <=> bac<=4',c.has(c.sg,6,5,6,5,5)===(e<=4));});
// ---------- Ban Ca sau trong dam lay / song ----------
scn('snipe croc',{...CROC,...TIG},[[5,6,-5],[5,5,6]],c=>{
  c.ck('Ho (6) tren bo ban Ca sau trong dam lay',c.has(c.sg,6,5,5,5,6));
  c.ck('Ca sau trong dam lay khong bi buoc/an thuong',!c.has(c.sg,0,5,5,5,6));});
scn('snipe croc',{...CROC,...TIG},[[5,6,-5],[5,7,6]],c=>{
  c.ck('Ho dung TRONG dam lay ke Ca sau dam lay cung ban duoc',c.has(c.sg,6,5,7,5,6));});
scn('snipe croc',{...CROC},[[5,6,-5],[5,5,4]],c=>{ c.ck('Cho (4) khong ban duoc',!c.any(c.sg,5,5,5,6));});
scn('snipe croc',{...CROC},[[4,6,-5],[5,6,8]],c=>{ c.ck('Voi (8) trong dam lay ban Ca sau o song (4,6)',c.has(c.sg,6,5,6,4,6));});
// ---------- Chuot / song / dam lay ----------
scn('rat',{},[[5,6,-1],[5,5,8]],c=>{ c.ck('Voi tren bo khong an Chuot trong dam lay',!c.any(c.sg,5,5,5,6));});
scn('rat',{},[[5,6,1],[5,5,-8]],c=>{ c.ck('Chuot trong dam lay khong an Voi tren bo',!c.any(c.sg,5,6,5,5));});
scn('rat',{},[[5,6,1],[4,6,-1]],c=>{ c.ck('Chuot dam lay an Chuot song',c.any(c.sg,5,6,4,6));});
scn('rat',CROC,[[6,6,5],[5,6,-1]],c=>{ c.ck('Ca sau tren bo an Chuot dang boi trong dam lay',c.any(c.sg,6,6,5,6));});
// ---------- Su tu ----------
scn('lion',{},[[7,6,7],[5,6,-3]],c=>{ c.ck('Su tu khong vo quan trong dam lay',!c.has(c.sg,7,7,6,5,6));});
scn('lion',{},[[6,7,7],[4,7,-3]],c=>{ c.ck('Su tu khong vo xuyen o giua la dam lay',!c.has(c.sg,7,6,7,4,7));});
scn('lion',{},[[7,3,7],[5,3,-3]],c=>{ c.ck('Su tu vo quan tren bo trong thuong',c.has(c.sg,7,7,3,5,3));});
scn('lion',{},[[7,5,7],[5,5,-3]],c=>{ c.ck('Su tu vo qua o trong (6,5) toi (5,5)',c.has(c.sg,7,7,5,5,5));});
scn('lion',{},[[7,4,7],[5,4,-3]],c=>{ c.ck('Su tu khong vo quan dung trong bui moi o (5,4)',!c.has(c.sg,7,7,4,5,4));});
// ---------- Cao / Bo rung lao qua dam lay ----------
scn('fox',{2:1},[[5,5,2]],c=>{ c.ck('Cao khong nuoc rut xuyen dam lay (5,5)->(5,7)',!c.has(c.sg,3,5,5,5,7));});
scn('fox',{2:1},[[7,6,2]],c=>{ c.ck('Cao nuoc rut dap xuong dam lay (7,6)->(5,6)',c.has(c.sg,3,7,6,5,6));});
scn('fox',{2:1},[[7,6,2],[5,6,-2]],c=>{ c.ck('Cao nuoc rut an Meo/Cao (bac 2) dung trong dam lay',c.has(c.sg,3,7,6,5,6));});
scn('bison',{7:1},[[6,6,7]],c=>{ c.ck('Bo rung khong lao xuyen dam lay (6,6)->(4,6)',!c.has(c.sg,8,6,6,4,6));});
scn('bison',{7:1},[[7,6,7]],c=>{ c.ck('Bo rung lao dap xuong dam lay',c.has(c.sg,8,7,6,5,6));});
// ---------- Ho / Dai bang ----------
scn('tiger',TIG,[[3,5,6]],c=>{ c.ck('Ho khong nhay qua dam lay hang 3',!c.any(c.sg,3,5,3,8));
  c.ck('Ho buoc vao dam lay',c.has(c.sg,0,3,5,3,6));});
scn('tiger',TIG,[[5,4,6],[3,4,-1]],c=>{ // song (4,4) la bai can (khong phai nuoc)? chi o nuoc that: (4,0),(4,2),(4,3),(4,6),(4,7)
  c.ck('(4,4) la bai can, khong nhay',!c.has(c.sg,1,5,4,3,4));});
scn('tiger',TIG,[[5,3,6]],c=>{ c.ck('Ho nhay qua song that (5,3)->(3,3)',c.has(c.sg,1,5,3,3,3));});
scn('tiger',{...TIG,5:1},[[5,3,6],[4,3,-5]],c=>{ c.ck('Ca sau trong song chan Ho nhay',!c.has(c.sg,1,5,3,3,3));});
scn('tiger',{...TIG,5:1},[[5,6,6],[4,6,-5],[3,6,-3]],c=>{ c.ck('Ho trong dam lay: Ca sau song chan duong nhay',!c.has(c.sg,1,5,6,3,6));});
scn('eagle',EAG,[[3,5,6]],c=>{ c.ck('Dai bang khong bay qua dam lay',!c.any(c.sg,3,5,3,8));});
scn('eagle',EAG,[[5,3,6],[4,3,-5]],c=>{ c.ck('Dai bang bay qua Ca sau trong song',c.has(c.sg,1,5,3,3,3));});
// ---------- Cau hep / Voi ----------
scn('bridge',{},[[5,1,8]],c=>{ c.ck('Voi khong buoc len cau hep (4,1)',!c.any(c.sg,5,1,4,1));});
scn('bridge',{},[[5,8,8]],c=>{ c.ck('Voi khong buoc len cau hep (4,8)',!c.any(c.sg,5,8,4,8));});
scn('bridge',{},[[5,1,4]],c=>{ c.ck('Cho buoc len cau hep',c.any(c.sg,5,1,4,1));});
scn('bridge',{7:0},[[4,5,8]],c=>{ c.ck('Voi o bai can (4,5) van di duoc',c.any(c.sg,4,5,3,5));});
// ---------- Da / bui ----------
scn('rock',{},[[3,1,4]],c=>{ c.ck('Quan khong buoc vao da (3,2)',!c.any(c.sg,3,1,3,2));});
// ---------- Lach lau say ----------
scn('bush diagonal slip',{},[[2,1,3]],c=>{
  c.ck('buoc cheo tu bui den dat trong (1,0)',c.has(c.sg,10,2,1,1,0));
  c.ck('buoc cheo tu bui sang o bui (1,2)',c.has(c.sg,10,2,1,1,2));
  c.ck('buoc cheo xuong dat (3,0)',c.has(c.sg,10,2,1,3,0));
  c.ck('khong lach vao nui da (3,2)',!c.has(c.sg,10,2,1,3,2));
  c.ck('chi buoc cheo, khong thay the buoc ngang (2,0)',!c.has(c.sg,10,2,1,2,0));
});
scn('bush diagonal slip occupied',{},[[2,1,3],[1,0,-2]],c=>{
  c.ck('khong dung buoc cheo de an quan dich',!c.has(c.sg,10,2,1,1,0));
});
scn('bush diagonal slip from land',{},[[3,3,3]],c=>{
  c.ck('quan ngoai bui khong co buoc cheo',!c.has(c.sg,10,3,3,2,2));
});
scn('bush diagonal slip into water',{},[[3,8,3]],c=>{
  c.ck('khong lach vao song (4,7)',!c.has(c.sg,10,3,8,4,7));
});
scn('bush diagonal slip outpost',{},[[2,2,3]],c=>{
  c.ck('buoc cheo vao tien don van du dieu kien nhan thuong',E.bonusEligible(c.cells,c.sg,c.I(2,2),c.I(3,1),10));
});
// ---------- Bac hieu luc ----------
scn('eff wolf',WOLF,[[6,4,3],[6,5,2],[3,0,3]],c=>{ c.ck('Soi co dong doi ke: 4',c.eff(6,4)===4); c.ck('Soi di le: 3',c.eff(3,0)===3);});
scn('eff boar',{3:1},[[3,3,3],[6,4,3]],c=>{ c.ck('Lon rung sat song that: 4',c.eff(3,3)===4); c.ck('Lon rung xa song: 3',c.eff(6,4)===3);});
scn('eff boar marsh',{3:1},[[5,6,3],[3,6,3]],c=>{ c.ck('Lon rung ke song (4,6) nhung dung dam lay: bac theo ke song that',c.eff(5,6)===4&&c.eff(3,6)===4);});
scn('eff dog',{4:0},[[7,4,4],[3,2,4]],c=>{
  c.ck('Cho o khu hang nha: 5',c.eff(7,4)===5); c.ck('Cho xa hang nha: 4',c.eff(3,2)===4);});
scn('eff bear',{4:1},[[2,0,4],[7,0,4]],c=>{ c.ck('Gau o nua san doi phuong: bac 5 va nua nha: 4',[c.eff(2,0),c.eff(7,0)].sort().join()==='4,5');});
scn('eff croc',CROC,[[5,5,5]],c=>{ c.ck('Ca sau tren bo: 3',c.eff(5,5)===3);});
console.log('terrain pass',pass,'fail',fails); process.exit(fails?1:0);
