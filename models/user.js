const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Boolean, default: false },
  verificationCode: { type: String },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
