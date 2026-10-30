/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';

export interface FormDraftResult<T> {
  draft: T;
  setDraft: React.Dispatch<React.SetStateAction<T>>;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  clearDraft: () => void;
  hasSavedDraft: boolean;
  lastSavedAt: string | null;
}

/**
 * Persists any form state in localStorage automatically until the user
 * explicitly cancels (discards) or saves/submits the form.
 */
export function useFormDraft<T>(draftKey: string, initialValue: T): FormDraftResult<T> {
  const storageKey = `sportswear_erp_draft_${draftKey}`;

  const [hasSavedDraft, setHasSavedDraft] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(storageKey));
    } catch {
      return false;
    }
  });

  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [draft, setDraft] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialValue, ...parsed };
      }
    } catch (e) {
      console.warn('Error loading form draft:', e);
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setHasSavedDraft(true);
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.warn('Error saving form draft:', e);
    }
  }, [draft, storageKey]);

  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasSavedDraft(false);
      setLastSavedAt(null);
      setDraft(initialValue);
    } catch (e) {
      console.warn('Error clearing draft:', e);
    }
  }, [storageKey, initialValue]);

  return {
    draft,
    setDraft,
    updateField,
    clearDraft,
    hasSavedDraft,
    lastSavedAt,
  };
}
