require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fetch = require('node-fetch');
const fs    = require('fs');
const path  = require('path');

const bot      = new Telegraf(process.env.BOT_TOKEN);
const BACKEND  = process.env.BACKEND_URL || 'http://localhost:3001';
const SITE_URL = process.env.SITE_URL    || 'https://veliumcs.su';

// ── Simple JSON storage ──────────────────────────────────────
// Хранит: { steamid → { tgId, tgUsername, steamid, nick } }
const SUBS_PATH = path.join(__dirname, 'subscribers.json');

function loadSubs() {
  try {
    if (fs.existsSync(SUBS_PATH)) return JSON.parse(fs.readFileSync(SUBS_PATH, 'utf8'));
  } catch {}
  return {};
}

function saveSubs(subs) {
  fs.writeFileSync(SUBS_PATH, JSON.stringify(subs, null, 2));
}

// ── Helpers ──────────────────────────────────────────────────
async function resolveSteam(input) {
  const r = await fetch(`${BACKEND}/api/resolve?input=${encodeURIComponent(input)}`);
  if (!r.ok) throw new Error('Профиль не найден');
  const d = await r.json();
  return d.steamid64;
}

async function getPlayerNick(steamid64) {
  try {
    const r = await fetch(`${BACKEND}/api/player/${steamid64}`);
    const d = await r.json();
    return d?.profile?.personaname || steamid64;
  } catch {
    return steamid64;
  }
}

// ── /start ───────────────────────────────────────────────────
bot.start(ctx => {
  const name = ctx.from.first_name || 'игрок';
  ctx.replyWithHTML(
    `👋 Привет, <b>${name}</b>!\n\n` +
    `Я бот <b>VELIUMCS</b> — буду присылать уведомления когда кто-то оценит твой CS2 профиль.\n\n` +
    `<b>Команды:</b>\n` +
    `/link <code>ссылка или SteamID64</code> — привязать Steam профиль\n` +
    `/unlink — отвязать профиль\n` +
    `/status — показать привязанный профиль\n` +
    `/help — помощь\n\n` +
    `<i>Пример: /link https://steamcommunity.com/id/s1mple</i>`
  );
});

// ── /help ────────────────────────────────────────────────────
bot.help(ctx => {
  ctx.replyWithHTML(
    `<b>VELIUMCS Bot — помощь</b>\n\n` +
    `/link &lt;Steam URL или SteamID64&gt; — привязать аккаунт\n` +
    `/unlink — отвязать аккаунт\n` +
    `/status — текущий привязанный профиль\n\n` +
    `После привязки ты будешь получать уведомления о лайках и дизлайках на своём профиле на <a href="${SITE_URL}">veliumcs.su</a>`
  );
});

// ── /link ────────────────────────────────────────────────────
bot.command('link', async ctx => {
  const input = ctx.message.text.replace('/link', '').trim();

  if (!input) {
    return ctx.replyWithHTML(
      '❌ Укажи Steam профиль:\n' +
      '<code>/link https://steamcommunity.com/id/твойник</code>\n' +
      'или\n' +
      '<code>/link 76561198000000000</code>'
    );
  }

  const loadingMsg = await ctx.reply('⏳ Ищу профиль...');

  try {
    const steamid64 = await resolveSteam(input);
    const nick      = await getPlayerNick(steamid64);

    const subs = loadSubs();

    // Проверяем не привязан ли уже этот Steam к другому TG
    const existing = Object.values(subs).find(s => s.steamid === steamid64);
    if (existing && existing.tgId !== ctx.from.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
      return ctx.replyWithHTML('❌ Этот Steam профиль уже привязан к другому аккаунту Telegram.');
    }

    // Сохраняем подписку
    subs[String(ctx.from.id)] = {
      tgId:       ctx.from.id,
      tgUsername: ctx.from.username || null,
      steamid:    steamid64,
      nick,
      linkedAt:   new Date().toISOString(),
    };
    saveSubs(subs);

    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
    ctx.replyWithHTML(
      `✅ Профиль привязан!\n\n` +
      `👤 <b>${nick}</b>\n` +
      `🆔 <code>${steamid64}</code>\n\n` +
      `Теперь ты будешь получать уведомления о оценках на ` +
      `<a href="${SITE_URL}/player/${steamid64}">veliumcs.su</a>`,
      Markup.inlineKeyboard([
        Markup.button.url('Открыть профиль', `${SITE_URL}/player/${steamid64}`)
      ])
    );
  } catch (e) {
    await ctx.telegram.deleteMessage(ctx.chat.id, loadingMsg.message_id);
    ctx.reply('❌ Профиль не найден. Проверь ссылку или SteamID64.');
  }
});

// ── /unlink ──────────────────────────────────────────────────
bot.command('unlink', ctx => {
  const subs = loadSubs();
  if (!subs[String(ctx.from.id)]) {
    return ctx.reply('У тебя нет привязанного профиля.');
  }
  const nick = subs[String(ctx.from.id)].nick;
  delete subs[String(ctx.from.id)];
  saveSubs(subs);
  ctx.reply(`✅ Профиль "${nick}" отвязан. Уведомления отключены.`);
});

// ── /status ──────────────────────────────────────────────────
bot.command('status', ctx => {
  const subs = loadSubs();
  const sub  = subs[String(ctx.from.id)];
  if (!sub) {
    return ctx.replyWithHTML(
      '❌ Профиль не привязан.\n\nИспользуй:\n<code>/link https://steamcommunity.com/id/твойник</code>'
    );
  }
  ctx.replyWithHTML(
    `✅ <b>Привязанный профиль:</b>\n\n` +
    `👤 ${sub.nick}\n` +
    `🆔 <code>${sub.steamid}</code>\n` +
    `📅 Привязан: ${new Date(sub.linkedAt).toLocaleDateString('ru-RU')}`,
    Markup.inlineKeyboard([
      Markup.button.url('Открыть профиль', `${SITE_URL}/player/${sub.steamid}`)
    ])
  );
});

// ── Функция отправки уведомления (вызывается из бэкенда) ─────
// Бэкенд стучится на HTTP endpoint бота
const http = require('http');

const NOTIFY_PORT   = process.env.NOTIFY_PORT || 3002;
const NOTIFY_SECRET = process.env.NOTIFY_SECRET || 'veliumcs_notify_secret';

const LIKE_REASONS = [
  'Хороший командный игрок',
  'Хорошо играет',
  'Просто приятный чел',
  'Это мой друг',
];
const DISLIKE_REASONS = [
  'Читер',
  'Грифер',
  'Мне он просто не нравится',
  'Токсик',
];

http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/notify') {
    res.writeHead(404); res.end(); return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const { secret, steamid, type, reason, voterNick } = JSON.parse(body);

      if (secret !== NOTIFY_SECRET) {
        res.writeHead(403); res.end('Forbidden'); return;
      }

      const subs = loadSubs();
      // Найти подписчика по steamid
      const sub = Object.values(subs).find(s => s.steamid === steamid);

      if (sub) {
        const isLike = type === 'like';
        const emoji  = isLike ? '👍' : '👎';
        const word   = isLike ? 'лайк' : 'дизлайк';
        const reasonText = isLike
          ? LIKE_REASONS[reason]   || 'Неизвестная причина'
          : DISLIKE_REASONS[reason] || 'Неизвестная причина';

        const msg =
          `${emoji} <b>Новый ${word}!</b>\n\n` +
          `Кто-то оценил твой профиль на <b>VELIUMCS</b>\n\n` +
          `📋 Причина: <i>${reasonText}</i>\n\n` +
          `<a href="${SITE_URL}/player/${steamid}">Посмотреть профиль →</a>`;

        await bot.telegram.sendMessage(sub.tgId, msg, {
          parse_mode: 'HTML',
          reply_markup: {
            inline_keyboard: [[
              { text: 'Открыть профиль', url: `${SITE_URL}/player/${steamid}` }
            ]]
          }
        });
      }

      res.writeHead(200); res.end('ok');
    } catch (e) {
      console.error('Notify error:', e.message);
      res.writeHead(500); res.end('Error');
    }
  });
}).listen(NOTIFY_PORT, () => {
  console.log(`VELIUMCS Bot notify server :${NOTIFY_PORT}`);
});

// ── Запуск бота ──────────────────────────────────────────────
bot.launch().then(() => {
  console.log('VELIUMCS Telegram bot started');
});

process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));