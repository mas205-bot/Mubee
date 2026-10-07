export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function isOtpExpired(createdAt: number, ttlMs = 5 * 60 * 1000): boolean {
  return Date.now() - createdAt > ttlMs;
}
