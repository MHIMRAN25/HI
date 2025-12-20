const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "pair",
    countDown: 10,
    role: 0,
    shortDescription: {
      en: "Get to know your partner",
    },
    longDescription: {
      en: "Know your destiny and know who you will complete your life with",
    },
    category: "love",
    guide: {
      en: "{pn}",
    },
  },

  onStart: async function ({ api, event, usersData, message }) {
    const COST = 500;
    const senderID = event.senderID;

    // ---- Check balance ----
    let user = await usersData.get(senderID);
    let balance = user?.money || 0;
    if (balance < COST) return message.reply(`🌸 Senpai… you need **${COST} coins** to use this command!\n💰 Your balance: ${balance} coins`);

    // Deduct coins
    await usersData.set(senderID, { ...user, money: balance - COST });
    const remaining = balance - COST;

    const { loadImage, createCanvas } = require("canvas");
    const pathImg = __dirname + "/assets/background.png";
    const pathAvt1 = __dirname + "/assets/any.png";
    const pathAvt2 = __dirname + "/assets/avatar.png";

    const id1 = senderID;
    let name1;
    try {
      name1 = await usersData.getName(id1);
      if (!name1) throw new Error("No name found");
    } catch {
      const info = await api.getUserInfo(id1);
      name1 = info?.[id1]?.name || "Unknown";
    }

    const threadInfo = await api.getThreadInfo(event.threadID);
    const all = threadInfo.userInfo;

    let gender1;
    for (let u of all) if (u.id == id1) gender1 = u.gender;

    const botID = api.getCurrentUserID();
    let candidates = [];

    for (let u of all) {
      if (u.id !== id1 && u.id !== botID) {
        if (gender1 === "MALE" && u.gender === "FEMALE") candidates.push(u.id);
        else if (gender1 === "FEMALE" && u.gender === "MALE") candidates.push(u.id);
        else if (!gender1) candidates.push(u.id);
      }
    }

    if (candidates.length === 0)
      return api.sendMessage("❌ No suitable partner found.", event.threadID, event.messageID);

    const id2 = candidates[Math.floor(Math.random() * candidates.length)];

    let name2;
    try {
      name2 = await usersData.getName(id2);
      if (!name2) throw new Error("No name found");
    } catch {
      const info = await api.getUserInfo(id2);
      name2 = info?.[id2]?.name || "Unknown";
    }

    // Pair percentage
    const rand1 = Math.floor(Math.random() * 100) + 1;
    const crazyValues = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
    const rand2 = crazyValues[Math.floor(Math.random() * crazyValues.length)];
    const resultPool = [rand1, rand1, rand1, rand2, rand1, rand1, rand1, rand1, rand1];
    const percentage = resultPool[Math.floor(Math.random() * resultPool.length)];

    // Random note
    const loveNotes = [
      "𝐘𝐨𝐮𝐫 𝐥𝐨𝐯𝐞 𝐬𝐭𝐨𝐫𝐲 𝐣𝐮𝐬𝐭 𝐛𝐞𝐠𝐚𝐧, 𝐚𝐧𝐝 𝐢𝐭'𝐬 𝐛𝐞𝐚𝐮𝐭𝐢𝐟𝐮𝐥. 🌹",
      "𝐃𝐞𝐬𝐭𝐢𝐧𝐲 𝐜𝐡𝐨𝐬𝐞 𝐲𝐨𝐮 𝐭𝐰𝐨 𝐭𝐨 𝐛𝐞 𝐭𝐨𝐠𝐞𝐭𝐡𝐞𝐫. 💞",
      "𝐘𝐨𝐮𝐫 𝐡𝐞𝐚𝐫𝐭𝐬 𝐟𝐨𝐮𝐧𝐝 𝐭𝐡𝐞𝐢𝐫 𝐦𝐢𝐫𝐫𝐨𝐫 𝐢𝐧 𝐞𝐚𝐜𝐡 𝐨𝐭𝐡𝐞𝐫. 💖",
      "𝐓𝐰𝐨 𝐬𝐨𝐮𝐥𝐬, 𝐨𝐧𝐞 𝐩𝐚𝐭𝐡. ✨",
      "𝐋𝐨𝐯𝐞 𝐟𝐢𝐧𝐝𝐬 𝐢𝐭𝐬 𝐰𝐚𝐲—𝐚𝐧𝐝 𝐢𝐭 𝐣𝐮𝐬𝐭 𝐝𝐢𝐝. 🔗",
      "𝐘𝐨𝐮𝐫 𝐥𝐨𝐯𝐞 𝐬𝐩𝐚𝐫𝐤𝐬 𝐥𝐢𝐤𝐞 𝐬𝐭𝐚𝐫𝐬 𝐢𝐧 𝐭𝐡𝐞 𝐧𝐢𝐠𝐡𝐭. 🌟",
      "𝐓𝐡𝐞 𝐮𝐧𝐢𝐯𝐞𝐫𝐬𝐞 𝐜𝐨𝐧𝐬𝐩𝐢𝐫𝐞𝐝 𝐭𝐨 𝐛𝐫𝐢𝐧𝐠 𝐲𝐨𝐮 𝐭𝐨𝐠𝐞𝐭𝐡𝐞𝐫. 🌌",
      "𝐋𝐨𝐯𝐞 𝐢𝐬 𝐧𝐨𝐭 𝐫𝐚𝐧𝐝𝐨𝐦—𝐢𝐭'𝐬 𝐲𝐨𝐮. 💘",
      "𝐓𝐰𝐨 𝐡𝐞𝐚𝐫𝐭𝐛𝐞𝐚𝐭𝐬, 𝐨𝐧𝐞 𝐫𝐡𝐲𝐭𝐡𝐦. 🫀",
      "𝐓𝐨𝐠𝐞𝐭𝐡𝐞𝐫, 𝐲𝐨𝐮 𝐦𝐚𝐤𝐞 𝐚 𝐦𝐚𝐠𝐢𝐜𝐚𝐥 𝐰𝐡𝐨𝐥𝐞. ✨"
    ];
    const note = loveNotes[Math.floor(Math.random() * loveNotes.length)];

    // Get avatars
    const avt1 = (
      await axios.get(
        `https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )
    ).data;
    fs.writeFileSync(pathAvt1, Buffer.from(avt1));

    const avt2 = (
      await axios.get(
        `https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )
    ).data;
    fs.writeFileSync(pathAvt2, Buffer.from(avt2));

    // Get background and load image to get size
    const bgBuffer = (await axios.get("https://i.ibb.co/RBRLmRt/Pics-Art-05-14-10-47-00.jpg", { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, Buffer.from(bgBuffer));

    const bgImage = await loadImage(pathImg);

    const canvas = createCanvas(bgImage.width, bgImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bgImage, 0, 0, bgImage.width, bgImage.height);
    ctx.drawImage(await loadImage(pathAvt1), 111, 175, 330, 330);
    ctx.drawImage(await loadImage(pathAvt2), 1018, 173, 330, 330);

    // Write canvas to file AFTER drawing everything
    fs.writeFileSync(pathImg, canvas.toBuffer());

    // Delete avatar images ASAP (not the background)
    fs.removeSync(pathAvt1);
    fs.removeSync(pathAvt2);

    // Prepare mention tags exactly matching the text in body
    const mention1 = { tag: `@${name1}`, id: id1 };
    const mention2 = { tag: `@${name2}`, id: id2 };

    const bodyText =
      `💞 𝐋𝐨𝐯𝐞 𝐏𝐚𝐢𝐫 𝐀𝐥𝐞𝐫𝐭 💞\n\n` +
      `💑 Congratulations ${mention1.tag} & ${mention2.tag}\n` +
      `💌 ${note}\n` +
      `🔗 Love Connection: ${percentage}% 💖\n\n` +
      `💸 Coins Deducted: ${COST}\n💰 Remaining Balance: ${remaining}`;

    // Send message with attachment
    return api.sendMessage(
      {
        body: bodyText,
        mentions: [mention1, mention2],
        attachment: fs.createReadStream(pathImg),
      },
      event.threadID,
      () => {
        fs.unlinkSync(pathImg);
      },
      event.messageID
    );
  },
};
