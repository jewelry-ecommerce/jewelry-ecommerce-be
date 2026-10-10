import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { AUTH_POLICY } from './auth.constants';
export function hashPassword(password: string): string {
  const salt = randomBytes(AUTH_POLICY.saltBytes).toString('hex');
  const digest = scryptSync(password, salt, AUTH_POLICY.passwordHashBytes).toString('hex');
  return [AUTH_POLICY.passwordFormat, salt, digest].join(':');
}
export function verifyPassword(password: string, stored: string): boolean {
  const [format, salt, encoded] = stored.split(':');
  if (format !== AUTH_POLICY.passwordFormat || !salt || !encoded) return false;
  const actual = scryptSync(password, salt, AUTH_POLICY.passwordHashBytes);
  const expected = Buffer.from(encoded, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
