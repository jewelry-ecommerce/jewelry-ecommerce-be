# Tiến độ backend backup — 10/10/2026

## Môi trường

- NestJS modular monolith, PostgreSQL Docker riêng `127.0.0.1:5433`.
- Database `jewelry_commerce`; kiểm thử dùng `jewelry_commerce_test`.
- Entity ID là number. UI có thể dùng key string nhưng adapter chuyển về number khi gửi BE.
- Không seed sản phẩm, trang, banner hoặc nhãn kinh doanh.
- Không dùng DB công ty/DB Java, không commit/push, không mở dev server.

## Đã triển khai

- JWT admin, phân quyền đọc/ghi, provision tài khoản vận hành từ cấu hình riêng.
- PIM: thuộc tính/giá trị, danh mục dạng cây, collection, sản phẩm/SKU, draft → publish trực tiếp.
- Admin PIM đã port các trang danh sách/tạo/sửa sản phẩm, danh mục, collection, thuộc tính từ source UI hiện có.
- Bộ chọn SKU: API có tìm kiếm, phân trang, scope danh mục/collection, tồn khả dụng thực; adapter FE dùng number IDs.
- CMS: page draft rỗng, lưu/sắp xếp block, publish, revision kiểm soát xung đột.
- Banner: placement, banner, layout/slot, render các loại; admin có HTTP adapter.
- Upload ảnh local PNG/JPEG/GIF/WEBP; không có worker.
- Mẫu nhãn: CRUD/status; UI thư viện/tạo/xem/sửa đã port và nối HTTP.
- Cấu hình nhãn: BE CRUD, scope SKU/danh mục/collection/toàn bộ/hết hàng, một mẫu mỗi cấu hình.
- API client nhãn nhận skuIds, lấy tồn từ DB, chọn một nhãn theo PRE_ORDER → OUT_OF_STOCK → CAMPAIGN.
- Chặn xóa mẫu đang có cấu hình tham chiếu trong cùng transaction/khóa DB.
- Adapter admin cấu hình nhãn chuyển cả ID lồng nhau sang number, không đổi priority/count.
- Client CMS/banner/carousel, danh sách sản phẩm, chi tiết, chọn SKU và nhãn có adapter backend.
- Thứ tự thuộc tính PDP lấy sort_order đã lưu, không lấy ID làm thứ tự.

## Chưa hoàn tất — chưa coi là demo end-to-end sẵn sàng

1. Form/list cấu hình nhãn trên admin chưa nối xong với adapter mới.
2. Header/footer, đánh giá và set sản phẩm mới có schema; chưa đủ module/UI tích hợp.
3. Chưa có thao tác nhập tồn cơ bản hoàn chỉnh trên admin; sản phẩm mới mặc định tồn 0.
4. Chưa bật HTTP trong env FE, chưa provision tài khoản vận hành thật.
5. Chưa kiểm tra thao tác trình duyệt admin → publish → client; build/test không thay thế kiểm tra này.
6. Cart/auth khách hàng/checkout/orders còn flow mock; không coi SKU DB đã mua hàng end-to-end được.
7. Bộ lọc sản phẩm nâng cao/import-export và cấu hình theo promotion chưa hoàn thiện.
8. SVG/video chưa hỗ trợ upload.
9. Còn cảnh báo hooks/chunk và cần tách một số component gốc dài để đạt giới hạn 40 dòng/hàm.
10. Badge PRE_ORDER hiện là ưu tiên hiển thị; không có nghĩa module đơn đặt trước đã hoàn tất.
11. Category badge scope hiện khớp category đã chọn trực tiếp; chưa tự bao gồm mọi danh mục con.
12. Swagger chưa mô tả đầy đủ mọi schema/query/response để coi là contract bàn giao hoàn chỉnh.

## Kiểm chứng

- Backend build và unit tests đã qua; cần giữ kết quả kiểm thử mới nhất sau mỗi sửa.
- PostgreSQL HTTP integration: auth → PIM draft/publish/collection → bộ chọn SKU → nhãn → banner → CMS; dữ liệu test được dọn theo tag.
- Admin production build đã qua, còn 5 cảnh báo hook và cảnh báo chunk.
- Client production build đã qua, còn cảnh báo hook.
- 9 tests adapter content client đã qua; 2 tests mapper cấu hình nhãn admin đã qua.
- Không khẳng định UI giống 100% khi chưa kiểm tra trực quan.

## Lệnh

- `npm test`: build và unit tests backend.
- `npm run test:integration`: server kiểm thử tạm tự đóng, DB Docker riêng.
- `npm run admin:provision`: tạo operator bằng PROVISION_ADMIN_* trong .env, không seed kinh doanh.
- Không chạy `docker compose down -v`.
