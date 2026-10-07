export const normalizeResetEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

export const buildPasswordResetMessage = (email: string): string => {
  const normalizedEmail = normalizeResetEmail(email);
  return `A password reset link was sent to ${normalizedEmail}. Please open the email and choose a new password.`;
};
