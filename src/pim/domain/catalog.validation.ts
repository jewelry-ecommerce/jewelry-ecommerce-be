import { BadRequestException } from '@nestjs/common';
import type { CatalogRecord, CatalogResource, CatalogWriteInput } from './catalog.interface';
export function slugify(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
export function validateParent(records: CatalogRecord[], currentId: number | undefined, parentId: number | null | undefined): void {
  const visited = new Set<number>();
  let cursor = parentId;
  while (cursor !== null && cursor !== undefined) {
    if (cursor === currentId || visited.has(cursor)) throw invalid('CATEGORY_CYCLE', 'Danh mục không được tạo vòng lặp.');
    visited.add(cursor);
    const parent = records.find(record => record.id === cursor);
    if (!parent) throw invalid('CATEGORY_PARENT_NOT_FOUND', 'Danh mục cha không tồn tại.');
    cursor = parent.parentId;
  }
}
export function validateCatalogInput(resource: CatalogResource, input: CatalogWriteInput): void {
  if (resource !== 'collections' && !input.code?.trim()) throw invalid('CATALOG_CODE_REQUIRED', 'Mã không được để trống.');
  if (resource === 'attributes' && !input.displayType) throw invalid('ATTRIBUTE_DISPLAY_REQUIRED', 'Chọn kiểu hiển thị thuộc tính.');
  const codes = (input.values ?? []).map(value => value.code.trim().toLowerCase());
  if (new Set(codes).size !== codes.length) throw invalid('ATTRIBUTE_VALUE_DUPLICATE', 'Mã giá trị thuộc tính bị trùng.');
  if (resource !== 'attributes' && !slugify(input.slug || input.name)) throw invalid('CATALOG_SLUG_INVALID', 'Tên/đường dẫn không hợp lệ.');
}
function invalid(code: string, message: string): BadRequestException {
  return new BadRequestException({ code, message });
}
