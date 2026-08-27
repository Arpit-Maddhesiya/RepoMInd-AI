import { Repository } from '../../models/Repository.model.js';
import { Message, type SourceReference, type IMessage } from '../../models/Message.model.js';
import { Conversation, type IConversation } from '../../models/Conversation.model.js';
import { retrieveRelevantChunks } from './retriever.js';
import { buildContext, buildRagPrompt, buildSources, getSystemPrompt } from './promptBuilder.js';
import { getAIProvider } from '../ai/index.js';
import { repositoryIndexPath } from './vectorStore.js';
import { AppError, ErrorCodes } from '../../utils/AppError.js';
import type { StreamChunk } from '../ai/types.js';

const HISTORY_WINDOW = 6;

export interface RagResult {
  answer: string;
  sources: SourceReference[];
}

function buildHistory(messages: IMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  return messages
    .slice(-HISTORY_WINDOW)
    .map((m) => ({ role: m.role, content: m.content }));
}

export async function generateRagAnswer(
  repositoryId: string,
  question: string,
  history: IMessage[] = [],
): Promise<RagResult> {
  const repo = await Repository.findById(repositoryId);
  if (!repo) {
    throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);
  }
  if (repo.status !== 'COMPLETED') {
    throw new AppError('Repository has not finished indexing yet.', 400, ErrorCodes.REPOSITORY_PROCESSING);
  }

  const indexDir = repositoryIndexPath(repositoryId);
  const chunks = await retrieveRelevantChunks(indexDir, question);
  const context = buildContext(chunks);
  const sources = buildSources(chunks);
  const prompt = buildRagPrompt(repo.fullName ?? `${repo.owner}/${repo.name}`, question, context);

  const provider = getAIProvider();
  const answer = await provider.generateAnswer({
    systemPrompt: getSystemPrompt('rag'),
    messages: [...buildHistory(history), { role: 'user', content: prompt }],
  });

  return { answer, sources };
}

export async function generateRagAnswerStream(
  repositoryId: string,
  question: string,
  history: IMessage[] = [],
): Promise<{ stream: AsyncIterable<StreamChunk>; sources: SourceReference[] }> {
  const repo = await Repository.findById(repositoryId);
  if (!repo) {
    throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);
  }
  if (repo.status !== 'COMPLETED') {
    throw new AppError('Repository has not finished indexing yet.', 400, ErrorCodes.REPOSITORY_PROCESSING);
  }

  const indexDir = repositoryIndexPath(repositoryId);
  const chunks = await retrieveRelevantChunks(indexDir, question);
  const context = buildContext(chunks);
  const sources = buildSources(chunks);
  const prompt = buildRagPrompt(repo.fullName ?? `${repo.owner}/${repo.name}`, question, context);

  const provider = getAIProvider();
  const stream = provider.streamAnswer({
    systemPrompt: getSystemPrompt('rag'),
    messages: [...buildHistory(history), { role: 'user', content: prompt }],
  });

  return { stream, sources };
}

export async function createConversation(
  userId: string,
  repositoryId: string,
  title?: string,
): Promise<IConversation> {
  const repo = await Repository.findOne({ _id: repositoryId, userId });
  if (!repo) {
    throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);
  }
  return Conversation.create({
    userId,
    repositoryId,
    title: title?.trim() || 'New Chat',
  });
}

export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string,
  sources: SourceReference[] = [],
): Promise<IMessage> {
  return Message.create({ conversationId, role, content, sources });
}

export async function listConversationMessages(conversationId: string): Promise<IMessage[]> {
  return Message.find({ conversationId }).sort({ createdAt: 1 });
}
