const DIG = require("discord-image-generation");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "jail",
    version: "1.8",
    author: "Saif",
    countDown: 5,
    role: 0,
    shortDescription: "Jail image",
    longDescription: "Jail image with anime style",
    category: "fun",
    guide: {
      en: "{pn} [@tag | r | rnd | random]"
    }
  },

  langs: {
    vi: {
      noTag: "Bạn phải tag người bạn muốn tù"
    },
    en: {
      noTag: "Tag, reply, or use r/rnd/random ~ nyaaa!"
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang, api }) {
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

    if (args[0] && ["r", "rnd", "random"].includes(args[0].toLowerCase())) {
      const thread = await api.getThreadInfo(event.threadID);
      const all = thread.participantIDs.filter(id => id != sender && id != api.getCurrentUserID());
      target = all[Math.floor(Math.random() * all.length)];
    } else if (mention.length > 0) {
      target = mention[0];
    } else if (event.type === "message_reply") {
      target = event.messageReply.senderID;
    } else return message.reply(getLang("noTag"));

    if (target === sender) return message.reply("Ara ara~ You can't jail yourself baka (>///<)");

    // Names
    const info1 = await api.getUserInfo([sender]);
    const name1 = info1[sender].name;

    const info2 = await api.getUserInfo([target]);
    const name2 = info2[target].name;

    // Countdown 3 → 2 → 1
    let msg = await message.reply("⏳ Jailing in 3…");
    await wait(1000); await api.editMessage("⏳ Jailing in 2…", msg.messageID);
    await wait(1000); await api.editMessage("⏳ Jailing in 1…", msg.messageID);
    await wait(1000); await api.editMessage("🚨 Jailing now… senpai noticed! ✨", msg.messageID);

    // Create jail image
    const avatarURL2 = await usersData.getAvatarUrl(target);
    const img = await new DIG.Jail().getImage(avatarURL2);
    const pathSave = `${__dirname}/tmp/${target}_Jail.png`;
    fs.writeFileSync(pathSave, Buffer.from(img));

    // Anime random lines
    const animeLines = [
      `Nyaa~ ${name1}-kun jailed ${name2}! ✨`,
      `Baka! ${name2}-san got caught by ${name1}-chan 💥`,
      `${name2}-kun couldn't escape from ${name1}-senpai 😼`,
      `Ara ara… ${name1} captured ${name2}-san 💫`,
      `${name1} used HANDCUFF JUTSU on ${name2}! ⚡`
    ];
    const line = animeLines[Math.floor(Math.random() * animeLines.length)];

    // Final message with image
    message.reply({
      body: `${line}\n\n💸 Deducted: ${COST}\n💳 Remaining: ${remaining}`,
      attachment: fs.createReadStream(pathSave)
    }, () => fs.unlinkSync(pathSave));
  }
};

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
