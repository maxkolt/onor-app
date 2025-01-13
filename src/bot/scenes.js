const { Telegraf, session, Scenes, Markup } = require('telegraf');
const { AdModel } = require('./models'); // Предполагается, что у вас есть модель AdModel

// Токен бота
const BOT_TOKEN = '7372196140:AAH8tN_75EwoeONqB66aSiPRXEC3GeyzaHw';

// Проверка токена
if (!BOT_TOKEN) {
  console.error('Ошибка: Токен бота отсутствует.');
  process.exit(1);
}

// Создаем сцену для подачи объявления
const adSubmissionScene = new Scenes.BaseScene('adSubmission');

// Вход в сцену
adSubmissionScene.enter(async (ctx) => {
  await ctx.reply(
    'Выберите категорию для объявления:',
    Markup.inlineKeyboard([
      [Markup.button.callback('Авто', 'category_auto')],
      [Markup.button.callback('Техника', 'category_tech')],
      [Markup.button.callback('Недвижимость', 'category_real_estate')],
      [Markup.button.callback('Одежда/Обувь', 'category_clothing')],
      [Markup.button.callback('Прочее', 'category_other')],
      [Markup.button.callback('Товары для животных', 'category_pets')],
    ])
  );
});

// Обработка выбора категории
adSubmissionScene.action(/category_(.+)/, async (ctx) => {
  const category = ctx.match[1];
  ctx.session.category = category;

  await ctx.reply(
    `Вы выбрали категорию: ${category}.
1. Введите описание вашего объявления.
2. Укажите ваши контактные данные.
3. При необходимости прикрепите фото.`
  );

  await ctx.reply('1. Введите описание вашего объявления.');
});

// Обработка текстовых сообщений
adSubmissionScene.on('text', async (ctx) => {
  const userId = ctx.chat.id;
  const category = ctx.session.category;
  const description = ctx.message.text;

  if (!category) {
    await ctx.reply('Ошибка: сначала выберите категорию.');
    return ctx.scene.leave();
  }

  if (!description || description.trim() === '') {
    await ctx.reply('Описание не может быть пустым. Пожалуйста, введите описание.');
    return;
  }

  try {
    const ad = new AdModel({ userId, category, description });
    await ad.save();
    await ctx.reply('Ваше объявление добавлено!');
  } catch (error) {
    console.error('Ошибка при сохранении объявления:', error.message);
    await ctx.reply('Произошла ошибка при сохранении объявления. Попробуйте позже.');
  }

  ctx.scene.leave();
});

// Обработка фотографий
adSubmissionScene.on('photo', async (ctx) => {
  const userId = ctx.chat.id;
  const photo = ctx.message.photo[0].file_id; // Получаем ID первого фото

  // Здесь можно обработать фото или сохранить его в базе данных
  await ctx.reply('Фото успешно прикреплено!');
});

// Создаем stage для управления сценами
const stage = new Scenes.Stage([adSubmissionScene]);

// Инициализация бота
const bot = new Telegraf(BOT_TOKEN);

// Middleware для работы сессиями и сценами
bot.use(session()); // Подключаем middleware для сессий
bot.use(stage.middleware()); // Подключаем middleware для сцен

// Команда для начала работы
bot.command('start', (ctx) => {
  return ctx.reply(
    'Добро пожаловать! Используйте меню для управления:',
    Markup.keyboard([
      ['Подать объявление'],
    ]).resize()
  );
});

// Обработка команды "Подать объявление"
bot.hears('Подать объявление', (ctx) => {
  return ctx.scene.enter('adSubmission'); // Вход в сцену подачи объявления
});

// Обработка ошибок
bot.catch((err) => {
  console.error('Ошибка в работе бота:', err.message);
});

// Запуск бота
bot.launch().then(() => {
  console.log('Бот запущен!');
});
