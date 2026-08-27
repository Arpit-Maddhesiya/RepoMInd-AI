import type { Request, Response } from 'express';
import { z } from 'zod';
import { Conversation } from '../models/Conversation.model.js';
import { Repository } from '../models/Repository.model.js';
import { Message } from '../models/Message.model.js';
import {
  createConversation,
  generateRagAnswer,
  generateRagAnswerStream,
  addMessage,
  listConversationMessages,
} from '../services/rag/ragService.js';
import { AppError, ErrorCodes } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/response.js';
import type { AuthRequest } from '../middleware/auth.js';
import type { StreamChunk } from '../services/ai/types.js';

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, 'Message cannot be empty').max(8000),
});

const createConversationSchema = z.object({
  title: z.string().trim().max(100).optional(),
});

const getUserId = (req: AuthRequest) => req.user!.id;

const ensureConversationAccess = async (req: AuthRequest, conversationId: string) => {
  const conv = await Conversation.findOne({ _id: conversationId, userId: getUserId(req) });
  if (!conv) throw new AppError('Conversation not found.', 404, ErrorCodes.NOT_FOUND);
  return conv;
};

export const listConversations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const { repositoryId } = req.params;

  const repo = await Repository.findOne({ _id: repositoryId, userId });
  if (!repo) throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);

  const conversations = await Conversation.find({ userId, repositoryId }).sort({ updatedAt: -1 });
  ok(res, { conversations });
});

export const createNewConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = getUserId(req);
  const { repositoryId } = req.params;
  const body = createConversationSchema.parse(req.body ?? {});

  const conversation = await createConversation(userId, repositoryId, body.title);
  created(res, { conversation });
});

export const getConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversation = await ensureConversationAccess(req, req.params.id);
  ok(res, { conversation });
});

export const getConversationMessages = asyncHandler(async (req: AuthRequest, res: Response) => {
  await ensureConversationAccess(req, req.params.id);
  const messages = await listConversationMessages(req.params.id);
  ok(res, { messages });
});

export const deleteConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const conversation = await ensureConversationAccess(req, req.params.id);
  await Message.deleteMany({ conversationId: conversation.id });
  await conversation.deleteOne();
  ok(res, { message: 'Conversation deleted.' });
});

export const sendMessage = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: conversationId } = req.params;
  const { content } = sendMessageSchema.parse(req.body);
  const conversation = await ensureConversationAccess(req, conversationId);

  const repo = await Repository.findOne({
    _id: conversation.repositoryId,
    userId: getUserId(req),
  });
  if (!repo) throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);

  const history = await listConversationMessages(conversationId);

  // 1. Save the user message
  await addMessage(conversationId, 'user', content);
  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { title: conversation.title === 'New Chat' ? content.slice(0, 60) : conversation.title } },
  );

  // 2. Stream the AI answer via SSE
  const { stream, sources } = await generateRagAnswerStream(repo.id, content, history);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let fullAnswer = '';
  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    for await (const chunk of stream as AsyncIterable<StreamChunk>) {
      if (chunk.done) {
        fullAnswer = chunk.content ?? fullAnswer;
        break;
      }
      fullAnswer += chunk.text;
      sendEvent('delta', { text: chunk.text });
    }

    const saved = await addMessage(conversationId, 'assistant', fullAnswer, sources);
    await Conversation.updateOne({ _id: conversationId }, { $set: { updatedAt: new Date() } });

    sendEvent('done', {
      message: {
        id: saved.id,
        role: saved.role,
        content: saved.content,
        sources: saved.sources,
        createdAt: saved.createdAt,
      },
    });
    res.end();
  } catch (error) {
    sendEvent('error', { message: 'AI generation failed. Please try again.' });
    res.end();
  }
});

// Non-streaming fallback (used by tests / tooling)
export const sendMessageNonStreaming = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: conversationId } = req.params;
  const { content } = sendMessageSchema.parse(req.body);
  const conversation = await ensureConversationAccess(req, conversationId);

  const repo = await Repository.findOne({
    _id: conversation.repositoryId,
    userId: getUserId(req),
  });
  if (!repo) throw new AppError('Repository not found.', 404, ErrorCodes.NOT_FOUND);

  const history = await listConversationMessages(conversationId);
  await addMessage(conversationId, 'user', content);

  const { answer, sources } = await generateRagAnswer(repo.id, content, history);
  const saved = await addMessage(conversationId, 'assistant', answer, sources);
  await Conversation.updateOne({ _id: conversationId }, { $set: { updatedAt: new Date() } });

  ok(res, { message: saved });
});

export type ChatRequest = Request;
