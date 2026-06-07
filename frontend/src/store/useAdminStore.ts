import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DepartmentInfo } from '../types';

interface AdminState {
  activeDepartment: DepartmentInfo | null;
  setActiveDepartment: (dept: DepartmentInfo) => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      activeDepartment: null,
      setActiveDepartment: (dept) => set({ activeDepartment: dept }),
    }),
    {
      name: 'admin-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
