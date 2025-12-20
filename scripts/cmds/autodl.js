const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);

const supportedDomains = [
  "facebook.com", "fb.watch",
  "youtube.com", "youtu.be",
  "tiktok.com",
  "instagram.com", "instagr.am",
  "likee.com", "likee.video",
  "capcut.com",
  "spotify.com",
  "terabox.com",
  "twitter.com", "x.com",
  "drive.google.com",
  "soundcloud.com",
  "ndown.app",
  "pinterest.com", "pin.it"
];

module.exports = {
  config: {
    name: "autodl",
    version: "2.1",
    author: "Saimx69x",
    role: 0,
    shortDescription: "All-in-one video/media downloader",
    longDescription:
      "Automatically downloads videos or media from Facebook, YouTube, TikTok, Instagram, Likee, CapCut, Spotify, Terabox, Twitter, Google Drive, SoundCloud, NDown, Pinterest, and more.",
    category: "utility",
    guide: { en: "Just send any supported media link (https://) to auto-download." }
  },

  onStart: async function({ api, event }) {
    const message = 
`📥 Send a video/media link (https://) from any supported site to auto-download.
Supported platforms: YouTube, Facebook, TikTok, Instagram, Likee, CapCut, Spotify, Terabox, Twitter, Google Drive, SoundCloud, NDown, Pinterest, etc.`;
    api.sendMessage(message, event.threadID, event.messageID);
  },

  onChat: async function({ api, event }) {
    const content = event.body ? event.body.trim() : "";
    if (!content.startsWith("https://")) return;
    if (!supportedDomains.some(domain => content.includes(domain))) return;

    api.setMessageReaction("⌛️", event.messageID, () => {}, true);

    try {
      const API = `https://xsaim8x-xxx-api.onrender.com/api/auto?url=${encodeURIComponent(content)}`;
      const res = await axios.get(API);

      if (!res.data) throw new Error("No response from API");

      const mediaURL = res.data.high_quality || res.data.low_quality;
      const mediaTitle = res.data.title || "Unknown Title";
      if (!mediaURL) throw new Error("Media not found");

      const extension = mediaURL.includes(".mp3") ? "mp3" : "mp4";
      const filePath = path.join(__dirname, "cache", `auto_media_${Date.now()}.${extension}`);

      await fs.ensureDir(path.dirname(filePath));

      const downloadStream = (await axios.get(mediaURL, { responseType: "stream" })).data;
      await streamPipeline(downloadStream, fs.createWriteStream(filePath));

      api.setMessageReaction("✅️", event.messageID, () => {}, true);

      const domain = supportedDomains.find(d => content.includes(d)) || "Unknown Platform";
      const platformName = domain.replace(/(\.com|\.app|\.video|\.net)/, "").toUpperCase();

      // ✅ ONLY THIS TEXT UPDATED
      const infoCard = `
╔═══✦═══『 𝐀𝐔𝐓𝐎 𝐃𝐎𝐖𝐍𝐋𝐎𝐀𝐃 』══✦═══╗
║ 🎬 𝐓𝐈𝐓𝐋𝐄    : ${mediaTitle}
║ 🌐 𝐏𝐋𝐀𝐓𝐅𝐎𝐑𝐌 : ${platformName}
║ 💾 𝐒𝐓𝐀𝐓𝐔𝐒   : 𝐒𝐔𝐂𝐂𝐄𝐒𝐒 ✅
╚══════════════════════════════╝
💖 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐌𝐈𝐊𝐀𝐒𝐀
⚙️ 𝐅𝐈𝐗𝐄𝐃 𝐁𝐘 𝐒𝐚𝐢𝐟
`;

      api.sendMessage(
        { body: infoCard, attachment: fs.createReadStream(filePath) },
        event.threadID,
        () => fs.unlinkSync(filePath),
        event.messageID
      );
    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌️", event.messageID, () => {}, true);
    }
  }
};
