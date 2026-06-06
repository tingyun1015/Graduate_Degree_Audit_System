import { create } from 'zustand';
import type { DepartmentInfo } from '../types';

interface AdminState {
  activeDepartment: DepartmentInfo | null;
  setActiveDepartment: (dept: DepartmentInfo) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  activeDepartment: null,
  setActiveDepartment: (dept) => set({ activeDepartment: dept }),
}));
