const fs = require("fs-extra");
const path = require("path");

const DATA_FILE = path.join(__dirname, "pw_data.json");

module.exports = {
  config: {
    name: "pw",
    aliases: ["autopropose"],
    version: "7.1",
    author: "Senpai",
    countDown: 3,
    role: 2,
    shortDescription: "Auto propose system",
    longDescription: "",
    category: "love",
    guide: "{pn} on/off/status (reply/tag/uid supported)"
  },

  loadData() {
    if (!fs.existsSync(DATA_FILE))
      fs.writeJsonSync(DATA_FILE, {});
    return fs.readJsonSync(DATA_FILE);
  },

  saveData(data) {
    fs.writeJsonSync(DATA_FILE, data, { spaces: 2 });
  },

  // =====================================================
  // ON / OFF / STATUS
  // =====================================================
  async onStart({ event, api, args, usersData }) {
    const threadID = event.threadID;
    const messageID = event.messageID;
    const data = this.loadData();

    if (!data[threadID]) data[threadID] = {};
    if (!Array.isArray(data[threadID].targets)) data[threadID].targets = [];

    const list = data[threadID].targets;
    const sub = (args[0] || "").toLowerCase();

    // STATUS
    if (sub === "status") {
      if (list.length === 0)
        return api.sendMessage("এই গ্রুপে কারো PW চলছে না।", threadID, messageID);

      let msg = "বর্তমানে PW চলছে:\n\n";
      for (let i = 0; i < list.length; i++) {
        let name = await usersData.getName(list[i]);
        msg += `${i + 1}. ${name} (${list[i]})\n`;
      }
      return api.sendMessage(msg, threadID, messageID);
    }

    // ON
    if (sub === "on") {
      let targetID = null;

      if (event.messageReply)
        targetID = event.messageReply.senderID;

      if (event.mentions && Object.keys(event.mentions).length > 0)
        targetID = Object.keys(event.mentions)[0];

      if (!targetID && args[1] && /^\d+$/.test(args[1]))
        targetID = args[1];

      if (!targetID)
        return api.sendMessage("reply/tag/uid দিয়ে আবার চেষ্টা করুন।", threadID, messageID);

      if (!list.includes(targetID))
        list.push(targetID);

      this.saveData(data);

      const name = await usersData.getName(targetID);
      return api.sendMessage(
        `Auto-Propose চালু হয়েছে।\nTarget: ${name}`,
        threadID,
        messageID
      );
    }

    // OFF → Global PW OFF
    if (sub === "off") {
      if (list.length === 0)
        return api.sendMessage("এই গ্রুপে কারো PW চালু নেই।", threadID, messageID);

      let msg = "যার PW বন্ধ করতে চান তার নম্বর রিপ্লাই দিন:\n\n";
      for (let i = 0; i < list.length; i++) {
        let n = await usersData.getName(list[i]);
        msg += `${i + 1}. ${n}\n`;
      }

      return api.sendMessage(msg, threadID, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          threadID,
          messageID: info.messageID,
          author: event.senderID,
          type: "off-global"
        });
      });
    }

    return api.sendMessage("Use pw on/off/status", threadID, messageID);
  },

  // =====================================================
  // GLOBAL OFF HANDLER
  // =====================================================
  async onReply({ event, api, usersData, Reply }) {
    if (Reply.type !== "off-global") return;

    if (event.senderID !== Reply.author)
      return;

    const data = this.loadData();
    const threadID = Reply.threadID;
    const list = data[threadID].targets;

    const choice = parseInt(event.body.trim());

    if (!choice || choice < 1 || choice > list.length)
      return api.sendMessage("ভুল নাম্বার দিয়েছেন।", threadID, event.messageID);

    const targetID = list[choice - 1];
    const name = await usersData.getName(targetID);

    // GLOBAL OFF → সব গ্রুপ থেকে ওই user PW OFF
    for (const tID in data) {
      if (Array.isArray(data[tID].targets)) {
        data[tID].targets = data[tID].targets.filter(uid => uid !== targetID);
      }
    }

    this.saveData(data);

    return api.sendMessage(
      `${name}-এর PW সব গ্রুপ থেকে OFF করা হলো।`,
      threadID,
      event.messageID
    );
  },

  // =====================================================
  // AUTO TRIGGER
  // =====================================================
  async onChat({ event, api, usersData }) {
    const threadID = event.threadID;
    const senderID = event.senderID;

    const data = this.loadData();

    if (!data[threadID]) return;
    if (!Array.isArray(data[threadID].targets)) return;
    const list = data[threadID].targets;

    if (!list.includes(senderID)) return;

    const targetName = await usersData.getName(senderID);

    const reacts = ["❤️","💛","🖤","🤎","💜","💚","💝","🧡","💖"];
    const reactPick = reacts[Math.floor(Math.random() * reacts.length)];

    api.setMessageReaction(reactPick, event.messageID, () => {}, true);

    // 40+ CAPTIONS
    const captions = [
      `${targetName}, তোমাকে ছাড়া পৃথিবীটা অসম্পূর্ণ লাগে।`,
      `${targetName}, তোমার চোখে তাকালে মনে হয় এটাই আমার ঘর।`,
      `${targetName}, তোমার কথা ভাবলেই মনটা নরম হয়ে যায়।`,
      `${targetName}, তুমি থাকলে আমার সব ভয় হারায়।`,
      `${targetName}, তুমি আমার অনুভূতির সবচেয়ে সত্যি অংশ।`,
      `${targetName}, তোমাকে ছাড়া অন্য কাউকে ভাবতে পারি না।`,
      `${targetName}, তোমাকে হারানোর ভয়টাই আমার দুর্বলতা।`,
      `${targetName}, তুমি থাকলে জীবনটা সুন্দর হয়ে যায়।`,
      `${targetName}, তোমার হাসিটা আমার দিনের শান্তি।`,
      `${targetName}, তুমি চাইলে আমি পুরো জীবন বদলে দিতে পারি।`,
      `${targetName}, তোমাকে ছাড়া কিছুই সম্পূর্ণ লাগে না।`,
      `${targetName}, তোমাকে ভাবলেই মনে হয় সব ঠিক হয়ে যাবে।`,
      `${targetName}, তুমি আমার কাছে অনুভূতির নামে পরিচিত।`,
      `${targetName}, তোমার কাছেই আমার মনটা আটকে থাকে।`,
      `${targetName}, তোমার কথা না ভাবার চেষ্টা করেও পারি না।`,
      `${targetName}, তুমি থাকলে পৃথিবীটা অন্যরকম লাগে।`,
      `${targetName}, তোমার কণ্ঠটাই আমার সবচেয়ে প্রিয় শব্দ।`,
      `${targetName}, তোমার কাছে একটু জায়গা চাই… খুব ছোট্ট, কিন্তু সত্যি।`,
      `${targetName}, তুমি আরেকটু কাছে এলে আমি বদলে যাই।`,
      `${targetName}, তোমার জন্য আমার মনটা প্রতিদিন নরম হয়।`,
      `${targetName}, তুমি বুঝতে পারো না, তোমাকে কতটা ভালোবাসি।`,
      `${targetName}, তোমার নামটা শোনার পরই মন ভালো হয়ে যায়।`,
      `${targetName}, তুমি থাকলে সব দুঃখ ভুলে যাই।`,
      `${targetName}, তোমাকেই চাই… আজ, কাল, সবসময়।`,
      `${targetName}, তোমার অস্তিত্বই আমার জীবনের শান্তি।`,
      `${targetName}, তোমার জন্য মনটা প্রতিদিন একটু করে বদলায়।`,
      `${targetName}, তুমি পাশে থাকলে সব সহজ হয়ে যায়।`,
      `${targetName}, তোমার কাছেই আমার মন বারবার ফিরে আসে।`,
      `${targetName}, তোমাকে ছাড়া আমার কিছুই ভালো লাগে না।`,
      `${targetName}, তুমি আমার জীবনের সবচেয়ে সুন্দর প্রয়োজন।`,
      `${targetName}, তোমার presence আমার vibe পুরো বদলে দেয়।`,
      `${targetName}, তোমার একটা মেসেজেই পুরো mood ঠিক হয়ে যায়।`,
      `${targetName}, তুমি হাসলে আমার পৃথিবী হালকা লাগে।`,
      `${targetName}, তুমি না থাকলে সবকিছু ফাঁকা লাগে।`,
      `${targetName}, তোমাকে ছাড়া দিনটা অসম্পূর্ণ থাকে।`,
      `${targetName}, তুমি আমার মনকে শান্ত করার মানুষ।`,
      `${targetName}, তোমার কথা মনে পড়লে চোখে হাসি চলে আসে।`,
      `${targetName}, তোমাকে দেখলে মনে হয়—হ্যাঁ, এটাই আমার!`,
      `${targetName}, তুমি আমার সবচেয়ে প্রিয় অভ্যাস।`,
      `${targetName}, তোমাকে পেলে—সব পেয়ে যাই।`
    ];

    const pick = captions[Math.floor(Math.random() * captions.length)];

    api.sendMessage(pick, threadID, event.messageID);
  }
};
