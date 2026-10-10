export enum AccountRole {
  ADMIN = 'ADMIN', CATALOG_MANAGER = 'CATALOG_MANAGER', ORDER_MANAGER = 'ORDER_MANAGER', VIEWER = 'VIEWER',
}
export const AUTH_POLICY = {
  algorithm: 'HS256' as const, issuer: 'jewelry-commerce-be', audience: 'jewelry-commerce-admin',
  tokenLifetimeSeconds: 3600, saltBytes: 16, passwordHashBytes: 64, minimumSecretLength: 32,
  activeStatus: 'ACTIVE', passwordFormat: 'scrypt-v1', allowedRoles: Object.values(AccountRole),
} as const;
