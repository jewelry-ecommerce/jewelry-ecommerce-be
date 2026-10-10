# Jewelry Commerce BE

NestJS modular monolith riêng cho đồ án. Không dùng DB Java hoặc DB công ty.
Cấu trúc: adapters (controller/DTO), application/domain (nghiệp vụ), infrastructure (repository/migration).
ID entity là number. PostgreSQL private port 5433, backend port 8083.

## Trạng thái hiện tại

DB schema và base NestJS đã tạo. Module nghiệp vụ và tích hợp FE chưa hoàn tất.
Không xem health ok hoặc build ok là toàn flow demo đã xong.
Xem docs/DATABASE.md để biết bảng/quan hệ và rule.

## Chuẩn bị riêng trên máy

1. Mở Docker Desktop.
2. Cấu hình .env từ .env.example (không commit mật khẩu).
3. docker compose up -d postgres
4. npm install
5. npm run db:migrate
6. npm run start

Swagger: http://localhost:8083/api-reference
Health: http://localhost:8083/api/v1/health (liveness, không kiểm chứng DB).
Không dùng docker compose down -v: thao tác đó xóa dữ liệu volume.

## Kiểm tra

npm run build
npm run check
npm test

Migration không auto-sync/drop và rollback destructive bị vô hiệu.
Test schema/config là kiểm thử tĩnh/unit; chỉ ghi nhận DB thật sau khi migration trên PostgreSQL riêng thành công.

## Chuyển máy

Clone code, tạo .env riêng, cài dependencies.
Nếu DB chạy local trên máy này, phải backup/restore DB qua máy mới; localhost không trỏ sang máy cũ.
Ảnh upload cần chuyển cùng thư mục uploads hoặc chuyển sang object storage riêng.
Chưa có tác vụ publish GitHub trong lượt này.
