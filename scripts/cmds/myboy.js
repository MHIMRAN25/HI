const fs = require("fs");
const axios = require("axios");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports.config = {
  name: "myboy",
  version: "1.9",
  role: 0,
  author: "MahMUD",
  category: "love",
  cooldowns: 5,
  cost: 500 // coins per use
};

module.exports.onStart = async ({ event, api, args, usersData, message }) => {
  try {
    const { threadID, messageID, senderID } = event;

    // --- Determine target ---
    const mention = Object.keys(event.mentions || {})[0] || (event.messageReply && event.messageReply.senderID);
    if (!mention) return message.reply("Please tag or reply to 1 person");

    // --- Load user balance safely ---
    let user = (await usersData.get(senderID)) || { money: 0 };
    if (user.money < module.exports.config.cost)
      return message.reply(`🥹 You need at least ${module.exports.config.cost} coins. Your balance: ${user.money}`);

    // --- Deduct coins ---
    await usersData.set(senderID, { ...user, money: user.money - module.exports.config.cost });
    const remaining = user.money - module.exports.config.cost;

    // --- Fetch API and generate image ---
    const baseUrl = await baseApiUrl();
    const apiUrl = `${baseUrl}/api/myboy?user1=${mention}&user2=${senderID}`;
    const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

    // --- Ensure tmp folder ---
    const tmpDir = path.join(__dirname, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const imgPath = path.join(tmpDir, `myboy_${mention}_${senderID}.png`);
    fs.writeFileSync(imgPath, Buffer.from(response.data, "binary"));

    // --- Usernames ---
    let senderName = "Senpai";
    let targetName = "Baka";
    try { senderName = (await usersData.getName(senderID)) || senderName; } catch {}
    try { targetName = (await usersData.getName(mention)) || targetName; } catch {}

    // --- Send message ---
    await message.reply({
      body: `💖 ${senderName} + ${targetName} = 𝐓𝐇𝐀𝐓'𝐒 𝐌𝐀𝐇 𝐁𝐎𝐘 🖤\n💸 ${module.exports.config.cost} coins deducted!\n💳 Remaining: ${remaining} coins`,
      attachment: fs.createReadStream(imgPath)
    }, () => {
      try { fs.unlinkSync(imgPath); } catch (e) {}
    });

  } catch (err) {
    console.error("MYBOY COMMAND ERROR:", err);
    return message.reply("🥹 Something went wrong, coins refunded if deducted.");
  }
};
