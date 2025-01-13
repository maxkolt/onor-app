const { Scenes, Markup } = require('telegraf');
const { UserModel, AdModel } = require('./models');

// Создаем сцену для подачи объявления
const adSubmissionScene = new Scenes.BaseScene('adSubmission');

// Вход в сцену
adSubmissionScene.enter(async (ctx) => {
  const userId = ctx.chat.id;

  let user = await UserModel.findOne({ userId });
  if (!user) {
    user = new UserModel({ userId, adCount: 0, hasSubscription: false });
    await user.save();
  }

  if (!user.hasSubscription && user.adCount >= 3) {
    await ctx.reply(
      'Вы достигли лимита бесплатных объявлений. Чтобы подать новое объявление, вам нужно оформить подписку.',
      Markup.inlineKeyboard([
        [Markup.button.callback('Оформить подписку', 'subscribe')],
      ])
    );
    return ctx.scene.leave();
  }

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

// Обработка текстов
adSubmissionScene.on('text', async (ctx) => {
  const userId = ctx.chat.id;
  const category = ctx.session.category;
  const description = ctx.message.text;

  if (!category) {
    await ctx.reply('Ошибка: выберите категорию перед вводом описания.');
    return ctx.scene.leave();
  }

  if (!description || description.trim() === '') {
    await ctx.reply('Описание не может быть пустым. Пожалуйста, введите описание.');
    return;
  }

  try {
    const ad = new AdModel({
      userId,
      category,
      description,
      createdAt: new Date(),
    });
    await ad.save();

    const user = await UserModel.findOne({ userId });
    user.adCount += 1;
    await user.save();

    console.log(`Пользователь ${userId} добавил объявление.`);
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
  const category = ctx.session.category;
  const description = ctx.session.description || 'Описание отсутствует';
  const photo = ctx.message.photo[ctx.message.photo.length - 1].file_id;

  if (!category) {
    await ctx.reply('Ошибка: сначала выберите категорию.');
    return ctx.scene.leave();
  }

  try {
    const ad = new AdModel({
      userId,
      category,
      description,
      img: photo,
      createdAt: new Date(),
    });
    await ad.save();

    const user = await UserModel.findOne({ userId });
    user.adCount += 1;
    await user.save();

    await ctx.reply('Ваше объявление с фото добавлено!');
  } catch (error) {
    console.error('Ошибка при сохранении объявления с фото:', error.message);
    await ctx.reply('Произошла ошибка при сохранении объявления. Попробуйте позже.');
  }

  ctx.scene.leave();
});

module.exports = { adSubmissionScene };
