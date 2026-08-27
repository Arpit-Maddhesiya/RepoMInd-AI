import type { Response } from 'express';
import { z } from 'zod';
import { runTool, type ToolKind } from '../services/ai/aiToolsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import { Repository } from '../models/Repository.model.js';
import { AppError, ErrorCodes } from '../utils/AppError.js';

const toolSchema = z.object({
  repositoryId: z.string().min(1),
  target: z.string().min(1, 'Target (code or path) is required').max(30000),
  tool: z.enum(['explain', 'review', 'security', 'summarize', 'architecture', 'documentation']),
});

export const runAiTool = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { repositoryId, target, tool } = toolSchema.parse(req.body);

  const repo = await Repository.findOne({ _id: repositoryId, userId: req.user!.id });
  if (!repo) {
    throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);
  }

  const result = await runTool({ repositoryId, target, tool: tool as ToolKind });
  ok(res, result);
});
