import { create } from 'zustand';
import type { Comic, Panel, PanelStatus } from '@/types/database';

interface State {
  activeComic: Comic | null;
  panels: Panel[];
  progress: { generated: number; total: number };
  isGenerating: boolean;
  setActiveComic: (c: Comic | null) => void;
  setPanels: (p: Panel[]) => void;
  updatePanelStatus: (panelId: string, status: PanelStatus, imageUrl?: string) => void;
  setProgress: (p: { generated: number; total: number }) => void;
  setGenerating: (g: boolean) => void;
}

export const useComicStore = create<State>((set) => ({
  activeComic: null,
  panels: [],
  progress: { generated: 0, total: 0 },
  isGenerating: false,
  setActiveComic: (c) => set({ activeComic: c }),
  setPanels: (panels) => set({ panels }),
  updatePanelStatus: (panelId, status, imageUrl) =>
    set((state) => ({
      panels: state.panels.map((p) =>
        p.id === panelId ? { ...p, status, image_url: imageUrl ?? p.image_url } : p
      ),
    })),
  setProgress: (progress) => set({ progress }),
  setGenerating: (isGenerating) => set({ isGenerating }),
}));
