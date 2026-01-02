const Canvas = require("canvas");
const axios = require("axios");
const { randomString } = global.utils;

/* ================= CONFIG ================= */

const FB_APP_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

const defaultFontName = "BeVietnamPro-SemiBold";
const defaultPathFontName = `${__dirname}/assets/font/BeVietnamPro-SemiBold.ttf`;

Canvas.registerFont(`${__dirname}/assets/font/BeVietnamPro-Bold.ttf`, {
  family: "BeVietnamPro-Bold"
});
Canvas.registerFont(defaultPathFontName, {
  family: defaultFontName
});

/* ================= LEVEL SYSTEM ================= */

let deltaNext;
const expToLevel = (exp, d = deltaNext) =>
  Math.floor((1 + Math.sqrt(1 + 8 * exp / d)) / 2);

const levelToExp = (level, d = deltaNext) =>
  Math.floor(((level * level - level) * d) / 2);

/* ================= AVATAR FETCH ================= */

async function getAvatarByToken(uid) {
  const res = await axios.get(
    `https://graph.facebook.com/${uid}/picture`,
    {
      params: {
        width: 1500,
        height: 1500,
        access_token: FB_APP_TOKEN
      },
      responseType: "arraybuffer"
    }
  );
  return Buffer.from(res.data);
}

/* ================= COMMAND ================= */

module.exports = {
  config: {
    name: "rank",
    version: "2.0",
    author: "Saif",
    countDown: 5,
    role: 0,
    category: "rank",
    envConfig: { deltaNext: 5 }
  },

  onStart: async function ({ message, event, usersData, threadsData, commandName, envCommands }) {
    deltaNext = envCommands[commandName].deltaNext;

    const targetUsers = Object.keys(event.mentions).length
      ? Object.keys(event.mentions)
      : [event.senderID];

    const cards = await Promise.all(
      targetUsers.map(async uid => {
        const card = await makeRankCard(uid, usersData, threadsData, event.threadID);
        card.path = `${randomString(10)}.png`;
        return card;
      })
    );

    return message.reply({ attachment: cards });
  },

  onChat: async function ({ usersData, event }) {
    let { exp } = await usersData.get(event.senderID);
    if (!exp) exp = 0;
    await usersData.set(event.senderID, { exp: exp + 1 });
  }
};

/* ================= CARD BUILDER ================= */

async function makeRankCard(userID, usersData, threadsData, threadID) {
  const { exp } = await usersData.get(userID);
  const level = expToLevel(exp);
  const expNext = levelToExp(level + 1) - levelToExp(level);
  const currentExp = expNext - (levelToExp(level + 1) - exp);

  const all = await usersData.getAll();
  all.sort((a, b) => b.exp - a.exp);
  const rank = all.findIndex(u => u.userID == userID) + 1;

  let avatar;
  try {
    avatar = await getAvatarByToken(userID);
  } catch {
    avatar = await usersData.getAvatarUrl(userID);
  }

  const card = new RankCard({
    name: all[rank - 1].name,
    level,
    rank: `#${rank}/${all.length}`,
    exp: currentExp,
    expNextLevel: expNext,
    avatar
  });

  return card.buildCard();
}

/* ================= RANK CARD CLASS ================= */

class RankCard {
  constructor(data) {
    Object.assign(this, {
      widthCard: 2000,
      heightCard: 500,
      main_color: "#2b2b2b",
      sub_color: "rgba(255,255,255,0.15)",
      exp_color: "#00ffcc",
      expNextLevel_color: "#555",
      text_color: "#ffffff",
      fontName: "BeVietnamPro-Bold",
      ...data
    });
  }

  async buildCard() {
    const canvas = Canvas.createCanvas(this.widthCard, this.heightCard);
    const ctx = canvas.getContext("2d");

    /* background */
    ctx.fillStyle = this.main_color;
    ctx.fillRect(0, 0, this.widthCard, this.heightCard);

    /* avatar */
    const img = await Canvas.loadImage(this.avatar);
    const size = 300;
    const x = 250;
    const y = this.heightCard / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
    ctx.restore();

    /* text */
    ctx.fillStyle = this.text_color;
    ctx.font = "60px BeVietnamPro-Bold";
    ctx.fillText(this.name, 500, 180);

    ctx.font = "40px BeVietnamPro-Bold";
    ctx.fillText(`Lv ${this.level}`, 500, 250);
    ctx.fillText(this.rank, 500, 310);

    /* exp bar */
    const barX = 500;
    const barY = 350;
    const barW = 1200;
    const barH = 30;

    ctx.fillStyle = this.expNextLevel_color;
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = this.exp_color;
    ctx.fillRect(barX, barY, (this.exp / this.expNextLevel) * barW, barH);

    return canvas.createPNGStream();
  }
}
