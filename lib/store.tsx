import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { initialBoards, initialReports, ME, type Board, type Report } from './analytics';

// 화면 사이에 공유하는 프로토타입 상태 (새로고침하면 처음 값으로 돌아감).
type Toast = { id: number; text: string };

type Store = {
  boards: Board[];
  reports: Report[];
  createBoard: () => Board;
  renameBoard: (id: string, name: string | null) => void;
  deleteBoard: (id: string) => void;
  renameReport: (id: string, name: string | null) => void;
  deleteReport: (id: string) => void;
  toasts: Toast[];
  toast: (text: string) => void;
  dismissToast: (id: number) => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [boards, setBoards] = useState(initialBoards);
  const [reports, setReports] = useState(initialReports);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const toast = useCallback((text: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const now = () => new Date().toISOString();

  const createBoard = useCallback(() => {
    const b: Board = { id: `b-${Date.now().toString(36)}`, name: null, createdBy: ME, createdAt: now(), updatedAt: now(), reportsCount: 0 };
    setBoards((list) => [b, ...list]);
    return b;
  }, []);

  const renameBoard = useCallback((id: string, name: string | null) => {
    setBoards((list) => list.map((b) => (b.id === id ? { ...b, name, updatedAt: now() } : b)));
  }, []);

  const deleteBoard = useCallback((id: string) => {
    setBoards((list) => list.filter((b) => b.id !== id));
    setReports((list) => list.filter((r) => r.boardId !== id));
  }, []);

  const renameReport = useCallback((id: string, name: string | null) => {
    setReports((list) => list.map((r) => (r.id === id ? { ...r, name, updatedAt: now() } : r)));
  }, []);

  const deleteReport = useCallback((id: string) => {
    setReports((list) => {
      const target = list.find((r) => r.id === id);
      if (target) setBoards((bs) => bs.map((b) => (b.id === target.boardId ? { ...b, reportsCount: Math.max(b.reportsCount - 1, 0) } : b)));
      return list.filter((r) => r.id !== id);
    });
  }, []);

  const value = useMemo(
    () => ({ boards, reports, createBoard, renameBoard, deleteBoard, renameReport, deleteReport, toasts, toast, dismissToast }),
    [boards, reports, createBoard, renameBoard, deleteBoard, renameReport, deleteReport, toasts, toast, dismissToast],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider 밖에서 useStore 사용');
  return s;
}
