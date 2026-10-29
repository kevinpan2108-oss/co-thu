# Thí nghiệm Cá sấu / Tiền đồn (nhánh `exp/croc-outpost`)

Mặc định MỌI thí nghiệm TẮT (CROCLAND=3, OUTMODE=0, AI2=0, FIXNOISE=false). Bản phát hành (`dist/`, artifact v7) không bị đụng tới.
Bật thử: build `OUT=dist_exp python3 build.py`, mở `?outpost=control&croc=4&ai=8`.

## Cách tái lập
- Luật: `node tests/rules_real.js | t16 | terrain | ai | outpost_ctl` ; UI: `node tests/pw15.js` (dist_exp)
- AI: `node tests/ai_tactics.js` (cần `FIXNOISE=1` mới đạt)
- Cá sấu: `FIXNOISE=1 node tests/croc_study.js <3|4> 40 5 duel 11`
- Tiền đồn: `FIXNOISE=1 node tests/outpost_compare.js <0|1> 25 5 31 [mask]`

## Kết quả (mô phỏng AI, độ sâu 5, seed cố định, đổi bên)
Cá sấu hạng 3 (A) vs 4 (B) trên đất, 80 ván mỗi biến thể, điểm thắng=1 hòa=0.5:
| AI | Biến thể | T/H/B | Điểm |
|---|---|---|---|
| mặc định | A | 13/15/52 | 25.6% |
| mặc định | B | 15/18/47 | 30.0% |
| đã sửa nhiễu | A | 6/49/25 | 38.1% |
| đã sửa nhiễu | B | 2/59/19 | 39.4% |
Chênh lệch không có ý nghĩa thống kê; AI sửa nhiễu để cá sấu ở dưới nước ~90% số nước. Báo Gấm (leopard) là kẻ giết cá sấu trên đất chính (land:leo).

Tiền đồn cũ (cooldown) vs mới (kiểm soát), 50 ván:
| AI | Luật | T/H/B(dưới) | TB nước | Làn trái | Mất tiền đồn |
|---|---|---|---|---|---|
| mặc định | cũ | 18/19/13 | 97.7 | 226 | 15 |
| mặc định | mới | 18/8/24 | 84.4 | 93 | 2 |
| đã sửa | cũ | 6/39/5 | 132.1 | 229 | 2 |
| đã sửa | mới | 6/35/9 | 132.1 | 142 | 4 |

## Lỗi tìm thấy
- Luật: cá sấu trong đầm lầy không bị bắn tỉa nhất quán (đã sửa, có test).
- AI: nhiễu gốc cộng vào cận alpha làm bỏ lỡ nước thắng/ăn rõ ràng (`FIXNOISE`, thử nghiệm: 0 lỡ, 58–0–22 vs AI cũ ở độ sâu 4). Nên xét tách riêng.

## Khuyến nghị
Giữ hạng 3 của cá sấu; giữ luật tiền đồn cũ; đề xuất tách bản sửa nhiễu AI để review. Cơ chế kiểm soát chưa tăng tranh chấp và giảm dùng làn trái.
