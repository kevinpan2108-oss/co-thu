var EN=makeEngine();
var COLS=EN.COLS, ROWS=EN.ROWS, N=EN.N, SL=EN.SL, DENME=EN.DENME, DENFOE=EN.DENFOE, MAPROWS=EN.MAPROWS, ROCK=EN.ROCK, BUSH=EN.BUSH, BRIDGE=EN.BRIDGE, MARSH=EN.MARSH, OUTPOST=EN.OUTPOST;
var WATER=EN.WATER, TRAP=EN.TRAP, DEN=EN.DEN, ADJ=EN.ADJ, SQ=EN.SQ, HK=EN.HK;
var genMoves=EN.genMoves, movesFrom=EN.movesFrom, commit=EN.commit, effRank=EN.effRank, initialCells=EN.initialCells, setKeys=EN.setKeys, setClassic=EN.setClassic;
var engineSrc=makeEngine.toString();

/* ---------- Du lieu quan co ---------- */
function H(k,n,e,s,ep,br,t){return {k:k,n:n,e:e,s:s,ep:ep,br:br,t:t};}
var HEROES=[null,
 [H('rat','Chuột','🐭','Chít chít!','Thợ lặn','Bơi hồ · ăn Voi trên bờ',[
   ['g','Bơi qua hồ; quân trên bờ không ăn được Chuột.'],
   ['g','Trên bờ có thể ăn Voi.'],
   ['b','Bậc 1, dễ bị ăn; Cá sấu ăn được Chuột đang bơi.']])],
 [H('cat','Mèo','🐱','Meo!','Dân leo trèo','Trèo qua 1 quân kề bên',[
   ['g','Nhảy qua 1 quân kề bên, đáp xuống ô ngay sau.'],
   ['b','Không nhảy vào hồ/hang hoặc qua quân dưới nước.']]),
  H('fox','Cáo','🦊','Ăng ẳng!','Kẻ tinh quái','Nước rút 2 ô thẳng',[
   ['g','Lao thẳng 2 ô; ô giữa phải trống.'],
   ['b','Không lao vào hang; bậc 2 dễ bị ăn.']])],
 [H('wolf','Sói','🐺','Ú uuu!','Thủ lĩnh bầy','Có đồng đội kề: bậc 4',[
   ['g','Có đồng đội bậc ≥ 2 kề bên: lên bậc 4.'],
   ['b','Đi một mình: bậc 3.']]),
  H('boar','Lợn rừng','🐗','Ụt ịt!','Kẻ húc đầu','Sát hồ: bậc 4',[
   ['g','Đứng sát hồ: lên bậc 4.'],
   ['b','Rời hồ: bậc 3.']])],
 [H('dog','Chó','🐶','Gâu gâu!','Cún canh hang','Khu hang nhà: bậc 5 · khóa chiêu',[
   ['g','Ở vùng hang nhà: lên bậc 5.'],
   ['g','Khóa tuyệt kỹ của quân địch đứng kề.'],
   ['b','Ra khỏi vùng hang: bậc 4, hết khóa.']]),
  H('bear','Gấu','🐻','Gừ gừ!','Kẻ xâm lược','Sân địch: bậc 5',[
   ['g','Vào nửa sân địch: lên bậc 5.'],
   ['g','Không bị Chó khóa tuyệt kỹ.'],
   ['b','Ở nửa sân nhà: bậc 4.']])],
 [H('leo','Báo','🐆','Grừ!','Kẻ rình mồi','Đi chéo · ăn chéo bậc 6',[
   ['g','Đi chéo 1 ô.'],
   ['g','Khi ăn chéo: lên bậc 6, ăn được Hổ.'],
   ['b','Không đi chéo vào hồ hoặc hang.']]),
  H('croc','Cá sấu','🐊','Ngoạp!','Chúa đầm lầy','Lội hồ bậc 6 · bắt mồi',[
   ['g','Dưới hồ: bậc 6.'],
   ['g','Dưới nước, bắt quân bậc 1–4 trên bờ sát hồ mà không rời chỗ.'],
   ['g','Chặn đường Hổ nhảy hồ như Chuột.'],
   ['b','Không bắt mồi đang ẩn trong bụi/lau sậy.'],
   ['g','Đứng trên bờ vẫn ăn được Chuột đang bơi.'],
   ['b','Dưới hồ vẫn bị quân bằng hoặc cao bậc hơn tấn công.'],
   ['b','Lên cạn: bậc 3.']])],
 [H('tig','Hổ','🐯','Grào!','Chúa vồ mồi','Nhảy hồ · đáp xuống bậc 7',[
   ['g','Nhảy thẳng qua hồ; đáp xuống đạt bậc 7 và giữ đến khi Hổ tự đi tiếp.'],
   ['b','Bị chặn bởi Chuột/Cá sấu địch trên đường nhảy.']]),
  H('eagle','Đại bàng','🦅','Éc éc!','Chúa bầu trời','Bay qua hồ không bị chặn',[
   ['g','Bay qua hồ; Chuột/Cá sấu không chặn được.'],
   ['b','Đáp xuống bậc 6, không có bước thưởng.']])],
 [H('lio','Sư tử','🦁','Gầm!','Vua rừng xanh','Vồ xa 2 ô',[
   ['g','Vồ quân cách đúng 2 ô thẳng; ô giữa trống, không rời chỗ.'],
   ['b','Hồi chiêu 2 lượt; không nhảy hồ hay vồ quân trong bụi.']]),
  H('bison','Bò rừng','🦬','Ùm bò!','Xe húc','Lao 2 ô · húc đẩy lùi quân địch',[
   ['g','Lao thẳng 2 ô qua ô trống; có thể ăn quân bậc ≤ 7.'],
   ['g','Húc quân không thể ăn bằng Lao (chủ yếu là Voi): đẩy lùi 1 ô và làm choáng 1 lượt. Rùa miễn nhiễm.'],
   ['b','Lao hồi chiêu 1 lượt, Húc 2 lượt; hồi chiêu riêng. Không nhảy hồ/vồ xa; bị Chó khóa.']])],
 [H('ele','Voi','🐘','Pa-ôm!','Khối núi biết đi','Ăn mọi quân trừ Chuột',[
   ['g','Ăn mọi quân trừ Chuột.'],
   ['g','Vào bẫy địch vẫn giữ bậc 4.'],
   ['b','Chuột trên bờ ăn được Voi; Voi không ăn được Chuột.'],
   ['b','Không đi qua cầu gỗ hẹp.']])]
];
var H_MON=H('mon','Khỉ','🐒','Khẹc khẹc!','Kẻ tinh nghịch','Đổi chỗ với quân kề bên',[
   ['g','Đổi chỗ với 1 quân kề bên; quân vào bẫy chịu luật bẫy bình thường.'],
   ['b','Không có bậc, không ăn được quân khác.'],
   ['b','Hồi chiêu 1 lượt; không đổi quân dưới nước, vào hồ/hang. Bị Chó khóa.']]);
var H_TUR=H('tur','Rùa','🐢','Rùa rùa!','Tường thành','Mai cứng · không thể bị ăn',[
   ['g','Không thể bị ăn; miễn nhiễm Khỉ đổi chỗ và Bò rừng húc.'],
   ['g','Chặn đường, giữ cửa hang hoặc mép hồ.'],
   ['g','Đi 1 ô ngang/dọc như bình thường.'],
   ['b','Không ăn quân, không vào hang/hồ.'],
   ['b','Bên chỉ còn Rùa sẽ thua.']]);
var EXTRAS=[null,H_MON,H_TUR];
/* Cổ điển: không tuyệt kỹ */
var CH=[null,
 H('rat','Chuột','🐭','Chít chít!','Thợ lặn','Bơi hồ · hạ được Voi',[['g','Lội xuống hồ, bơi giữa hồ.'],['g','Hạ được Voi khi đứng trên bờ.'],['b','Bậc thấp nhất, hầu hết quân đều ăn được.']]),
 H('cat','Mèo','🐱','Meo!','Dân leo trèo','Bậc 2',[['g','Ăn được Chuột.'],['b','Bậc 2, dễ bị quân mạnh hơn ăn.']]),
 H('wolf','Sói','🐺','Ú uuu!','Thủ lĩnh bầy','Bậc 3',[['g','Bậc 3, ăn được Mèo/Chuột.'],['b','Thua Chó và quân bậc cao hơn.']]),
 H('dog','Chó','🐶','Gâu gâu!','Cún canh hang','Bậc 4',[['g','Bậc 4, ăn được quân bậc 1–3.'],['b','Thua Báo, Hổ, Sư tử, Voi.']]),
 H('leo','Báo','🐆','Grừ!','Kẻ rình mồi','Bậc 5',[['g','Bậc 5, ăn quân bậc thấp hơn.'],['b','Thua Hổ, Sư tử, Voi.']]),
 H('tig','Hổ','🐯','Grào!','Chúa vồ mồi','Nhảy qua hồ',[['g','Nhảy qua hồ nếu không có Chuột chắn giữa.'],['b','Thua Sư tử và Voi.']]),
 H('lio','Sư tử','🦁','Gầm!','Vua rừng xanh','Nhảy qua hồ',[['g','Nhảy qua hồ như Hổ.'],['g','Ăn mọi quân trừ Voi.'],['b','Không ăn được Voi.']]),
 H('ele','Voi','🐘','Pa-ôm!','Khối núi biết đi','Mạnh nhất, sợ Chuột',[['g','Bậc cao nhất, ăn được mọi quân trừ Chuột.'],['b','Sợ Chuột: Chuột đứng trên bờ ăn được Voi.'],['b','Sa bẫy cũng mất hết sức mạnh như mọi quân khác.']])
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
