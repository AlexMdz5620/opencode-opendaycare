"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { POSTS, type FeedPost } from "@/app/_data/mock";

interface FeedContextValue {
  posts: FeedPost[];
  addPost: (post: FeedPost) => void;
  isCreateOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;
}

const FeedContext = createContext<FeedContextValue | null>(null);

export function FeedProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<FeedPost[]>(POSTS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const addPost = useCallback((post: FeedPost) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  const openCreate = useCallback(() => setIsCreateOpen(true), []);
  const closeCreate = useCallback(() => setIsCreateOpen(false), []);

  const value = useMemo(
    () => ({ posts, addPost, isCreateOpen, openCreate, closeCreate }),
    [posts, addPost, isCreateOpen, openCreate, closeCreate],
  );

  return <FeedContext.Provider value={value}>{children}</FeedContext.Provider>;
}

export function useFeed(): FeedContextValue {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed must be used within FeedProvider");
  return ctx;
}
