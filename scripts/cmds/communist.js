const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "communist",
    version: "1.2",
    author: "Saif",
    countDown: 10,
    role: 0,
    shortDescription: "Apply communism effect with coins, anime style & random mode",
    longDescription: "Adds a communist-style red filter to your or someone else's avatar with coin deduction, anime flavor, and optional random target",
    category: "fun",
    guide: {
      en: "{p}communist [@mention | reply | r | rnd | random]\nDefault: Your own profile picture"
    }
  },

  onStart: async function({ api, event, message, usersData, args }) {
    const COST = 500;
    const senderID = event.senderID;

    // ---- Check balance ----
    let user = await usersData.get(senderID);
    let balance = user.money || 0;
    if (balance < COST) return message.reply(`🌸 Senpai… you need **${COST} coins**!\n💰 Your balance: ${balance} coins`);

    // Deduct coins
    await usersData.set(senderID, { ...user, money: balance - COST });
    const remaining = balance - COST;

    // ---- Determine target ----
    let uid;

    if (args[0] && ["r", "rnd", "random"].includes(args[0].toLowerCase())) {
      // Pick random participant excluding sender
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participants = threadInfo.participantIDs.filter(id => id != senderID);
      if (participants.length === 0) return message.reply("❌ No one to pick randomly… baka!");
      uid = participants[Math.floor(Math.random() * participants.length)];
    } else if (Object.keys(event.mentions).length > 0) {
      uid = Object.keys(event.mentions)[0];
    } else if (event.type === "message_reply" && event.messageReply) {
      uid = event.messageReply.senderID;
    } else {
      uid = senderID;
    }

    // ---- Fetch target name ----
    const userInfo = await api.getUserInfo([uid]);
    const nameTarget = Object.values(userInfo)[0].name;

    // ---- Avatar URL ----
    const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=350685531728|62f8ce9f74b12f84c123cc23437a4a32`;

    // ---- Countdown ----
    let countdownMsg = await message.reply(`⏳ Applying communism effect to ${nameTarget} in 10 seconds… nyaa~`);
    for (let i = 9; i > 0; i--) {
      await new Promise(res => setTimeout(res, 1000));
      await api.editMessage(`⏳ Applying communism effect to ${nameTarget} in ${i} seconds… baka!`, countdownMsg.messageID);
    }
    await new Promise(res => setTimeout(res, 1000));
    await api.editMessage(`☭ Revolution starting for ${nameTarget} now… senpai noticed! ✨`, countdownMsg.messageID);

    try {
      const res = await axios.get(`https://api.popcat.xyz/v2/communism?image=${encodeURIComponent(avatarURL)}`, {
        responseType: "arraybuffer"
      });

      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const filePath = path.join(cacheDir, `communism_${uid}_${Date.now()}.png`);
      fs.writeFileSync(filePath, res.data);

      // ---- Anime-style final message with proper tagging ----
      const animeReplies = [
        `Nyaa~ communism effect applied to ${nameTarget}! ☭`,
        `Baka! Look at ${nameTarget}'s revolutionary avatar 💥`,
        `Sugoi~ ${nameTarget} is now fully communist ✨`,
        `Ara ara… senpai started a revolution for ${nameTarget}! 💫`,
        `Senpai, ${nameTarget}'s profile is now red like the hammer and sickle! ⚡`
      ];
      const finalReply = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      await message.reply({
        body: `${finalReply}\n💸 Deducted: ${COST} coins\n💳 Remaining: ${remaining}`,
        mentions: [{
          tag: nameTarget,
          id: uid
        }],
        attachment: fs.createReadStream(filePath)
      }, () => fs.unlinkSync(filePath));

    } catch (err) {
      console.error(err);
      return message.reply("❌ | Failed to generate communist image… baka!");
    }
  }
};
