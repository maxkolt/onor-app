const mongoose = require('mongoose');

// Модель пользователя
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Идентификатор пользователя
  adCount: { type: Number, default: 0 }, // Количество поданных объявлений
  hasSubscription: { type: Boolean, default: false }, // Есть ли подписка
});

// Модель объявления
const AdSchema = new mongoose.Schema({
  img: { type: String },
  userId: { type: String, required: true }, // Идентификатор пользователя
  category: { type: String, required: true }, // Категория объявления
  description: { type: String, required: true }, // Описание объявления
  createdAt: { type: Date, default: Date.now }, // Дата создания
});

const UserModel = mongoose.model('User', UserSchema);
const AdModel = mongoose.model('Ad', AdSchema);

module.exports = { UserModel, AdModel };
