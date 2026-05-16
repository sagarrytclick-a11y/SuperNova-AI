import mongoose, { Schema, model, models } from 'mongoose';

const MessageSchema = new Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const ChatSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    default: 'New Health Consultation',
  },
  messages: [MessageSchema],
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const Chat = models.Chat || model('Chat', ChatSchema);

export default Chat;
