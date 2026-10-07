export const buildUserName = (explicitName?: string | null, fallbackName?: string | null): string => {
  const trimmedExplicit = explicitName?.trim();
  if (trimmedExplicit) {
    return trimmedExplicit;
  }

  const trimmedFallback = fallbackName?.trim();
  if (trimmedFallback) {
    return trimmedFallback;
  }

  return 'user';
};
