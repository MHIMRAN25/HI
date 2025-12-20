const axios = require("axios");
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "ytb",
    aliases: ["yt"],
    version: "2.4",
    author: "Saif",
    role: 0,
    countDown: 10,
    shortDescription: "Search or download YouTube",
    longDescription: "Search and download YouTube audio/video using API",
    category: "music",
    guide: { en: "{pn} [-a/-v] <query or YouTube URL>" }
  },

  onStart: async ({ api, args, event, usersData, message }) => {
    const COST = 500;
    const sender = event.senderID;

    // Balance check
    let data = await usersData.get(sender);
    let money = data.money || 0;

    if (money < COST)
      return message.reply(`💸 You need **${COST} coins**, baka!\nYour balance: ${money}`);

    const isAudio = args[0] === "-a";
    const isVideo = args[0] === "-v";
    const input = (isAudio || isVideo) ? args.slice(1).join(" ") : args.join(" ");

    if (!isAudio && !isVideo)
      return message.reply("❌ Please specify `-a` for audio or `-v` for video.");

    const apiBaseUrl = await getYtbApi();
    if (!apiBaseUrl)
      return message.reply("❌ Failed to fetch API URL.");

    const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i;

    if (ytRegex.test(input)) {
      await deductBalance(sender, COST, usersData); // deduct coins
      return await handleDownload(api, event, apiBaseUrl, input, isAudio, COST, sender, usersData);
    }

    try {
      const search = await yts(input);
      const results = search.videos.slice(0, 6);

      if (!results.length)
        return message.reply("❌ No results found.");

      let msg = "🔎 YouTube Search Results:\n\n";
      results.forEach((v, i) => {
        msg += `${i + 1}. ${v.title}\n⏱ ${v.timestamp} | 👤 ${v.author.name}\n\n`;
      });
      msg += "👉 Reply with a number to download.";

      const attachments = [];
      const tempThumbs = [];
      for (let i = 0; i < results.length; i++) {
        const thumbPath = path.join(__dirname, "cache", `ytb_thumb_${Date.now()}_${i}.jpg`);
        try {
          const img = await axios.get(results[i].thumbnail, { responseType: "arraybuffer" });
          fs.writeFileSync(thumbPath, img.data);
          attachments.push(fs.createReadStream(thumbPath));
          tempThumbs.push(thumbPath);
        } catch (e) { console.error("Thumb error:", e); }
      }

      api.sendMessage(
        { body: msg, attachment: attachments },
        event.threadID,
        (err, info) => {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "ytb",
            messageID: info.messageID,
            author: sender,
            results,
            isAudio,
            isVideo,
            tempThumbs,
            COST
          });
        },
        event.messageID
      );
    } catch (err) {
      console.error(err);
      return message.reply("❌ YouTube search failed.");
    }
  },

  onReply: async ({ event, api, Reply, usersData, message }) => {
    const { results, isAudio, isVideo, messageID, tempThumbs, COST, author } = Reply;
    const choice = parseInt(event.body);

    if (isNaN(choice) || choice < 1 || choice > results.length)
      return message.reply("❌ Invalid choice.");

    const selected = results[choice - 1];

    if (messageID) api.unsendMessage(messageID);
    if (tempThumbs && Array.isArray(tempThumbs)) {
      for (const file of tempThumbs) { try { fs.unlinkSync(file); } catch {} }
    }

    // Balance check again before final download
    let data = await usersData.get(author);
    let money = data.money || 0;
    if (money < COST) return message.reply(`💸 You don't have enough coins. Need ${COST} coins!`);

    await deductBalance(author, COST, usersData);

    const apiBaseUrl = await getYtbApi();
    if (!apiBaseUrl)
      return message.reply("❌ Failed to fetch API URL.");

    return await handleDownload(api, event, apiBaseUrl, selected.url, isAudio, COST, author, usersData);
  }
};

// Helpers
async function getYtbApi() {
  try {
    const { data } = await axios.get(
      "https://raw.githubusercontent.com/romeoislamrasel/romeobot/refs/heads/main/api.json"
    );
    return data.ytb;
  } catch (error) {
    console.error("Error fetching API URL:", error);
    return null;
  }
}

async function deductBalance(userID, COST, usersData) {
  let data = await usersData.get(userID);
  let money = data.money || 0;
  await usersData.set(userID, { ...data, money: money - COST });
}

// Download handler
async function handleDownload(api, event, apiBaseUrl, videoUrl, isAudio, COST, userID, usersData) {
  try {
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const { data } = await axios.get(`${apiBaseUrl}/ytb?url=${encodeURIComponent(videoUrl)}`);
    const link = isAudio ? data.mp3 : data.mp4;
    const ext = isAudio ? "mp3" : "mp4";
    const filePath = path.join(__dirname, "cache", `ytb_${Date.now()}.${ext}`);

    const response = await axios.get(link, { responseType: "stream" });
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on("finish", async () => {
      api.setMessageReaction("✅", event.messageID, () => {}, true);
      const dataUser = await usersData.get(userID);
      const remaining = dataUser.money || 0;

      api.sendMessage({
        body: `🎬 ${data.title}\n👤 ${data.author}\n💸 Deducted: ${COST}\n💳 Remaining: ${remaining}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => { try { fs.unlinkSync(filePath); } catch {} }, event.messageID);
    });

    writer.on("error", (err) => {
      console.error(err);
      api.sendMessage("❌ Failed to save file.", event.threadID, event.messageID);
    });
  } catch (err) {
    console.error(err);
    return api.sendMessage("❌ Download failed.", event.threadID, event.messageID);
  }
}
