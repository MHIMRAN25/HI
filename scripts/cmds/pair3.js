const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair3",
    version: "1.0",
    author: "Saif",
    countDown: 5,
    role: 0,
    shortDescription: "💞 Pair with someone in your chat!",
    longDescription: "Automatic gender pairing + anime style + balance deduction",
    category: "love",
    guide: "{pn} [reply/tag/random]"
  },

  onStart: async function({ api, event, usersData, args, message }) {
    const COST = 500;
    const senderID = event.senderID;

    // ---- Check balance ----
    let user = await usersData.get(senderID);
    let balance = user.money || 0;
    if (balance < COST) return message.reply(`🌸 Senpai… you need **${COST} coins**!\n💰 Your balance: ${balance} coins`);

    // Deduct coins
    await usersData.set(senderID, { ...user, money: balance - COST });
    const remaining = balance - COST;

    const { threadID } = event;
    const threadInfo = await api.getThreadInfo(threadID);
    const all = threadInfo.userInfo;
    const botID = api.getCurrentUserID();

    // ---- Determine target ----
    let targetID;

    if (event.type === "message_reply" && event.messageReply) {
      targetID = event.messageReply.senderID;
    } else if (Object.keys(event.mentions).length > 0) {
      targetID = Object.keys(event.mentions)[0];
    } else {
      // random gender-based
      const senderInfo = all.find(u => u.id === senderID);
      const gender1 = senderInfo?.gender || null;
      let candidates = all.filter(u => u.id !== senderID && u.id !== botID);
      if (gender1 === "MALE") candidates = candidates.filter(u => u.gender === "FEMALE");
      else if (gender1 === "FEMALE") candidates = candidates.filter(u => u.gender === "MALE");
      if (!candidates.length) candidates = all.filter(u => u.id !== senderID && u.id !== botID); // fallback
      targetID = candidates[Math.floor(Math.random() * candidates.length)].id;
    }

    if (!targetID) return api.sendMessage("❌ No suitable partner found.", threadID);

    // ---- Names ----
    const senderName = (await usersData.get(senderID))?.name || (await api.getUserInfo(senderID))[senderID]?.name || "Unknown";
    const targetName = (await usersData.get(targetID))?.name || (await api.getUserInfo(targetID))[targetID]?.name || "Unknown";

    // ---- Pair percentage & note ----
    const percentage = Math.floor(Math.random() * 101);
    const loveNotes = [
      "💖 Love is in the air!",
      "🌸 Destiny brought you two together!",
      "✨ Your hearts beat as one!",
      "💞 A perfect match!",
      "🌟 Stars align for your love!"
    ];
    const note = loveNotes[Math.floor(Math.random() * loveNotes.length)];

    // ---- Prepare images ----
    const cacheDir = path.join(__dirname, "cache");
    fs.ensureDirSync(cacheDir);

    const pathAvt1 = path.join(cacheDir, "avt1.png");
    const pathAvt2 = path.join(cacheDir, "avt2.png");
    const pathBg = path.join(cacheDir, "bg.png");

    const avt1 = (await axios.get(`https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathAvt1, Buffer.from(avt1));

    const avt2 = (await axios.get(`https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathAvt2, Buffer.from(avt2));

    const bgURL = "https://i.ibb.co/RBRLmRt/Pics-Art-05-14-10-47-00.jpg"; // anime style background
    const bg = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathBg, Buffer.from(bg));

    const { createCanvas, loadImage } = require("canvas");
    const bgImg = await loadImage(pathBg);
    const canvas = createCanvas(bgImg.width, bgImg.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(await loadImage(pathAvt1), 100, 150, 300, 300);
    ctx.drawImage(await loadImage(pathAvt2), 1000, 150, 300, 300);
    const finalPath = path.join(cacheDir, "pair.png");
    fs.writeFileSync(finalPath, canvas.toBuffer());

    fs.removeSync(pathAvt1);
    fs.removeSync(pathAvt2);
    fs.removeSync(pathBg);

    // ---- Mentions & message ----
    const mentions = [
      { id: senderID, tag: senderName },
      { id: targetID, tag: targetName }
    ];

    const bodyText = `💞 Successful pairing!\n💌 ${note}\n💕 Love Connection: ${percentage}%\n💸 Coins deducted: ${COST}\n💳 Remaining: ${remaining}`;

    return api.sendMessage({ body: bodyText, mentions, attachment: fs.createReadStream(finalPath) }, threadID, () => fs.unlinkSync(finalPath));
  }
};
