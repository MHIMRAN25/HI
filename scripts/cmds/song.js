const axios = require("axios");
const fs = require('fs');

const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`,
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "song",
    version: "1.2",
    aliases: ["music", "play"],
    author: "dipto+saif",
    countDown: 5,
    role: 0,
    description: {
      en: "Download audio from YouTube with coins"
    },
    category: "music",
    guide: {
      en: "{pn} [<song name>|<song link>]"
    }
  },

  onStart: async ({ api, args, event, message, usersData, commandName }) => {
    try {
      const COST = 500; // coin per use
      const sender = event.senderID;
      const userData = await usersData.get(sender);

      if (userData.money < COST) {
        return api.sendMessage(`🌸 Senpai… you need **${COST} coins** to use this!\n💰 Your balance: ${userData.money} coins`, event.threadID);
      }

      await usersData.set(sender, { ...userData, money: userData.money - COST });

      const checkurl = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))((\w|-){11})(?:\S+)?$/;
      let videoID;
      const urlYtb = checkurl.test(args[0]);

      if (urlYtb) {
        const match = args[0].match(checkurl);
        videoID = match ? match[1] : null;
        const { data: { title, downloadLink, quality } } = await axios.get(
          `${await baseApiUrl()}/ytDl3?link=${videoID}&format=mp3`
        );
        return api.sendMessage({
          body: `✨ Nyaa~ Senpai downloaded a song!\n🎵 Title: ${title}\n💎 Coins used: ${COST}\n💰 Remaining balance: ${userData.money - COST}`,
          attachment: await dipto(downloadLink, 'audio.mp3')
        }, event.threadID, () => fs.unlinkSync('audio.mp3'), event.messageID);
      }

      // Keyword search
      let keyWord = args.join(" ");
      keyWord = keyWord.includes("?feature=share") ? keyWord.replace("?feature=share", "") : keyWord;
      const maxResults = 6;
      let result;
      try {
        result = ((await axios.get(`${await baseApiUrl()}/ytFullSearch?songName=${keyWord}`)).data).slice(0, maxResults);
      } catch (err) {
        return api.sendMessage("❌ An error occurred:" + err.message, event.threadID, event.messageID);
      }

      if (result.length == 0)
        return api.sendMessage("⭕ No search results match the keyword:" + keyWord, event.threadID, event.messageID);

      let msg = "";
      let i = 1;
      const thumbnails = [];
      for (const info of result) {
        thumbnails.push(diptoSt(info.thumbnail, 'photo.jpg'));
        msg += `${i++}. ${info.title}\nTime: ${info.time}\nChannel: ${info.channel.name}\n\n`;
      }

      api.sendMessage({
        body: msg + "Reply to this message with a number of the song you want to listen ✨",
        attachment: await Promise.all(thumbnails)
      }, event.threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName,
          messageID: info.messageID,
          author: sender,
          result,
          cost: COST,
          oldBalance: userData.money
        });
      }, event.messageID);

    } catch (error) {
      console.log(error);
      api.sendMessage("Uwuuu~ Something went wrong (>_<)💦", event.threadID);
    }
  },

  onReply: async ({ event, api, Reply, usersData }) => {
    try {
      const { result, cost, oldBalance } = Reply;
      const choice = parseInt(event.body);
      if (!isNaN(choice) && choice <= result.length && choice > 0) {
        const infoChoice = result[choice - 1];
        const idvideo = infoChoice.id;
        const { data: { title, downloadLink, quality } } = await axios.get(`${await baseApiUrl()}/ytDl3?link=${idvideo}&format=mp3`);

        const user = event.senderID;
        const userData = await usersData.get(user);
        await usersData.set(user, { ...userData, money: userData.money - cost });

        await api.unsendMessage(Reply.messageID);
        await api.sendMessage({
          body: `🎶 Nyaa~ ${title} is ready!\n💎 Coins used: ${cost}\n💰 Remaining balance: ${userData.money - cost}`,
          attachment: await dipto(downloadLink, 'audio.mp3')
        }, event.threadID, () => fs.unlinkSync('audio.mp3'), event.messageID);
      } else {
        api.sendMessage("❌ Invalid choice. Please enter a number between 1 and 6.", event.threadID, event.messageID);
      }
    } catch (error) {
      console.log(error);
      api.sendMessage("⭕ Sorry, audio size was less than 26MB or an error occurred.", event.threadID, event.messageID);
    }
  }
};

async function dipto(url, pathName) {
  const response = (await axios.get(url, { responseType: "arraybuffer" })).data;
  fs.writeFileSync(pathName, Buffer.from(response));
  return fs.createReadStream(pathName);
}

async function diptoSt(url, pathName) {
  const response = await axios.get(url, { responseType: "stream" });
  response.data.path = pathName;
  return response.data;
}
