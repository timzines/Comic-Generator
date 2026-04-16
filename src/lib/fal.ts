import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY,
  proxyUrl: '/api/fal/proxy',
});

export { fal };

// Generation models — swap these to change the generation pipeline
export const FAL_GENERATE_MODEL = 'fal-ai/flux/dev';

// Edit models — plug-and-play: swap to seedream when ready
// Options: 'fal-ai/flux-pro/kontext' (current), 'fal-ai/seedream-3' (next)
export const FAL_EDIT_MODEL = 'fal-ai/flux-pro/kontext';

// Model-specific default params for each pipeline stage
export const GENERATE_PARAMS = {
  image_size: 'landscape_16_9' as const,
  num_inference_steps: 28,
  guidance_scale: 3.5,
  num_images: 1,
};

export const EDIT_PARAMS = {
  num_inference_steps: 28,
  guidance_scale: 3.5,
};
