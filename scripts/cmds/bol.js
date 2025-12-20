const { createReadStream, unlinkSync, createWriteStream } = require("fs-extra");
const { resolve } = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "bol",
    aliases: ["ko"],
    version: "1.2",
    author: "otineeeeyyyyyyyy + Saif",
    countDown: 5,
    role: 0,
    shortDescription: { en: "text to speech with language (300 coins per use)" },
    longDescription: { en: "Convert text to speech. Cost: 300 coins per use." },
    category: "fun",
    guide: {
      en: "/say [language] [text]: Convert text to speech. Default language is English.\nExample usages:\n/say hi\n/say ja こんにちは"
    },
  },

  onStart: async function ({ api, event, args, usersData }) {
    const userId = event.senderID;
    const cost = 300;

    // fetch main balance
    let userData = await usersData.get(userId);
    if (!userData || typeof userData.money !== "number") userData = { money: 0 };

    if (userData.money < cost) {
      return api.sendMessage(
        `⚠️ Baka! You need ${cost} coins to use this command~ 💸\n💰 Your balance: ${userData.money}`,
        event.threadID
      );
    }

    try {
      const content = event.type === "message_reply" ? event.messageReply.body : args.join(" ");
      const supportedLanguages = ["ru", "en", "ko", "ja", "tl", "vi", "in", "ne"];
      const defaultLanguage = "en"; // default language
      const languageToSay = supportedLanguages.some((item) => content.indexOf(item) === 0) ? content.slice(0, content.indexOf(" ")) : defaultLanguage;
      const msg = languageToSay !== defaultLanguage ? content.slice(3) : content;
      const path = resolve(__dirname, "cache", `${event.threadID}_${event.senderID}.mp3`);

      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(msg)}&tl=${languageToSay}&client=tw-ob`;
      const response = await axios({ method: "GET", url, responseType: "stream" });
      const writer = response.data.pipe(createWriteStream(path));

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // deduct coins after successful TTS
      userData.money -= cost;
      await usersData.set(userId, userData);

      api.sendMessage(
        { body: `💰 -${cost} coins (Remaining: ${userData.money})`, attachment: createReadStream(path) },
        event.threadID,
        () => unlinkSync(path)
      );
    } catch (error) {
      console.error("Error occurred during TTS:", error);
      api.sendMessage("❌ Something went wrong while converting text to speech.", event.threadID);
    }
  },
};
