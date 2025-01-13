const mongoose = require('mongoose');

// Модель пользователя
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Идентификатор пользователя
  adCount: { type: Number, default: 0 }, // Количество поданных объявлений
  hasSubscription: { type: Boolean, default: false }, // Есть ли подписка
});

// Модель объявления

const AdSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  img: { type: String }, // URL изображения
  createdAt: { type: Date, default: Date.now },
});


const UserModel = mongoose.model('User', UserSchema);
const AdModel = mongoose.model('Ad', AdSchema);

module.exports = { UserModel, AdModel };
