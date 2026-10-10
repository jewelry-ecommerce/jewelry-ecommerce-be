# Database và phạm vi backend backup

NestJS modular monolith, một database PostgreSQL riêng. Không truy cập database công ty hoặc thay backend Java. ID entity là INTEGER identity, JSON là number. API adapter FE chuyển sang string khi component nguồn cần key; không đổi code/slug thành ID.

## DB thiết kế (30 bảng)
- accounts
- media_assets
- attributes
- attribute_values
- categories
- category_attributes
- products
- product_attributes
- product_attribute_values
- product_variations
- variation_values
- variation_media
- collections
- product_collections
- product_sets
- product_set_items
- set_item_variations
- reviews
- cms_pages
- cms_blocks
- banners
- banner_placements
- banner_placement_layouts
- banner_layout_items
- badge_templates
- badge_flows
- badge_flow_templates
- site_logos
- site_headers
- site_footer

## Quan hệ và rule
- Product thuộc category; collection là quan hệ nhiều-nhiều có thứ tự.
- Attribute/value cấu hình thật, gắn product và SKU. Một SKU chỉ có một value cho mỗi attribute.
- Media thuộc SKU; ảnh đại diện chỉ từ defaultVariationId, không tự fallback SKU khác.
- Default variation phải thuộc đúng product, có FK composite kiểm tra.
- Tiền lưu số nguyên VND; giá không âm và không vượt số nguyên an toàn JavaScript.
- Set item chọn product và tập SKU hợp lệ của chính product, có FK composite.
- Page không có CMS layout authoring. Block lưu toàn bộ config JSON + isVisible + sortOrder.
- Banner có placement, revision cấu hình và từng slot tọa độ/span. Chỉ một cấu hình ACTIVE trên placement.
- Badge template/flow riêng. Header/logo/footer riêng, giữ field trong form nguồn.
- Không seed sản phẩm/page/banner mẫu. Dữ liệu mới phải được tạo từ admin.
- Soft delete cho dữ liệu nghiệp vụ; key live unique. Account/role cần provision riêng trước thao tác admin.

## Triển khai
SQL migration: src/database/migrations/initial-schema.sql.
synchronize=false, migrationsRun=false. Migrate bằng npm run db:migrate sau khi xác nhận DB riêng.
Không tự rollback/drop database. Không phụ thuộc RabbitMQ/Redis/worker/service công ty.

## Hiện trạng
Đã thiết kế schema và tạo base NestJS/config/validation/Swagger/migration.
Đây CHƯA phải backend và FE integration hoàn chỉnh. Các domain controller/service/repository, auth, upload, form PIM/badge/header/footer và adapter FE đang tiếp tục thực hiện.
Docker Desktop chưa hoạt động khi kiểm tra; chưa tạo DB/container hoặc chạy server.

## Cấu hình chuyển máy
DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD qua .env; mật khẩu không commit.
PUBLIC_BASE_URL đổi theo máy chạy backend; uploads phải backup hoặc dùng storage riêng.
GitHub chỉ chứa code: DB và file upload không tự đi theo Git.
