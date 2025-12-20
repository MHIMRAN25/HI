const axios = require('axios');
const yts = require("yt-search");
const fs = require("fs");
const path = require("path");
const { performance } = require('perf_hooks');

function getVideoID(url) {
  const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
  const match = url.match(checkurl);
  return match ? match[1] : null;
}

module.exports = {
  config: {
    name: "sing",
    version: "1.0.5",
    author: "bayjid+saif",
    category: "music",
    shortDescription: "🎧 Download or play YouTube song with coins (reply supported)",
    longDescription: "Play or download YouTube music by typing the song name or link.",
    guide: "{pn} <song name or YouTube link>"
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      const COST = 500;
      const sender = event.senderID;
      let user = (await usersData.get(sender)) || { money: 0 };

      if (user.money < COST) return api.sendMessage(
        `🌸 Senpai… you need **${COST} coins** to sing! 💰 Your balance: ${user.money} coins`,
        event.threadID, event.messageID // reply now
      );

      if (!args[0]) return api.sendMessage("❌ Please type a song name or YouTube link!", event.threadID, event.messageID);

      let videoID;
      if (args[0].includes("youtube.com") || args[0].includes("youtu.be")) {
        videoID = getVideoID(args[0]);
        if (!videoID) return api.sendMessage("❌ Invalid YouTube link.", event.threadID, event.messageID);
      } else {
        const search = await yts(args.join(" "));
        if (!search.videos.length) return api.sendMessage("❌ Song not found.", event.threadID, event.messageID);
        videoID = search.videos[0].videoId;
      }

      await usersData.set(sender, { ...user, money: user.money - COST });
      const remaining = user.money - COST;

      const start = performance.now();
      const tempFilePath = path.join(__dirname, `temp_audio_${sender}_${Date.now()}.mp3`);

      const { data } = await axios.get(`https://www.noobs-api.top/dipto/ytDl3?link=${videoID}&format=mp3`).catch(()=>({data:{}}));
      if (!data.downloadLink) return api.sendMessage("❌ Failed to get download link. Maybe API is down.", event.threadID, event.messageID);

      const writer = fs.createWriteStream(tempFilePath);
      const audioResponse = await axios({ url: data.downloadLink, method: "GET", responseType: "stream" });
      audioResponse.data.pipe(writer);
      await new Promise((res, rej) => { writer.on("finish", res); writer.on("error", rej); });

      const timeTaken = ((performance.now() - start) / 1000).toFixed(2);
      const senderName = await usersData.getName(sender);

      const animeReplies = [
        `Nyaa~ ${senderName}-chan is singing "${data.title}"! 🎤✨`,
        `Sugoiii~ Senpai ${senderName} brings music to everyone! 🎶💖`,
        `Baka! ${senderName}-kun is performing "${data.title}" 😼`,
        `Uwuuu~ ${senderName} sang beautifully! 🌸💫`,
        `${senderName}-san’s song hits the heartstrings! 💕`
      ];
      const chosenReply = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      const styledMsg = `${chosenReply}\n\n💸 ${COST} coins deducted!\n💳 Remaining: ${remaining} coins\n⏱ Time taken: ${timeTaken}s`;

      api.sendMessage(
        { body: styledMsg, attachment: fs.createReadStream(tempFilePath) },
        event.threadID,
        () => fs.unlinkSync(tempFilePath),
        event.messageID // reply now
      );

    } catch (e) {
      api.sendMessage(`Uwuuu~ Something went wrong (>_<)💦\nError: ${e.message}`, event.threadID, event.messageID);
    }
  }
};
