require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const http = require("http");

const bot = new Telegraf(process.env.BOT_TOKEN);
const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";
const SITE_URL = process.env.SITE_URL || "https://veliumcs.su";

const SUBS_PATH = path.join(__dirname, "subscribers.json");

function loadSubs() {
  try {
    if (fs.existsSync(SUBS_PATH))
      return JSON.parse(fs.readFileSync(SUBS_PATH, "utf8"));
  } catch {}
  return {};
}

function saveSubs(subs) {
  fs.writeFileSync(SUBS_PATH, JSON.stringify(subs, null, 2));
}

async function resolveSteam(input) {
  const r = await fetch(
    `${BACKEND}/api/resolve?input=${encodeURIComponent(input)}`,
  );
  if (!r.ok) throw new Error("Профиль не найден");
  return (await r.json()).steamid64;
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

// ── Bot commands ─────────────────────────────────────────────
bot.start((ctx) => {
  ctx.replyWithHTML(
    `👋 Привет, <b>${ctx.from.first_name || "игрок"}</b>!\n\n` +
      `Я бот <b>VELIUMCS</b> — уведомлю когда кто-то оценит твой CS2 профиль.\n\n` +
      `<b>Команды:</b>\n` +
      `/link <code>ссылка или SteamID64</code> — привязать Steam\n` +
      `/unlink — отвязать\n` +
      `/status — текущий профиль`,
  );
});

bot.help((ctx) =>
  ctx.replyWithHTML(
    `/link &lt;Steam URL или SteamID64&gt;\n/unlink\n/status\n\n` +
      `Сайт: <a href="${SITE_URL}">${SITE_URL}</a>`,
  ),
);

bot.command("link", async (ctx) => {
  const input = ctx.message.text.replace("/link", "").trim();
  if (!input)
    return ctx.replyWithHTML(
      "❌ Укажи профиль:\n<code>/link https://steamcommunity.com/id/ник</code>",
    );

  const msg = await ctx.reply("⏳ Ищу профиль...");
  try {
    const steamid64 = await resolveSteam(input);
    const nick = await getPlayerNick(steamid64);
    const subs = loadSubs();

    const existing = Object.values(subs).find((s) => s.steamid === steamid64);
    if (existing && existing.tgId !== ctx.from.id) {
      await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id);
      return ctx.reply(
        "❌ Этот Steam профиль уже привязан к другому Telegram аккаунту.",
      );
    }

    subs[String(ctx.from.id)] = {
      tgId: ctx.from.id,
      tgUsername: ctx.from.username || null,
      steamid: steamid64,
      nick,
      linkedAt: new Date().toISOString(),
    };
    saveSubs(subs);
    await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id);
    ctx.replyWithHTML(
      `✅ Привязан!\n\n👤 <b>${nick}</b>\n🆔 <code>${steamid64}</code>`,
      Markup.inlineKeyboard([
        [
          Markup.button.url(
            "Открыть профиль",
            `${SITE_URL}/player/${steamid64}`,
          ),
        ],
      ]),
    );
  } catch {
    await ctx.telegram.deleteMessage(ctx.chat.id, msg.message_id);
    ctx.reply("❌ Профиль не найден.");
  }
});

bot.command("unlink", (ctx) => {
  const subs = loadSubs();
  if (!subs[String(ctx.from.id)]) return ctx.reply("Нет привязанного профиля.");
  const nick = subs[String(ctx.from.id)].nick;
  delete subs[String(ctx.from.id)];
  saveSubs(subs);
  ctx.reply(`✅ Профиль "${nick}" отвязан.`);
});

bot.command("status", (ctx) => {
  const sub = loadSubs()[String(ctx.from.id)];
  if (!sub)
    return ctx.replyWithHTML(
      "❌ Нет привязанного профиля.\n\n<code>/link https://steamcommunity.com/id/ник</code>",
    );
  ctx.replyWithHTML(
    `✅ <b>${sub.nick}</b>\n🆔 <code>${sub.steamid}</code>\n📅 ${new Date(sub.linkedAt).toLocaleDateString("ru-RU")}`,
    Markup.inlineKeyboard([
      [
        Markup.button.url(
          "Открыть профиль",
          `${SITE_URL}/player/${sub.steamid}`,
        ),
      ],
    ]),
  );
});

// ── Notify HTTP server ───────────────────────────────────────
const NOTIFY_PORT = parseInt(process.env.NOTIFY_PORT || "3002");
const NOTIFY_SECRET = process.env.NOTIFY_SECRET || "veliumcs_notify_secret";

const LIKE_REASONS = [
  "Хороший командный игрок",
  "Хорошо играет",
  "Просто приятный чел",
  "Это мой друг",
];
const DISLIKE_REASONS = [
  "Читер",
  "Грифер",
  "Мне он просто не нравится",
  "Токсик",
];

// Дедупликация — не слать одно уведомление дважды за 5 сек
const recentNotifs = new Map();

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/notify") {
    res.writeHead(404);
    res.end();
    return;
  }

  let body = "";
  req.on("data", (c) => {
    body += c;
  });
  req.on("end", async () => {
    try {
      const { secret, steamid, type, reason } = JSON.parse(body);
      if (secret !== NOTIFY_SECRET) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      // Deduplicate: same steamid+type+reason within 5 seconds = ignore
      const dedupeKey = `${steamid}:${type}:${reason}`;
      const lastSent = recentNotifs.get(dedupeKey);
      if (lastSent && Date.now() - lastSent < 5000) {
        res.writeHead(200);
        res.end("deduplicated");
        return;
      }
      recentNotifs.set(dedupeKey, Date.now());
      // Clean up old entries
      for (const [k, v] of recentNotifs) {
        if (Date.now() - v > 30000) recentNotifs.delete(k);
      }

      const subs = loadSubs();
      const sub = Object.values(subs).find((s) => s.steamid === steamid);
      if (sub) {
        const isLike = type === "like";
        const emoji = isLike ? "👍" : "👎";
        const word = isLike ? "лайк" : "дизлайк";
        const reason_text = isLike
          ? LIKE_REASONS[reason]
          : DISLIKE_REASONS[reason];

        await bot.telegram.sendMessage(
          sub.tgId,
          `${emoji} <b>Новый ${word}!</b>\n\n` +
            `Кто-то оценил твой профиль на <b>VELIUMCS</b>\n\n` +
            `📋 Причина: <i>${reason_text}</i>\n\n` +
            `<a href="${SITE_URL}/player/${steamid}">Посмотреть профиль →</a>`,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: "Открыть профиль",
                    url: `${SITE_URL}/player/${steamid}`,
                  },
                ],
              ],
            },
          },
        );
      }
      res.writeHead(200);
      res.end("ok");
    } catch (e) {
      console.error("Notify error:", e.message);
      res.writeHead(500);
      res.end("Error");
    }
  });
});

// Graceful port handling — don't crash if port busy
server.on("error", (e) => {
  if (e.code === "EADDRINUSE") {
    console.warn(`Port ${NOTIFY_PORT} busy, notify server not started`);
  } else {
    console.error("Server error:", e);
  }
});

server.listen(NOTIFY_PORT, () =>
  console.log(`VELIUMCS Bot notify :${NOTIFY_PORT}`),
);

bot.launch().then(() => console.log("VELIUMCS Bot started"));

process.once("SIGINT", () => {
  bot.stop("SIGINT");
  server.close();
});
process.once("SIGTERM", () => {
  bot.stop("SIGTERM");
  server.close();
});
