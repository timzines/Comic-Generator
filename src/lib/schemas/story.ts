import { z } from 'zod';

const PanelInPageSchema = z.object({
  position: z.number().int().min(0),
  description: z.string(),
  dialog: z.string().nullable(),
});

const PageSchema = z.object({
  pageNumber: z.number().int().min(1),
  panelCount: z.number().int().min(1).max(6),
  panels: z.array(PanelInPageSchema),
});

export const OptionSchema = z.object({
  title: z.string(),
  logline: z.string(),
  actBreakdown: z.array(z.object({ act: z.string(), desc: z.string() })).min(1).max(4),
  estimatedPanels: z.number().int().min(3).max(40),
  estimatedPages: z.number().int().min(1).max(8),
  pageStructure: z.array(PageSchema),
  tone: z.string(),
});

export const OptionsSchema = z.array(OptionSchema).length(3);

export const ScoreSchema = z.object({
  score: z.number().min(0).max(10),
  rationale: z.string(),
});
