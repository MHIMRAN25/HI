const axios = require("axios");

module.exports = {
  config: {
    name: "x",
    version: "1.3",
    author: "UPoL Zox",
    role: 0,
    shortDescription: { en: "Generate AI images from prompt" },
    longDescription: { en: "Generate one or more AI-generated images from a prompt." },
    category: "image",
    guide: {
      en: `{pn} <prompt> (--m <model>) (--n <num>)
Example:
{pn} neko girl (--m anime)
{pn} sakura city (--n 3)
{pn} fantasy forest (--m sci_fi) (--n 2)
{pn} models → Show available models`
    }
  },

  onStart: async function ({ api, event, args }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const senderID = event.senderID;
    const mentionName = event.pushName || "Senpai";

    const availableModels = [
      "anime", "Infinity", "hentai", "animexl", "sci_fi", "anime_sci_fi", "x_niji", "xcvd",
      "fantasy", "hentaiXL", "nsfw", "nsfwXL", "anime_2", "anime_3", "animix", "animax"
    ];

    if (!args.length) {
      return api.sendMessage("⚠️ Senpai~ Please give me a prompt! Or type `models` to see available styles.", threadID, messageID);
    }

    // Show models list
    if (args[0].toLowerCase() === "models") {
      return api.sendMessage(`📜 Available Anime Art Styles:\n${availableModels.join("\n")}`, threadID, messageID);
    }

    // Defaults
    let selectedModel = availableModels[Math.floor(Math.random() * availableModels.length)];
    let numImages = 1;

    // Prompt parsing
    let promptText = args.join(" ");
    const modelMatch = promptText.match(/\(--m\s+([^)]+)\)/i);
    const numMatch = promptText.match(/\(--n\s+(\d+)\)/i);

    if (modelMatch) {
      const modelCandidate = modelMatch[1].trim();
      if (availableModels.map(m => m.toLowerCase()).includes(modelCandidate.toLowerCase())) {
        selectedModel = availableModels.find(m => m.toLowerCase() === modelCandidate.toLowerCase());
      }
      promptText = promptText.replace(modelMatch[0], "").trim();
    }

    if (numMatch) {
      numImages = Math.min(4, Math.max(1, parseInt(numMatch[1]))); // Limit to 1–4
      promptText = promptText.replace(numMatch[0], "").trim();
    }

    try {
      const startTime = Date.now();

      // Anime-style waiting messages with attempts
      let attempt = 1;
      let waitingMsg = await api.sendMessage(
        `🌸 *Mou~ Senpai!* I’m drawing your request... (Attempt ${attempt})\n⏳ Please wait...`,
        threadID
      );

      // Attempt updater every 3 seconds until done
      const interval = setInterval(() => {
        attempt++;
        api.editMessage(
          `🌸 *Mou~ Senpai!* I’m still working... (Attempt ${attempt})\n⏳ Almost there...`,
          waitingMsg.messageID
        );
      }, 3000);

      // API request
      const res = await axios.get(`https://www.noobx-api.rf.gd/api/imagine`, {
        params: {
          prompt: promptText,
          model: selectedModel,
          num_img: numImages
        }
      });

      clearInterval(interval); // Stop updates

      // Remove waiting message
      api.unsendMessage(waitingMsg.messageID);

      if (res.data.status !== "success" || !Array.isArray(res.data.response)) {
        return api.sendMessage("❌ Gomenasai~ I failed to create your art, Senpai. Please try again.", threadID, messageID);
      }

      const endTime = Date.now();
      const timeTaken = ((endTime - startTime) / 1000).toFixed(2);

      const imgURLs = res.data.response;
      const attachments = await Promise.all(
        imgURLs.map(url => global.utils.getStreamFromURL(url))
      );

      // Send final image message (anime style)
      await api.sendMessage({
        body:
          `✨ *Yatta~! Your anime masterpiece is ready!* ✨\n` +
          `💬 I hope Senpai likes it~ ❤️`,
        attachment: attachments
      }, threadID);

      // Send separate mention alert
      api.sendMessage({
        body: `🌟 *Senpai @${mentionName}!* Your anime art is here!`,
        mentions: [{ id: senderID, tag: `@${mentionName}` }]
      }, threadID);

    } catch (error) {
      console.error(error);
      return api.sendMessage("❌ Gomen~ Something went wrong, Senpai. Try again later.", threadID, messageID);
    }
  }
};
