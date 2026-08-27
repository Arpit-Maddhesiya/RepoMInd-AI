import { SYSTEM_PROMPTS } from '../ai/prompts.js';
import type { ToolKind } from './aiToolsService.js';

export type ToolSystemPromptKey = keyof typeof SYSTEM_PROMPTS;

export function getToolSystemPrompt(tool: ToolKind): string {
  return SYSTEM_PROMPTS[tool];
}
