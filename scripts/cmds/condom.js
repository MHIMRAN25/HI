const jimp = require("jimp");
const fs = require("fs-extra");
const path = require("path");

// Cooldowns in memory
const cooldowns = {};

module.exports = {
  config: {
    name: "condom",
    aliases: ["condom"],
    version: "1.3",
    author: "Saif",
    countDown: 5,
    role: 0,
    shortDescription: "Crazy condom meme with coins, anime style & random mode",
    longDescription: "Make fun of friends with condom fails, coin deduction, anime flavor, proper tagging, 20s cooldown & random target support",
    category: "fun",
    guide: "{p}condom [@mention | reply | r | rnd | random]\nDefault: your own avatar"
  },

  onStart: async function({ message, event, usersData, api }) {
    const COST = 500;
    const senderID = event.senderID;
    const now = Date.now();

    // ---- Check cooldown ----
    if (cooldowns[senderID] && now - cooldowns[senderID] < 20000) {
      const remaining = Math.ceil((20000 - (now - cooldowns[senderID])) / 1000);
      return message.reply(`⏳ Baka! Wait ${remaining} more seconds before using this command again, senpai~`);
    }
    cooldowns[senderID] = now; // set cooldown

    // ---- Check balance ----
    let user = await usersData.get(senderID);
    let balance = user.money || 0;
    if (balance < COST) return message.reply(`🌸 Senpai… you need **${COST} coins**!\n💰 Your balance: ${balance} coins`);

    // Deduct coins
    await usersData.set(senderID, { ...user, money: balance - COST });
    const remainingBalance = balance - COST;

    // ---- Determine target ----
    let uid;

    // Random participant
    if (event.args && ["r","rnd","random"].includes(event.args[0]?.toLowerCase())) {
      const threadInfo = await api.getThreadInfo(event.threadID);
      const participants = threadInfo.participantIDs.filter(id => id != senderID);
      if (participants.length === 0) return message.reply("❌ No one to pick randomly… baka!");
      uid = participants[Math.floor(Math.random() * participants.length)];
    }
    // Mentioned
    else if (Object.keys(event.mentions).length > 0) {
      uid = Object.keys(event.mentions)[0];
    }
    // Reply
    else if (event.type === "message_reply" && event.messageReply) {
      uid = event.messageReply.senderID;
    }
    // Default self
    else {
      uid = senderID;
    }

    // ---- Fetch target name ----
    const userInfo = await api.getUserInfo([uid]);
    const nameTarget = Object.values(userInfo)[0].name;

    // ---- Countdown with anime words ----
    const animeWords = ["nyaa~", "baka!", "senpai~", "sugoi!", "ara ara~"];
    let countdownMsg = await message.reply(`⏳ Applying condom effect to ${nameTarget} in 5 seconds… ${animeWords[Math.floor(Math.random() * animeWords.length)]}`);
    for (let i = 4; i > 0; i--) {
      await new Promise(res => setTimeout(res, 1000));
      const word = animeWords[Math.floor(Math.random() * animeWords.length)];
      await api.editMessage(`⏳ Applying condom effect to ${nameTarget} in ${i} seconds… ${word}`, countdownMsg.messageID);
    }
    await new Promise(res => setTimeout(res, 1000));
    await api.editMessage(`😂 Creating condom meme for ${nameTarget} now… ${animeWords[Math.floor(Math.random() * animeWords.length)]}`, countdownMsg.messageID);

    try {
      const imagePath = await generateCondom(uid);

      // ---- Anime-style final message ----
      const finalReplies = [
        `Nyaa~ check out ${nameTarget}'s crazy condom fail! 😂`,
        `Baka! ${nameTarget} got pranked with a condom meme 💥`,
        `Sugoi~ ${nameTarget} looks hilarious now ✨`,
        `Ara ara… senpai made a funny condom meme for ${nameTarget}! 💫`,
        `Senpai, ${nameTarget}’s avatar is now epic fail material! ⚡`
      ];
      const finalReply = finalReplies[Math.floor(Math.random() * finalReplies.length)];

      await message.reply({
        body: `${finalReply}\n💸 Deducted: ${COST} coins\n💳 Remaining: ${remainingBalance}`,
        mentions: [{ tag: nameTarget, id: uid }],
        attachment: fs.createReadStream(imagePath)
      }, () => fs.unlinkSync(imagePath));

    } catch (err) {
      console.error(err);
      return message.reply("❌ | Failed to generate condom image… baka!");
    }
  }
};

// ---- Image generator ----
async function generateCondom(uid) {
  const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const avatar = await jimp.read(avatarURL);
  const image = await jimp.read("https://i.imgur.com/cLEixM0.jpg");
  image.resize(512, 512).composite(avatar.resize(263, 263), 256, 258);

  const imagePath = path.join(__dirname, "cache", `condom_${uid}_${Date.now()}.png`);
  await image.writeAsync(imagePath);
  return imagePath;
}
