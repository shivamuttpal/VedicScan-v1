import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface IChatSession extends Document {
  conversationId: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: IMessage[];
  metadata?: {
    recentTopics?: string[];
    emotionalConcerns?: string[];
    tonePreference?: string | null;
    messageCount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true }
}, { _id: false });

const chatSessionSchema = new Schema<IChatSession>({
  conversationId: { type: String, required: true },   // uniqueness enforced by compound index below
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'New Conversation' },
  messages: [messageSchema],
  metadata: {
    recentTopics: { type: [String], default: [] },
    emotionalConcerns: { type: [String], default: [] },
    tonePreference: { type: String, default: null },
    messageCount: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Compound unique index: the same conversationId is fine for different users.
// The old single-field index (conversationId_1) must be dropped from MongoDB once:
//   db.chatsessions.dropIndex('conversationId_1')
chatSessionSchema.index({ conversationId: 1, userId: 1 }, { unique: true });

export const ChatSession = mongoose.model<IChatSession>('ChatSession', chatSessionSchema);
