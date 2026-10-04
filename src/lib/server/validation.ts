import 'server-only';
import { z } from 'zod';
import type { Inquiry } from '@/lib/types';
import { HttpError } from './config';

export const inquirySchema = z.object({
  name: z.string().trim().min(2).max(120), email: z.email().max(200), type: z.string().trim().min(1).max(150),
  duration: z.string().max(150), deadline: z.string().max(100), references: z.string().max(3000), budget: z.string().max(150),
  message: z.string().trim().min(10).max(8000), website: z.string().max(200).optional(),
}).strict();

export function parse<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) throw new HttpError(400, result.error.issues.map(item => `${item.path.join('.')}: ${item.message}`).slice(0, 4).join(' '));
  return result.data;
}
export type InquiryInput = Omit<Inquiry, 'id' | 'status' | 'createdAt'>;
