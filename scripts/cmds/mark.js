const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "mark",
    author: "Saif",
    countDown: 5,
    role: 0,
    category: "fun",
    shortDescription: { en: "Write text on board image with coins system" }
  },

  wrapText: async (ctx, text, maxWidth) => {
    const words = text.split(" ");
    const lines = [];
    let line = "";
    for (let word of words) {
      const testLine = line + word + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== "") {
        lines.push(line.trim());
        line = word + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line.trim());
    return lines;
  },

  onStart: async function({ api, event, args, usersData }) {
    const { senderID, threadID, messageID } = event;

    // Money system
    const COST = 500;
    let userData = await usersData.get(senderID) || {};
    let money = userData.money || 0;
    if (money < COST) return api.sendMessage(`💸 You need ${COST} coins! Your balance: ${money}`, threadID, messageID);

    // Deduct coins
    await usersData.set(senderID, { ...userData, money: money - COST });
    const remaining = money - COST;

    if (!args[0]) return api.sendMessage("Enter text to put on board!", threadID, messageID);
    const text = args.join(" ");

    const tmpDir = path.join(__dirname, "cache");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    const pathImg = path.join(tmpDir, `mark_${Date.now()}.png`);

    try {
      // Load base image
      const imageRes = await axios.get("https://i.postimg.cc/gJCXgKv4/zucc.jpg", { responseType: "arraybuffer" });
      fs.writeFileSync(pathImg, Buffer.from(imageRes.data));
      const baseImage = await loadImage(pathImg);

      // Create canvas
      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");
      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);

      // Text styling
      let fontSize = 20; // half from previous 50
      ctx.fillStyle = "#000000";
      ctx.textAlign = "left";
      ctx.font = `${fontSize}px Arial`;

      // Reduce font size if too wide
      while (ctx.measureText(text).width > 470 && fontSize > 15) {
        fontSize--;
        ctx.font = `${fontSize}px Arial`;
      }

      // Wrap text
      const lines = await this.wrapText(ctx, text, 470);
      lines.forEach((line, i) => {
        ctx.fillText(line, 15, 75 + i * (fontSize + 5));
      });

      // Save & send
      const buffer = canvas.toBuffer();
      fs.writeFileSync(pathImg, buffer);

      await api.sendMessage({
        body: `✅ Board written successfully!\n💳 Coins deducted: ${COST}\n💰 Remaining: ${remaining}`,
        attachment: fs.createReadStream(pathImg)
      }, threadID, () => fs.unlinkSync(pathImg), messageID);

    } catch (err) {
      console.error("MARK CMD ERROR:", err.stack || err.message);
      api.sendMessage("Something went wrong creating the board image 😅", threadID, messageID);
    }
  }
};
