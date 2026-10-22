"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

interface FeedContextValue {
  isCreateOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
}

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const openCreate = useCallback(() => setIsCreateOpen(true), []);
  const closeCreate = useCallback(() => setIsCreateOpen(false), []);

  const value = useMemo(
    () => ({ isCreateOpen, openCreate, closeCreate }),
    [isCreateOpen, openCreate, closeCreate],
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed(): FeedContextValue {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed must be used within FeedProvider");
  return ctx;
}
