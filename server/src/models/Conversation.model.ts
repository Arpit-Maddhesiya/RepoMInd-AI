import mongoose, { Schema, model, type Document } from 'mongoose';

export interface IConversation extends Document {
  userId: mongoose.Types.ObjectId;
  repositoryId: mongoose.Types.ObjectId;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    repositoryId: { type: Schema.Types.ObjectId, ref: 'Repository', required: true, index: true },
    title: { type: String, default: 'New Chat' },
  },
  { timestamps: true },
);

conversationSchema.index({ userId: 1, repositoryId: 1, updatedAt: -1 });

export const Conversation = model<IConversation>('Conversation', conversationSchema);
