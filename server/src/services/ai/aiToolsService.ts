import { Repository } from '../../models/Repository.model.js';
import { AppError, ErrorCodes } from '../../utils/AppError.js';
import { getAIProvider } from './index.js';
import { getToolSystemPrompt } from './toolPrompts.js';
import { buildToolPrompt } from '../rag/promptBuilder.js';

export type ToolKind = 'explain' | 'review' | 'security' | 'summarize' | 'architecture' | 'documentation';

export interface ToolInput {
  repositoryId: string;
  target: string;
  tool: ToolKind;
}

export interface ToolResult {
  answer: string;
  repositoryId: string;
  tool: ToolKind;
}

export async function runTool({ repositoryId, target, tool }: ToolInput): Promise<ToolResult> {
  const repo = await Repository.findById(repositoryId);
  if (!repo) {
    throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);
  }

  const repoName = repo.fullName ?? `${repo.owner}/${repo.name}`;
  const provider = getAIProvider();
  const answer = await provider.generateAnswer({
    systemPrompt: getToolSystemPrompt(tool),
    messages: [{ role: 'user', content: buildToolPrompt(repoName, target, tool) }],
  });

  return { answer, repositoryId, tool };
}
