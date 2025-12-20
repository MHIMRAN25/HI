const jimp = require("jimp");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "arrest",
    aliases: ["ar"],
    version: "1.8",
    author: "Saif",
    countDown: 5,
    role: 0,
    shortDescription: "arrest the rapist",
    longDescription: "",
    category: "fun",
    guide: {
      vi: "{pn} [@tag | r | rnd | random]",
      en: "{pn} [@tag | r | rnd | random]"
    }
  },

  onStart: async function ({ message, args, api, event, usersData }) {
    const COST = 500;
    const sender = event.senderID;

    // Balance check
    let data = await usersData.get(sender);
    let money = data.money || 0;

    if (money < COST)
      return message.reply(`💸 You need **${COST} coins**, baka!\nYour balance: ${money}`);

    await usersData.set(sender, { ...data, money: money - COST });
    const remaining = money - COST;

    // Determine target
    const mention = Object.keys(event.mentions);
    let target;

    if (args[0] && ["r", "rnd", "rndm", "random"].includes(args[0].toLowerCase())) {
      const thread = await api.getThreadInfo(event.threadID);
      const all = thread.participantIDs.filter(id => id != sender && id != api.getCurrentUserID());
      target = all[Math.floor(Math.random() * all.length)];
    } else if (mention.length > 0) {
      target = mention[0];
    } else if (event.type === "message_reply") {
      target = event.messageReply.senderID;
    } else {
      return message.reply("Tag, reply, or use r/rnd/random ~ nyaa!");
    }

    if (target === sender)
      return message.reply("Ara ara~ You can’t arrest yourself baka (>///<)");

    // Names
    const info1 = await api.getUserInfo([sender]);
    const name1 = info1[sender].name;

    const info2 = await api.getUserInfo([target]);
    const name2 = info2[target].name;

    // Countdown
    let msg = await message.reply("⏳ Arrest starting in 3 seconds… nyaa~");
    for (let i = 2; i > 0; i--) {
      await new Promise(r => setTimeout(r, 1000));
      await api.editMessage(`⏳ Arrest starting in ${i}… baka!`, msg.messageID);
    }
    await new Promise(r => setTimeout(r, 1000));
    await api.editMessage("🚨 Arresting now… senpai noticed! ✨", msg.messageID);

    // Image
    const imgPath = await arrestImage(sender, target);

    const animeLines = [
      `Nyaa~ ${name1}-kun arrested ${name2}! ✨`,
      `Baka! ${name2}-san got caught by ${name1}-chan 💥`,
      `${name2}-kun couldn't escape from ${name1}-senpai 😼`,
      `Ara ara… ${name1} captured ${name2}-san 💫`,
      `${name1} used HANDCUFF JUTSU on ${name2}! ⚡`
    ];

    const line = animeLines[Math.floor(Math.random() * animeLines.length)];

    // Final message with image
    return api.sendMessage({
      body: `${line}\n\n💸 Deducted: ${COST}\n💳 Remaining: ${remaining}`,
      attachment: fs.createReadStream(imgPath)
    }, event.threadID, () => fs.unlinkSync(imgPath));
  }
};

// Image generation (access token same as before)
async function arrestImage(one, two) {
  const av1 = await jimp.read(
    `https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
  );
  av1.circle();

  const av2 = await jimp.read(
    `https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`
  );
  av2.circle();

  const out = path.join(__dirname, "arrest.png");
  const bg = await jimp.read("https://i.imgur.com/ep1gG3r.png");

  bg.resize(500, 500)
    .composite(av1.resize(100, 100), 375, 9)
    .composite(av2.resize(100, 100), 160, 92);

  await bg.writeAsync(out);
  return out;
}
