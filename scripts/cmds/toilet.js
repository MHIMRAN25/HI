const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "toilet",
    aliases: ["toilet"],
    version: "3.1",
    author: "milan-says",
    countDown: 5,
    role: 0,
    shortDescription: "Put someone's face in the toilet 😼🚽",
    longDescription: "",
    category: "fun",
    guide: "{pn} @tag | reply | r/random"
  },

  onStart: async function ({ event, message, usersData, threadsData }) {
    const args = event.body.split(/\s+/);
    let targetUID = null;

    // Reply mode
    if (event.messageReply) {
      targetUID = event.messageReply.senderID;
    }

    // Tag mode
    if (!targetUID) {
      const tag = Object.keys(event.mentions)[0];
      if (tag) targetUID = tag;
    }

    // Random mode
    if (!targetUID && ["r", "rnd", "random"].includes(args[1]?.toLowerCase())) {
      const info = await threadsData.get(event.threadID);
      const members = info.members.map(m => m.userID);
      const filtered = members.filter(id => id !== message.senderID);
      targetUID = filtered[Math.floor(Math.random() * filtered.length)];
    }

    // No target
    if (!targetUID) {
      return message.reply("Baka senpai! 😾 Tag someone, reply or use r/random!");
    }

    const name = await usersData.getName(targetUID);

    // Balance
    const cost = 300;
    const userData = await usersData.get(event.senderID);

    if (!userData.money || userData.money < cost) {
      return message.reply(`Senpai… 😿 You need ${cost} coins for toilet flush!`);
    }

    await usersData.set(event.senderID, { money: userData.money - cost });
    const remaining = userData.money - cost;

    // IMAGE
    const toilet = await jimp.read("https://i.imgur.com/sZW2vlz.png");
    toilet.resize(1080, 1350);

    const avatarURL = `https://graph.facebook.com/${targetUID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const avatar = await jimp.read(avatarURL);
    avatar.circle();

    // ⭐ ORIGINAL POSITION RESTORED ⭐
    const posX = 300;
    const posY = 660;

    toilet.composite(avatar.resize(450, 450), posX, posY);

    const savePath = `${__dirname}/tmp/toilet_${targetUID}.png`;
    await toilet.writeAsync(savePath);

    const text = 
`🚽💥 Toilet Flush Activated!

Senpai just dropped **${name}** into the holy toilet bowl 😼

💸 Coins used: ${cost}
💳 Remaining: ${remaining}`;

    await message.reply({
      body: text,
      attachment: fs.createReadStream(savePath)
    });

    fs.unlinkSync(savePath);
  }
};
