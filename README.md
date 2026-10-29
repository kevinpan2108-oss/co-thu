# Cờ Thú (Jungle Chess) — mã nguồn và kiểm thử

Trò chơi Cờ Thú một file HTML, bàn 9×9, có AI 5 cấp (chạy trong Web Worker), chế độ Cổ điển / Chọn tướng / Thử thách, 2 người chơi, gợi ý và đi lại.

## Cấu trúc
- `src/engine.js` — toàn bộ luật: bản đồ, di chuyển, kỹ năng quân, bước thưởng tiền đồn (hồi 2 lượt), lặp thế, tìm kiếm AI (`makeEngine()`).
- `src/ui_a.js … ui_d.js` — giao diện: dữ liệu quân, vẽ bàn cờ, trạng thái/hiển thị, xử lý nước đi, AI worker, hoàn tác.
- `src/head.html`, `src/body.html` — CSS và khung HTML.
- `build.py` — ghép thành `dist/game.html` (bản phát hành) và `dist/game_local.html` (thêm hook `window.__E` để test).
- `dist/game.html` — bản đang chạy, mở trực tiếp bằng trình duyệt.
- `tests/` — kiểm thử.

## Chạy kiểm thử
```
python3 build.py
node tests/rules_real.js     # 144 bài kiểm luật với engine thật
node tests/t16.js            # 20 bài: hồi chiêu tiền đồn, thắng, hết nước đi (hòa)
node tests/terrain.js        # 104 kiểm tra tương tác địa hình (đầm lầy, sông, cầu, Cá sấu, Sư tử, ...), chạy cho cả hai phe
node tests/ai.js             # 6 kiểm tra chiến thuật AI + bất biến nước đi hợp lệ
node tests/outpost_ai.js     # 6 kiểm tra heuristic giữ/tiếp cận tiền đồn
node tests/bison.js          # 181 kiểm tra Bò rừng: húc mọi quân (trừ Rùa), hai hồi chiêu lao/húc độc lập, make/unmake, AI
node tests/outpost_compare.js 6 10 2026102807 120  # mô phỏng ghép cặp AI giữ tiền đồn
cd tests && npm i playwright && npx playwright install chromium
node pw11.js                 # 14 kiểm tra giao diện: bước thưởng, bỏ qua, hoàn tác, AI, hòa, thắng
node pw12.js                 # bot ngẫu nhiên chơi 3 ván qua giao diện + tải lại trang
node pw14.js                 # 11 kiểm tra hiển thị bậc hiệu lực (Sói, Lợn rừng, Chó, Gấu, Cá sấu)
node pw16.js                 # 13 kiểm tra giao diện Bò rừng: hộp chọn Lao/Húc, thông báo hồi chiêu, hoàn tác

# Mô phỏng (chậm, chạy nền): AI mới so AI cũ, và cân bằng 6 cặp quân
node match.js 20 150 7 [mask] [depth]   # mask AI thử nghiệm: 1 đe dọa, 2 đường vòng, 4 cầu/tiền đồn
node balance.js 2,3,4,5,6,7 8 100 501   # đổi phe, thống kê thắng/số nước/tuyến
```

## Luật chính (bản hiện tại)
- Bò rừng (bậc 7): **Lao** 2 ô thẳng (kind 8), hồi chiêu 1 lượt của phe mình. **Húc** (kind 9): quân địch bất kỳ trừ Rùa cách đúng 2 ô theo hàng thẳng; ô giữa trống (không phải nước/bụi/đầm lầy/hang) và ô ngay sau quân địch tồn tại, trống, không phải hồ/hang, hợp lệ với quân bị đẩy (Voi không lên cầu gỗ hẹp; Chuột/Cá sấu không bị đẩy vào đầm lầy). Bò rừng tiến vào ô giữa, quân địch lùi 1 ô, không ai bị ăn; vào bẫy phe Bò rừng thì áp dụng luật bẫy hiện có (Voi còn bậc 4). Húc hồi chiêu 2 lượt của phe mình. Hai bộ đếm độc lập, cùng giảm mỗi khi phe mình đi một nước. Bị Chó khóa; không dùng ở chế độ Cổ điển.
- Thắng: đưa quân vào hang địch, hoặc ăn hết quân chiến đấu của địch (chỉ còn Rùa là thua). Hết nước đi hoặc chỉ còn nước bị cấm do lặp thế = hòa.
- Bản đồ: sông giữa bàn (cầu hẹp Voi không qua được, bãi cạn giữa), đầm lầy bên phải đi được, rừng bụi/đá bên trái. Hổ/Đại bàng chỉ nhảy qua nước thật; Cáo/Sư tử/Bò rừng không lao/vồ xuyên đầm lầy; quân trong đầm lầy miễn nhiễm Sư tử vồ và Cá sấu phục kích.
- Tiền đồn (3,1) và (5,1): chiếm ô thì được đi thêm 1 ô thường trong cùng lượt (không ăn quân, không vào hang, không cộng dồn); sau khi nhận, phe đó hồi 2 lượt của mình; hai phe hồi riêng; bỏ qua thì không bị hồi.
- Nước đi mã hóa: `from | to<<7 | kind<<14`, nước kép thêm `bf<<18 | bt<<25`. Ô trạng thái sau 81 ô (`ST=12`): `SL+0/1` hổ, `+2/3` hồi chiêu Sư tử, `+4/5` hồi chiêu **lao** Bò rừng, `+6/7` Khỉ, `+8/9` tiền đồn, `+10/11` hồi chiêu **húc** Bò rừng (chỉ số chẵn = phe dưới, lẻ = phe trên).
