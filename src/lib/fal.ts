import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_KEY,
  proxyUrl: '/api/fal/proxy',
});

export { fal };
export const FAL_GENERATE_MODEL = 'fal-ai/flux/dev';
export const FAL_EDIT_MODEL = 'fal-ai/flux-pro/kontext';
