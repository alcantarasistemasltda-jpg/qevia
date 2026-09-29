"use client";

import { useSyncExternalStore, useCallback } from "react";

const STORAGE_KEY = "qevia_hide_values";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("qevia_privacy_change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("qevia_privacy_change", callback);
  };
}

function getSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function getServerSnapshot(): boolean {
  return false;
}

export function useHideValues() {
  const isHidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleHideValues = useCallback(() => {
    const current = localStorage.getItem(STORAGE_KEY) === "true";
    const next = !current;
    localStorage.setItem(STORAGE_KEY, String(next));
    window.dispatchEvent(new Event("qevia_privacy_change"));
  }, []);

  return { isHidden, toggleHideValues };
}
