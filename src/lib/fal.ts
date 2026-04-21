import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY,
  proxyUrl: '/api/fal/proxy',
});

export { fal };

// Seedream 4.5 — text-to-image for panels without reference characters
export const FAL_GENERATE_MODEL = 'fal-ai/bytedance/seedream/v4.5/text-to-image';

// Seedream 4.5 edit — used for panel edits AND for generations that include
// reference images (Seedream T2I has no ref support; refs go through edit).
export const FAL_EDIT_MODEL = 'fal-ai/bytedance/seedream/v4.5/edit';

export const GENERATE_PARAMS = {
  image_size: 'landscape_16_9' as const,
  num_images: 1,
  enable_safety_checker: true,
  enhance_prompt_mode: 'standard' as const,
};

export const EDIT_PARAMS = {
  num_images: 1,
  enable_safety_checker: true,
  enhance_prompt_mode: 'standard' as const,
};
