export interface AlertPreferences {
  commitments: {
    dueSoon: boolean; // 3 days, 1 day, today
    overdue: boolean; // Overdue commitments
  };
  creditCards: {
    invoiceDue: boolean; // Invoice due soon / today
    invoiceClosing: boolean; // Invoice closing soon
    invoiceOverdue: boolean; // Invoice overdue
    highLimitUsage: boolean; // Limit consumption >= 50%, 70%, 80%, 90%, 100%
  };
  budgets: {
    approachingLimit: boolean; // >= threshold%
    exceeded: boolean; // > 100%
  };
  accounts: {
    lowBalance: boolean; // Below account minimum threshold
  };
  accountMinBalances: Record<string, number>; // accountId -> min balance amount (e.g. 500)
}

export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  commitments: {
    dueSoon: true,
    overdue: true,
  },
  creditCards: {
    invoiceDue: true,
    invoiceClosing: true,
    invoiceOverdue: true,
    highLimitUsage: true,
  },
  budgets: {
    approachingLimit: true,
    exceeded: true,
  },
  accounts: {
    lowBalance: true,
  },
  accountMinBalances: {},
};

const STORAGE_KEY_PREFIX = "qevia_alert_prefs_";

export class AlertSettingsService {
  static getPreferences(userId: string): AlertPreferences {
    if (typeof window === "undefined") return DEFAULT_ALERT_PREFERENCES;
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
      if (!stored) return DEFAULT_ALERT_PREFERENCES;
      const parsed = JSON.parse(stored);
      return {
        commitments: { ...DEFAULT_ALERT_PREFERENCES.commitments, ...parsed.commitments },
        creditCards: { ...DEFAULT_ALERT_PREFERENCES.creditCards, ...parsed.creditCards },
        budgets: { ...DEFAULT_ALERT_PREFERENCES.budgets, ...parsed.budgets },
        accounts: { ...DEFAULT_ALERT_PREFERENCES.accounts, ...parsed.accounts },
        accountMinBalances: { ...DEFAULT_ALERT_PREFERENCES.accountMinBalances, ...parsed.accountMinBalances },
      };
    } catch {
      return DEFAULT_ALERT_PREFERENCES;
    }
  }

  static savePreferences(userId: string, prefs: AlertPreferences): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(prefs));
    } catch {
      // Ignore write errors in restricted environments
    }
  }

  static setAccountMinBalance(userId: string, accountId: string, minBalance: number): void {
    const current = this.getPreferences(userId);
    current.accountMinBalances[accountId] = minBalance;
    this.savePreferences(userId, current);
  }
}
