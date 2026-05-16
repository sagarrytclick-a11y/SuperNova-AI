import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  profilePicture: {
    type: String,
    default: '',
  },
  healthProfile: {
    age: { type: Number, default: null },
    weight: { type: Number, default: null }, // in kg
    height: { type: Number, default: null }, // in cm
    goal: { type: String, default: '' },
    diet: { type: String, default: '' },
    activityLevel: { type: String, default: '' },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = models.User || model('User', UserSchema);

export default User;