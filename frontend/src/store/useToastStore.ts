import { create } from 'zustand';
import type { ToastType } from '../components/Toast';

interface ToastState {
  message: string | null;
  type: ToastType | null;
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  message: null,
  type: null,
  showToast: (message, type) => set({ message, type }),
  hideToast: () => set({ message: null, type: null }),
}));
