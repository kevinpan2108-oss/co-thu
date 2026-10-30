var EN=makeEngine();
var COLS=EN.COLS, ROWS=EN.ROWS, N=EN.N, SL=EN.SL, DENME=EN.DENME, DENFOE=EN.DENFOE, MAPROWS=EN.MAPROWS, ROCK=EN.ROCK, BUSH=EN.BUSH, BRIDGE=EN.BRIDGE, MARSH=EN.MARSH, OUTPOST=EN.OUTPOST;
var WATER=EN.WATER, TRAP=EN.TRAP, DEN=EN.DEN, ADJ=EN.ADJ, SQ=EN.SQ, HK=EN.HK;
var genMoves=EN.genMoves, movesFrom=EN.movesFrom, commit=EN.commit, effRank=EN.effRank, initialCells=EN.initialCells, setKeys=EN.setKeys, setClassic=EN.setClassic;
var engineSrc=makeEngine.toString();

/* ---------- Du lieu quan co ---------- */
function H(k,n,e,s,ep,br,t){return {k:k,n:n,e:e,s:s,ep:ep,br:br,t:t};}
/* Icon thu (SVG don sac trong sprite #ic-<k>); chi chen HTML khi dung dung dinh dang nay */
function ico(h){return '<svg class="ico" aria-hidden="true"><use href="#ic-'+h.k+'"/></svg>';}
function ie(h){return h.k?ico(h):h.e;}
var IC_RE=/^<svg class="ico" aria-hidden="true"><use href="#ic-[a-z]+"\/><\/svg>$/;
function setIc(el,v){ if(IC_RE.test(v)) el.innerHTML=v; else el.textContent=v; }
var HEROES=[null,
 [H('rat','Chuột','🐭','Chít chít!','Thợ lặn','Bơi hồ · ăn Voi trên bờ',[
   ['g','Bơi hồ; trên bờ ăn được Voi.'],
   ['b','Bậc 1; Cá sấu bắt được Chuột khi bơi.']])],
 [H('cat','Mèo','🐱','Meo!','Dân leo trèo','Trèo qua 1 quân kề bên',[
   ['g','Nhảy qua 1 quân kề, đáp xuống ngay sau.'],
   ['b','Không nhảy vào hồ/hang hoặc qua quân dưới nước.']]),
  H('fox','Cáo','🦊','Ăng ẳng!','Kẻ tinh quái','Nước rút 2 ô thẳng',[
   ['g','Lao thẳng 2 ô khi ô giữa trống.'],
   ['b','Không lao vào hang; bậc 2.']])],
 [H('wolf','Sói','🐺','Ú uuu!','Thủ lĩnh bầy','Có đồng đội kề: bậc 4',[
   ['g','Có đồng đội bậc ≥ 2 kề bên: lên bậc 4.'],
   ['b','Đi lẻ: bậc 3.']]),
  H('boar','Lợn rừng','🐗','Ụt ịt!','Kẻ húc đầu','Sát hồ: bậc 4',[
   ['g','Đứng sát hồ: bậc 4.'],
   ['b','Xa hồ: bậc 3.']])],
 [H('dog','Chó','🐶','Gâu gâu!','Cún canh hang','Khu hang nhà: bậc 5 · khóa chiêu',[
   ['g','Ở vùng hang nhà: lên bậc 5.'],
   ['b','Khóa chiêu địch kề bên; ra ngoài còn bậc 4.']]),
  H('bear','Gấu','🐻','Gừ gừ!','Kẻ xâm lược','Sân địch: bậc 5',[
   ['g','Sang nửa sân địch: lên bậc 5.'],
   ['b','Sân nhà bậc 4; không bị Chó khóa.']])],
 [H('leo','Báo','🐆','Grừ!','Kẻ rình mồi','Đi chéo · ăn chéo bậc 6',[
   ['g','Đi chéo 1 ô; ăn chéo lên bậc 6.'],
   ['b','Không đi chéo vào hồ/hang.']]),
  H('croc','Cá sấu','🐊','Ngoạp!','Chúa đầm lầy','Lội hồ bậc 6 · bắt mồi',[
   ['g','Dưới hồ bậc 6; bắt quân bậc 1–4 sát bờ.'],
   ['b','Chặn Hổ nhảy hồ; trên bờ ăn Chuột đang bơi.']])],
 [H('tig','Hổ','🐯','Grào!','Chúa vồ mồi','Nhảy hồ · đáp xuống bậc 7',[
   ['g','Nhảy qua hồ, đáp xuống đạt bậc 7.'],
   ['b','Giữ bậc 7 đến khi Hổ tự đi; Chuột/Cá sấu chặn đường.']]),
  H('eagle','Đại bàng','🦅','Éc éc!','Chúa bầu trời','Bay qua hồ không bị chặn',[
   ['g','Bay qua hồ; Chuột/Cá sấu không chặn được.'],
   ['b','Đáp xuống bậc 6, không có bước thưởng.']])],
 [H('lio','Sư tử','🦁','Gầm!','Vua rừng xanh','Vồ xa 2 ô',[
   ['g','Vồ quân cách 2 ô thẳng khi ô giữa trống.'],
   ['b','Hồi chiêu 2 lượt; không vồ quân trong bụi/hồ.']]),
  H('bison','Bò rừng','🦬','Ùm bò!','Xe húc','Lao 2 ô · húc đẩy lùi quân địch',[
   ['g','Lao thẳng 2 ô; ăn quân bậc ≤ 7 (hồi 1 lượt).'],
   ['b','Húc đẩy lùi, choáng 1 lượt (hồi 2; Rùa miễn nhiễm).']])],
 [H('ele','Voi','🐘','Pa-ôm!','Khối núi biết đi','Ăn mọi quân trừ Chuột',[
   ['g','Ăn mọi quân trừ Chuột.'],
   ['b','Vào bẫy địch vẫn bậc 4; không qua cầu gỗ hẹp.']])]
 ];
 var H_MON=H('mon','Khỉ','🐒','Khẹc khẹc!','Kẻ tinh nghịch','Đổi chỗ với quân kề bên',[
   ['g','Đổi chỗ với quân kề; không ăn quân khác.'],
   ['b','Hồi chiêu 1 lượt; không đổi quân dưới nước/hồ/hang; bị Chó khóa.']]);
 var H_TUR=H('tur','Rùa','🐢','Rùa rùa!','Tường thành','Mai cứng · không thể bị ăn',[
   ['g','Không thể bị ăn, đổi chỗ hay húc.'],
   ['b','Đi 1 ô ngang/dọc; bên chỉ còn Rùa sẽ thua.']]);
 var EXTRAS=[null,H_MON,H_TUR];
/* Cổ điển: không tuyệt kỹ */
var CH=[null,
  H('rat','Chuột','🐭','Chít chít!','Thợ lặn','Bơi hồ · hạ Voi',[
    ['g','Bơi hồ; trên bờ ăn được Voi.'],['b','Bậc 1, dễ bị ăn.']]),
  H('cat','Mèo','🐱','Meo!','Dân leo trèo','Bậc 2',[
    ['g','Bậc 2, ăn được Chuột.'],['b','Dễ bị quân bậc cao hơn ăn.']]),
  H('wolf','Sói','🐺','Ú uuu!','Thủ lĩnh bầy','Bậc 3',[
    ['g','Bậc 3, ăn Mèo/Chuột.'],['b','Thua Chó và quân bậc cao hơn.']]),
  H('dog','Chó','🐶','Gâu gâu!','Cún canh hang','Bậc 4',[
    ['g','Bậc 4, ăn quân bậc 1–3.'],['b','Thua Báo, Hổ, Sư tử, Voi.']]),
  H('leo','Báo','🐆','Grừ!','Kẻ rình mồi','Bậc 5',[
    ['g','Bậc 5, ăn quân bậc thấp hơn.'],['b','Thua Hổ, Sư tử, Voi.']]),
  H('tig','Hổ','🐯','Grào!','Chúa vồ mồi','Nhảy qua hồ',[
    ['g','Nhảy qua hồ theo hàng thẳng.'],['b','Không nhảy nếu có Chuột chắn đường.']]),
  H('lio','Sư tử','🦁','Gầm!','Vua rừng xanh','Nhảy hồ · bậc 6',[
    ['g','Nhảy qua hồ, ăn quân trừ Voi.'],['b','Không ăn được Voi.']]),
  H('ele','Voi','🐘','Pa-ôm!','Khối núi biết đi','Mạnh nhất, sợ Chuột',[
    ['g','Ăn mọi quân trừ Chuột.'],['b','Chuột trên bờ ăn được Voi.']])
];

function hero(c){
  var r=c<0?-c:c;
  if(EN.isClassic()) return CH[r]||H_MON;
  if(r===9) return EXTRAS[SQ[c>0?0:1][9]]||H_MON;
  return HEROES[r][SQ[c>0?0:1][r]];
}
function nominal(c){ var r=c<0?-c:c; return (!EN.isClassic()&&HK[c+9]==='croc')?5:r; }
function zero(){return [0,0,0,0,0,0,0,0,0,0];}
function S(a,b,c,d,e,f,x){return [0,0,a,b,c,d,e,f,0,x||0];}
var CHALS=[
 {n:'1 · Khởi động',d:'Bạn chọn đội hình. Máy chơi cấp 2 (Dễ).',lvl:2},
 {n:'2 · Thiếu Voi',d:'Bạn mất Voi ngay từ đầu. Máy đủ quân, cấp 3 (Vừa).',drop:[8],lvl:3},
 {n:'3 · Bầy lạ',d:'Cả hai bên dùng toàn tướng thứ hai của mỗi bậc. Cấp 3.',me:S(1,1,1,1,1,1,0),foe:S(1,1,1,1,1,1,0),lvl:3},
 {n:'4 · Hang trống',d:'Bạn mất quân bậc 2 và bậc 4. Cấp 3.',drop:[2,4],lvl:3},
 {n:'5 · Khỉ tinh nghịch',d:'Cả hai bên có Khỉ. Bạn chọn các tướng còn lại. Cấp 4 (Khó).',ex:[1,1],lvl:4},
 {n:'6 · Tường Rùa',d:'Cả hai bên có Rùa chặn đường. Bạn chọn các tướng còn lại. Cấp 4.',ex:[2,2],lvl:4},
 {n:'7 · Đấu trùm',d:'Bạn chọn đội hình. Máy chơi cấp 5 (Cao thủ).',lvl:5},
 {n:'8 · Ván hàng ngày',d:'Mỗi ngày một đội hình chung cho cả hai bên. Cấp 3.',daily:true,lvl:3}
];
var LEVEL_NOTE={
 1:'Tập sự: đi gần như ngẫu nhiên, thích ăn quân khi có dịp.',
 2:'Dễ: nhìn trước 3 nước nhưng còn hay đi hớ.',
 3:'Vừa: nhìn trước khoảng 6 nước, ít khi bỏ quân, biết giữ hang.',
 4:'Khó: nhìn sâu 10 nước, tính cả chuỗi ăn quân, bẫy và phòng thủ hang.',
 5:'Cao thủ: nhìn rất sâu, gần như không sai, mỗi nước nghĩ vài giây.'
};
var MODES=['basic','draft','chal'];
var MODE_DESC={
  basic:'Luật Cờ Thú truyền thống, 8 quân mỗi bên, không có tuyệt kỹ.',
  draft:'Trước ván, chọn một tướng cho mỗi bậc 2 đến 7 và một quân ngoài bậc (Khỉ, Rùa hoặc không dùng).',
  chal:'Tám thử thách với luật và đội hình đặc biệt. Thắng để lấy dấu sao. Chỉ chơi với máy.'
};
var TAGS={
  basic:'Luật cổ điển. Đưa một quân vào hang đối phương để thắng.',
  draft:'Chọn tướng, lập đội hình riêng, rồi đưa một quân vào hang địch.',
  chal:'Vượt từng thử thách với đội hình và luật đặc biệt.'
};
