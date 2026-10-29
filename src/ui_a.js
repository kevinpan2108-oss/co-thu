var EN=makeEngine();
var COLS=EN.COLS, ROWS=EN.ROWS, N=EN.N, SL=EN.SL, DENME=EN.DENME, DENFOE=EN.DENFOE, MAPROWS=EN.MAPROWS, ROCK=EN.ROCK, BUSH=EN.BUSH, BRIDGE=EN.BRIDGE, MARSH=EN.MARSH, OUTPOST=EN.OUTPOST;
var WATER=EN.WATER, TRAP=EN.TRAP, DEN=EN.DEN, ADJ=EN.ADJ, SQ=EN.SQ, HK=EN.HK;
var genMoves=EN.genMoves, movesFrom=EN.movesFrom, commit=EN.commit, effRank=EN.effRank, initialCells=EN.initialCells, setKeys=EN.setKeys, setClassic=EN.setClassic;
var engineSrc=makeEngine.toString();

/* ---------- Du lieu quan co ---------- */
function H(k,n,e,s,ep,br,t){return {k:k,n:n,e:e,s:s,ep:ep,br:br,t:t};}
var HEROES=[null,
 [H('rat','Chuột','🐭','Chít chít!','Thợ lặn','Bơi hồ · ăn Voi trên bờ',[
   ['g','Bơi trong hồ, quân trên bờ không ăn được.'],
   ['g','Đứng trên bờ ăn được Voi.'],
   ['b','Bậc 1, dễ bị ăn. Cá sấu ăn được khi Chuột đang bơi.']])],
 [H('cat','Mèo','🐱','Meo!','Dân leo trèo','Trèo qua 1 quân kề bên',[
   ['g','Trèo qua 1 quân kề bên (của bất kỳ phe), đáp xuống ô thẳng ngay sau. Ô đáp trống hoặc có quân địch ăn được thì ăn.'],
   ['b','Không trèo xuống hồ, vào hang, hay qua quân dưới nước.']]),
  H('fox','Cáo','🦊','Ăng ẳng!','Kẻ tinh quái','Nước rút 2 ô thẳng',[
   ['g','Nước rút 2 ô thẳng: ô giữa trống, ô đáp trống hoặc có quân địch ăn được.'],
   ['b','Không vào hang bằng nước rút. Bậc 2 mỏng manh.']])],
 [H('wolf','Sói','🐺','Ú uuu!','Thủ lĩnh bầy','Có đồng đội kề: bậc 4',[
   ['g','Có đồng đội bậc ≥ 2 đứng kề bên thì lên bậc 4.'],
   ['b','Đi lẻ chỉ bậc 3.']]),
  H('boar','Lợn rừng','🐗','Ụt ịt!','Kẻ húc đầu','Sát hồ: bậc 4',[
   ['g','Đứng sát hồ (kề mép nước) thì lên bậc 4.'],
   ['b','Rời hồ còn bậc 3.']])],
 [H('dog','Chó','🐶','Gâu gâu!','Cún canh hang','Khu hang nhà: bậc 5 · khóa chiêu',[
   ['g','Trong khu hang nhà thì lên bậc 5.'],
   ['g','Khi ở khu hang, quân địch kề bên chỉ được bước thường.'],
   ['b','Ra khỏi khu hang: bậc 4 và hết khóa.']]),
  H('bear','Gấu','🐻','Gừ gừ!','Kẻ xâm lược','Sân địch: bậc 5',[
   ['g','Vào nửa sân địch thì lên bậc 5.'],
   ['g','Không bị Chó khóa chiêu.'],
   ['b','Ở nửa sân nhà bậc 4.']])],
 [H('leo','Báo','🐆','Grừ!','Kẻ rình mồi','Đi chéo · ăn chéo bậc 6',[
   ['g','Đi thêm 1 ô theo 4 đường chéo.'],
   ['g','Khi ăn bằng nước đi chéo thì bậc 6 (ăn được Hổ).'],
   ['b','Không đi chéo xuống hồ hay vào hang.']]),
  H('croc','Cá sấu','🐊','Ngoạp!','Chúa đầm lầy','Lội hồ bậc 6 · bắt mồi',[
   ['g','Lội hồ, bậc 6 dưới nước.'],
   ['g','Bắt mồi: khi đang dưới nước, ăn quân địch bậc 1-4 đứng trên bờ sát ô nước của mình, không rời chỗ. Không hồi chiêu.'],
   ['g','Chặn Hổ nhảy hồ như Chuột.'],
   ['b','Không rình được quân đang đứng trong bụi hoặc lau sậy.'],
   ['g','Đứng trên bờ vẫn xuống hồ ăn được Chuột đang bơi.'],
   ['b','Khi dưới hồ vẫn bị các quân bằng hoặc lớn bậc hơn tấn công.'],
   ['b','Lên cạn còn bậc 3.']])],
 [H('tig','Hổ','🐯','Grào!','Chúa vồ mồi','Nhảy hồ · đáp xuống bậc 7',[
   ['g','Nhảy qua hồ theo hàng thẳng đến bờ đối diện, đáp xuống bậc 7. Giữ bậc 7 cho đến khi chính Hổ di chuyển lần tiếp theo; di chuyển quân khác không làm mất hiệu ứng.'],
   ['b','Bị chặn nếu có Chuột hoặc Cá sấu địch dưới nước trên đường nhảy.']]),
  H('eagle','Đại bàng','🦅','Éc éc!','Chúa bầu trời','Bay qua hồ không bị chặn',[
   ['g','Bay qua hồ theo hàng thẳng, Chuột hay Cá sấu không chặn được.'],
   ['b','Đáp xuống vẫn bậc 6, không bonus.']])],
 [H('lio','Sư tử','🦁','Gầm!','Vua rừng xanh','Vồ xa 2 ô',[
   ['g','Vồ xa: ăn quân địch cách đúng 2 ô theo hàng thẳng (ô giữa trống, không phải mặt hồ), không rời chỗ.'],
   ['b','Sau khi vồ, 2 lượt kế không vồ được. Không nhảy hồ. Không vồ được quân đang đứng trong bụi.']]),
  H('bison','Bò rừng','🦬','Ùm bò!','Xe húc','Lao 2 ô · húc Voi vào bẫy',[
   ['g','Lao: đi thẳng 2 ô qua ô trống. Ô đáp trống hoặc có quân địch ăn được (bậc ≤ 7) thì ăn. Bậc vẫn 7 khi lao.'],
   ['g','Húc Voi vào bẫy: Voi địch cách đúng 2 ô theo hàng thẳng, ô giữa trống, ô phía sau Voi là bẫy phe mình đang trống. Bò rừng bước vào ô giữa và đẩy Voi vào bẫy, Voi còn bậc 4. Tính là 1 nước, không đẩy vào hang hay xuống hồ.'],
   ['b','Lao hoặc húc xong lượt kế không lao tiếp. Không nhảy hồ, không vồ xa. Bị Chó khóa.']])],
 [H('ele','Voi','🐘','Pa-ôm!','Khối núi biết đi','Ăn mọi quân trừ Chuột',[
   ['g','Ăn được mọi quân trừ Chuột.'],
   ['g','Da dày: vào bẫy địch chỉ còn bậc 4 (không về 0).'],
   ['b','Chuột trên bờ ăn được Voi. Voi không ăn được Chuột.'],
   ['b','Quá nặng: không bước lên cầu gỗ hẹp. Qua sông bằng bãi cạn ở giữa.']])]
];
var H_MON=H('mon','Khỉ','🐒','Khẹc khẹc!','Kẻ tinh nghịch','Đổi chỗ với quân kề bên',[
   ['g','Đổi chỗ: hoán đổi vị trí với 1 quân kề bên, đồng đội hay địch đều được. Quân bị đổi vào bẫy thì áp dụng luật bẫy bình thường (địch vào bẫy phe Khỉ về bậc 0, Voi còn 4).'],
   ['b','Không có bậc: không ăn được ai, ai cũng ăn được Khỉ.'],
   ['b','Hồi chiêu 1 lượt. Không đổi với quân dưới nước, không đổi vào hồ hay hang. Bị Chó khóa chiêu.']]);
var H_TUR=H('tur','Rùa','🐢','Rùa rùa!','Tường thành','Mai cứng · không thể bị ăn',[
   ['g','Mai cứng: không thể bị ăn, kể cả Chuột, kể cả khi đứng trong bẫy. Không bị Khỉ đổi chỗ hay Bò rừng húc.'],
   ['g','Làm tường chặn đường, giữ chốt cửa hang hoặc mép hồ.'],
   ['g','Rùa vẫn đi một ô ngang hoặc dọc như quân thông thường.'],
   ['b','Không ăn được ai, không vào hang, không xuống hồ.'],
   ['b','Nếu bên nào chỉ còn Rùa thì bên đó thua ngay, bất kể Rùa đang đứng ở đâu.']]);
var EXTRAS=[null,H_MON,H_TUR];
/* Cổ điển: không tuyệt kỹ */
var CH=[null,
 H('rat','Chuột','🐭','Chít chít!','Thợ lặn','Bơi hồ · hạ được Voi',[['g','Lội xuống hồ, bơi giữa hồ.'],['g','Hạ được Voi khi đứng trên bờ.'],['b','Bậc thấp nhất, hầu hết quân đều ăn được.']]),
 H('cat','Mèo','🐱','Meo!','Dân leo trèo','Bậc 2',[['g','Nhỏ gọn, ăn được Chuột.'],['b','Chỉ có bậc 2, dễ bị mọi quân lớn hơn ăn.']]),
 H('wolf','Sói','🐺','Ú uuu!','Thủ lĩnh bầy','Bậc 3',[['g','Bậc 3, ăn được Mèo và Chuột.'],['b','Thua Chó và mọi quân phía trên.']]),
 H('dog','Chó','🐶','Gâu gâu!','Cún canh hang','Bậc 4',[['g','Bậc 4, ăn được Sói, Mèo và Chuột.'],['b','Thua Báo, Hổ, Sư tử và Voi.']]),
 H('leo','Báo','🐆','Grừ!','Kẻ rình mồi','Bậc 5',[['g','Bậc 5, ăn được Chó, Sói, Mèo và Chuột.'],['b','Thua Hổ, Sư tử và Voi.']]),
 H('tig','Hổ','🐯','Grào!','Chúa vồ mồi','Nhảy qua hồ',[['g','Nhảy qua hồ theo hàng ngang hoặc dọc, miễn không có Chuột chắn giữa.'],['b','Thua Sư tử và Voi.']]),
 H('lio','Sư tử','🦁','Gầm!','Vua rừng xanh','Nhảy qua hồ',[['g','Nhảy qua hồ như Hổ.'],['g','Ăn được mọi quân trừ Voi.'],['b','Thua Voi.']]),
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
