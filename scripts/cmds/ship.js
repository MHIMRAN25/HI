const { resolve } = require("path");
const fs = require("fs-extra");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "ship",
    author: "Saif",
    version: "9.0",
    countDown: 5,
    role: 0,
    category: "love",
    shortDescription: { en: "Pair users with a cute anime-style ship! 💘" },
  },

  onLoad: async function() {
    const { downloadFile } = global.utils;
    const dir = __dirname + "/cache/canvas/";
    const pathImg = resolve(dir, "pairing.jpg");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(pathImg)) {
      await downloadFile(
        "https://i.pinimg.com/736x/15/fa/9d/15fa9d71cdd07486bb6f728dae2fb264.jpg",
        pathImg
      );
    }
  },

  circle: async function(image) {
    image = await jimp.read(image);
    image.circle();
    return await image.getBufferAsync("image/png");
  },

  makeImage: async function({ one, two }) {
    const __root = resolve(__dirname, "cache/canvas");
    const pairing_img = await jimp.read(resolve(__root, "pairing.jpg"));
    const pathImg = __root + `/pairing_${one}_${two}.png`;
    const avatarOne = __root + `/avLt_${one}.png`;
    const avatarTwo = __root + `/avLt_${two}.png`;

    const fetchAvatar = async (id, path) => {
      try {
        const res = await axios.get(
          `https://graph.facebook.com/${id}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        );
        fs.writeFileSync(path, res.data);
      } catch {
        fs.copyFileSync(resolve(__root, "pairing.jpg"), path);
      }
    };

    await fetchAvatar(one, avatarOne);
    await fetchAvatar(two, avatarTwo);

    const circleOne = await jimp.read(await this.circle(avatarOne));
    const circleTwo = await jimp.read(await this.circle(avatarTwo));

    pairing_img.composite(circleOne.resize(85, 85), 355, 100)
               .composite(circleTwo.resize(75, 75), 250, 140);

    await pairing_img.writeAsync(pathImg);
    fs.unlinkSync(avatarOne);
    fs.unlinkSync(avatarTwo);
    return pathImg;
  },

  onStart: async function({ api, event, usersData }) {
    try {
      const COST = 500;
      const sender = event.senderID;
      let user = (await usersData.get(sender)) || { money: 0 };

      if (user.money < COST)
        return api.sendMessage(
          `🌸 Senpai… you need **${COST} coins** to use this! 💰 Your balance: ${user.money} coins`,
          event.threadID
        );

      await usersData.set(sender, { ...user, money: user.money - COST });
      const remaining = user.money - COST;

      let target, targetName;
      let participants = [];

      try {
        const threadInfo = await api.getThreadInfo(event.threadID);
        participants = threadInfo.participantIDs.filter(id => id !== sender && id !== api.getCurrentUserID());
      } catch {}
      if (participants.length === 0) participants = [sender];

      // Mention mode
      if (Object.keys(event.mentions)[0]) {
        target = Object.keys(event.mentions)[0];
        targetName = event.mentions[target];
      }
      // Reply mode
      else if (event.type === "message_reply") {
        target = event.messageReply.senderID;
        targetName = await usersData.getName(target);
      }
      // Gender-safe random
      else {
        let senderGender = 0;
        try {
          const sData = await api.getUserInfo(sender);
          senderGender = sData[sender]?.gender || 0;
        } catch {}

        let filtered = [];
        for (let id of participants) {
          try {
            const tData = await api.getUserInfo(id);
            const g = tData[id]?.gender || 0;
            if ((senderGender === 2 && g === 1) || (senderGender === 1 && g === 2)) filtered.push(id);
          } catch {}
        }

        // Retry loop to ensure opposite gender
        if (!filtered.length) {
          for (let id of participants) {
            try {
              const tData = await api.getUserInfo(id);
              const g = tData[id]?.gender || 0;
              if ((senderGender === 2 && g === 1) || (senderGender === 1 && g === 2)) {
                filtered.push(id);
              }
            } catch {}
          }
        }

        // Fallback if still empty
        if (!filtered.length) filtered = participants;

        target = filtered[Math.floor(Math.random() * filtered.length)];
        targetName = await usersData.getName(target);
      }

      if (target === sender)
        return api.sendMessage("Ara ara… you can't pair with yourself! baka~ (>///<)", event.threadID);

      let gender = "Tran Duc Bo";
      try {
        const tData = await api.getUserInfo(target);
        const sex = tData[target]?.gender;
        gender = sex === 2 ? "Male🧑" : sex === 1 ? "Female👩‍" : gender;
      } catch {}

      const pathImg = await this.makeImage({ one: sender, two: target });

      const senderName = await usersData.getName(sender);
      const animeReplies = [
        `Nyaa~ ${senderName}-kun paired with ${targetName} ${gender}! ✨`,
        `${targetName}-san ${gender} is now in a super cute ship with ${senderName}-chan! 💕`,
        `Baka! ${targetName} ${gender} got shippped by ${senderName}-kun 😼`,
        `Sugoiii~ ${senderName} used SHIP! ${targetName} ${gender} is blushing! ⚡`,
        `${targetName}-kun ${gender} didn’t escape… *SHIPPPP!* 💫`,
        `Ara ara~ ${senderName} and ${targetName} ${gender} are a spicy pair! 🔥`
      ];
      const chosenReply = animeReplies[Math.floor(Math.random() * animeReplies.length)];

      const arraytag = [
        { id: sender, tag: senderName },
        { id: target, tag: targetName }
      ];

      await api.sendMessage({
        body: `${chosenReply}\n\n💸 ${COST} coins deducted!\n💳 Remaining: ${remaining} coins`,
        mentions: arraytag,
        attachment: fs.createReadStream(pathImg)
      }, event.threadID, () => fs.unlinkSync(pathImg));

    } catch (err) {
      console.log("SHIP ERROR:", err);
      return api.sendMessage("Uwuuu~ Something went wrong (>_<)💦", event.threadID);
    }
  }
};
