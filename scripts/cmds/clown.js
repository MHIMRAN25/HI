const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "clown",
    version: "1.3",
    author: "Saif",
    countDown: 5,
    role: 0,
    shortDescription: "Add clown effect with coins & anime style",
    longDescription: "Applies clown face effect to your or mentioned avatar with coin deduction, anime flavor, and tagging",
    category: "fun",
    guide: {
      en: "{p}clown [@mention or reply]\nIf no mention or reply, uses your profile picture."
    }
  },

  onStart: async function({ api, event, message, usersData }) {
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
    if (Object.keys(event.mentions).length > 0) {
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
    let countdownMsg = await message.reply(`⏳ Generating clown image for ${nameTarget} in 3 seconds… nyaa~`);
    for (let i = 2; i > 0; i--) {
      await new Promise(res => setTimeout(res, 1000));
      await api.editMessage(`⏳ Generating clown image for ${nameTarget} in ${i} seconds… baka!`, countdownMsg.messageID);
    }
    await new Promise(res => setTimeout(res, 1000));
    await api.editMessage(`🤡 Creating clown image for ${nameTarget} now… senpai noticed! ✨`, countdownMsg.messageID);

    try {
      const res = await axios.get(`https://api.popcat.xyz/v2/clown?image=${encodeURIComponent(avatarURL)}`, {
        responseType: "arraybuffer"
      });

      const cacheDir = path.join(__dirname, "cache");
      fs.ensureDirSync(cacheDir);
      const filePath = path.join(cacheDir, `clown_${uid}_${Date.now()}.png`);
      fs.writeFileSync(filePath, res.data);

      // ---- Anime-style final message with proper tagging ----
      const animeReplies = [
        `Nyaa~ clown image ready for ${nameTarget}, senpai! 🤡`,
        `Baka! Look at ${nameTarget}'s funny clown face 💥`,
        `Sugoi~ ${nameTarget}'s clown effect is complete ✨`,
        `Ara ara… senpai made a clown image for ${nameTarget}! 💫`,
        `Senpai, ${nameTarget}'s avatar is now a clown! ⚡`
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
      return message.reply("❌ | Failed to generate clown image… baka!");
    }
  }
};
