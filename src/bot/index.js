const { Telegraf, Markup, Scenes, session } = require('telegraf');
const mongoose = require('mongoose');
const YookassaPaymentService = require('./paymentService');
const { adSubmissionScene } = require('./adSubmissionScene');
const { UserModel } = require('./models'); // Добавлена модель пользователя

// Конфигурация
const BOT_TOKEN = '7372196140:AAH8tN_75EwoeONqB66aSiPRXEC3GeyzaHw';
const MONGO_URI = 'mongodb+srv://12345kolt:a24T8vuO4qYtOykT@cluster0.skiud.mongodb.net/?retryWrites=true&w=majority&appName=onorcomm';

// Инициализация платежного сервиса
const paymentService = new YookassaPaymentService({
  secretKey: 'test_q8t2F8c58jFQfVOV4ShBAUwthjnSmFxIP32Cv1PmJG0',
  shopId: '1011694',
});

// const webAppUrl = 'https://gregarious-phoenix-9a9fc7.netlify.app/';


const express = require('express');
const { AdModel } = require('./models'); // Импорт модели объявлений

const app = express();
app.use(express.json());
const cors = require('cors');
app.use(cors());

// Маршрут для получения всех объявлений
app.get('/api/ads', async (req, res) => {
  try {
    const ads = await AdModel.find().sort({ createdAt: -1 }); // Получаем объявления из MongoDB
    res.json(ads); // Отправляем их в формате JSON
  } catch (error) {
    console.error('Ошибка при получении объявлений:', error.message);
    res.status(500).send('Ошибка сервера');
  }
});


// Проверка токена
if (!BOT_TOKEN) {
  console.error('Ошибка: Токен бота отсутствует.');
  process.exit(1);
}

// Подключение к MongoDB
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('База данных подключена!'))
  .catch((err) => {
    console.error('Ошибка подключения к базе данных:', err.message);
    process.exit(1);
  });

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN);

// Middleware для работы сессиями и сценами
const stage = new Scenes.Stage([adSubmissionScene]);
bot.use(session()); // Обязательно для работы сцен
bot.use(stage.middleware()); // Подключение сцен

// Команда /start
bot.command('start', (ctx) => {
  return ctx.reply(
    'Добро пожаловать! Используйте меню для управления:',
    Markup.keyboard([
      ['Подать объявление'],
      ['Подписка', 'Помощь'],
    ]).resize()
  );
});

// Обработка кнопки "Подать объявление"
bot.hears('Подать объявление', async (ctx) => {
  const userId = ctx.chat.id;

  // Проверяем, есть ли пользователь в базе
  let user = await UserModel.findOne({ userId });
  if (!user) {
    user = new UserModel({ userId, adCount: 0, hasSubscription: false });
    await user.save();
  }

  // Проверяем лимит бесплатных объявлений
  if (!user.hasSubscription && user.adCount >= 3) {
    return ctx.reply(
      'Вы достигли лимита бесплатных объявлений. Чтобы продолжить, оформите подписку.',
      Markup.inlineKeyboard([[Markup.button.callback('Оформить подписку', 'subscribe')]])
    );
  }

  return ctx.scene.enter('adSubmission'); // Вход в сцену подачи объявления
});

// Обработка команды "Подписка"
bot.hears('Подписка', async (ctx) => {
  const userId = ctx.chat.id;

  // Создаем счет на оплату
  const invoice = await paymentService.createInvoice(139, 'RUB', 'Оплата подписки', userId);

  if (invoice) {
    await ctx.reply(
      'Оплатите подписку по ссылке:',
      Markup.inlineKeyboard([
        [Markup.button.url('Оплатить', invoice.url)],
        [Markup.button.callback('Я оплатил', 'check_payment')],
      ])
    );
  } else {
    await ctx.reply('Ошибка при создании счёта. Попробуйте позже.');
  }
});

// Обработка нажатия кнопки "Я оплатил"
bot.action('check_payment', async (ctx) => {
  const userId = ctx.chat.id;
  const user = await UserModel.findOne({ userId });

  if (!user) {
    return ctx.reply('Вы не зарегистрированы.');
  }

  // Проверяем оплату
  const paymentStatus = await paymentService.checkPaymentStatus(/* ID платежа */);
  if (paymentStatus.isPaid) {
    user.hasSubscription = true;
    await user.save();
    return ctx.reply('Оплата подтверждена! Подписка активна.');
  }

  return ctx.reply('Оплата не найдена или ещё не подтверждена.');
});

// Обработка кнопки "Помощь"
bot.hears('Помощь', async (ctx) => {
  await ctx.reply(
    'По всем вопросам обращайтесь к администратору:\n' +
    '[Администратор: @max12kolt](https://t.me/max12kolt)',
    {
      parse_mode: 'MarkdownV2',
    }
  );
});

// Обработка ошибок
bot.catch((err) => {
  console.error('Ошибка в работе бота:', err.message);
});

// Запуск бота
bot.launch().then(() => console.log('Бот запущен!'));
