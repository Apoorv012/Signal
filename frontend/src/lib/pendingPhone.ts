const KEY = "signal-pending-phone";

/**
 * The number being verified is kept in sessionStorage instead of the URL, so it does not end up in
 * browser history or referrers. It survives a reload of the verify page but not a new tab.
 */
export const savePendingPhone = (phone: string): void => {
  try {
    sessionStorage.setItem(KEY, phone);
  } catch {
    /* storage blocked: the verify page will send the user back to register */
  }
};

export const readPendingPhone = (): string | null => {
  try {
    return sessionStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export const clearPendingPhone = (): void => {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
};
