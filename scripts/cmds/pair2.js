const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "pair2",
    version: "2.2",
    author: "MahMUD",
    category: "love",
    guide: "{prefix}pair",
    envConfig: {
      cost: 500
    }
  },

  onStart: async function ({ event, threadsData, message, usersData, api }) {
    const COST = module.exports.config.envConfig.cost || 500;
    const senderID = event.senderID;

    try {
      // ==== CHECK BALANCE ====
      let userData = await usersData.get(senderID);
      let balance = userData.money || 0;

      if (balance < COST)
        return message.reply(`💸 𝐒𝐞𝐧𝐩𝐚𝐢… 𝐲𝐨𝐮 𝐧𝐞𝐞𝐝 **${COST} 𝐜𝐨𝐢𝐧𝐬** 𝐭𝐨 𝐮𝐬𝐞 𝐭𝐡𝐢𝐬!\n💰 𝐘𝐨𝐮𝐫 𝐛𝐚𝐥𝐚𝐧𝐜𝐞: **${balance} 𝐜𝐨𝐢𝐧𝐬**`);

      // Deduct coins
      await usersData.set(senderID, { ...userData, money: balance - COST });
      const remaining = balance - COST;

      // ==== FETCH THREAD MEMBERS ====
      const threadData = await threadsData.get(event.threadID);
      if (!threadData || !Array.isArray(threadData.members))
        return message.reply("❌ 𝐂𝐨𝐮𝐥𝐝 𝐧𝐨𝐭 𝐟𝐞𝐭𝐜𝐡 𝐭𝐡𝐫𝐞𝐚𝐝 𝐦𝐞𝐦𝐛𝐞𝐫𝐬.");

      const senderInfo = threadData.members.find(mem => (mem.userID == senderID || mem.id == senderID));
      const gender1 = senderInfo?.gender || "MALE"; 
      const oppositeGender = gender1 === "MALE" ? "FEMALE" : "MALE";

      // ==== SELECT TARGET ====
      let targetID;
      if (event.messageReply) {
        targetID = event.messageReply.senderID;
      } else if (Object.keys(event.mentions)[0]) {
        targetID = Object.keys(event.mentions)[0];
      } else {
        const candidates = threadData.members.filter(mem => {
          const memGender = mem.gender;
          const memId = mem.userID ?? mem.id;
          return memGender === oppositeGender && memId !== senderID;
        });
        targetID = candidates.length ? candidates[Math.floor(Math.random() * candidates.length)].userID ?? candidates[Math.floor(Math.random() * candidates.length)].id : senderID;
      }

      // ==== FETCH NAMES ====
      let name1 = await usersData.getName(senderID) || "Unknown";
      let name2 = await usersData.getName(targetID) || "Unknown";

      // ==== FULL BOLD GENERATOR ====
      const toBoldUnicode = (text) => {
        const bold = {
          "a":"𝐚","b":"𝐛","c":"𝐜","d":"𝐝","e":"𝐞","f":"𝐟","g":"𝐠","h":"𝐡","i":"𝐢","j":"𝐣",
          "k":"𝐤","l":"𝐥","m":"𝐦","n":"𝐧","o":"𝐨","p":"𝐩","q":"𝐪","r":"𝐫","s":"𝐬","t":"𝐭",
          "u":"𝐮","v":"𝐯","w":"𝐰","x":"𝐱","y":"𝐲","z":"𝐳",
          "A":"𝐀","B":"𝐁","C":"𝐂","D":"𝐃","E":"𝐄","F":"𝐅","G":"𝐆","H":"𝐇","I":"𝐈","J":"𝐉",
          "K":"𝐊","L":"𝐋","M":"𝐌","N":"𝐍","O":"𝐎","P":"𝐏","Q":"𝐐","R":"𝐑","S":"𝐒","T":"𝐓",
          "U":"𝐔","V":"𝐕","W":"𝐖","X":"𝐗","Y":"𝐘","Z":"𝐙",
          "0":"0","1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9",
          " ":" ","!":"!","?":"?","'":"'","-":"-",".":".",",":","
        };
        return String(text).split('').map(c => bold[c] || c).join('');
      };

      // Bold everything
      name1 = toBoldUnicode(name1);
      name2 = toBoldUnicode(name2);

      const lovePercent = Math.floor(Math.random() * 36) + 65;
      const compatibility = Math.floor(Math.random() * 36) + 65;

      let messageBody = `
💖 𝐍𝐞𝐰 𝐏𝐚𝐢𝐫 𝐀𝐥𝐞𝐫𝐭! 💖

🎉 𝐄𝐯𝐞𝐫𝐲𝐨𝐧𝐞, 𝐥𝐞𝐭'𝐬 𝐜𝐨𝐧𝐠𝐫𝐚𝐭𝐮𝐥𝐚𝐭𝐞 𝐨𝐮𝐫 𝐥𝐨𝐯𝐞𝐥𝐲 𝐧𝐞𝐰 𝐜𝐨𝐮𝐩𝐥𝐞:

• ${name1}  
• ${name2}

❤ 𝐋𝐨𝐯𝐞 𝐏𝐞𝐫𝐜𝐞𝐧𝐭𝐚𝐠𝐞: ${lovePercent}%  
🌟 𝐂𝐨𝐦𝐩𝐚𝐭𝐢𝐛𝐢𝐥𝐢𝐭𝐲: ${compatibility}%

💰 𝐂𝐨𝐢𝐧𝐬 𝐃𝐞𝐝𝐮𝐜𝐭𝐞𝐝: ${COST}  
💳 𝐑𝐞𝐦𝐚𝐢𝐧𝐢𝐧𝐠 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${remaining}`;

      // ==== FETCH AVATARS ====
      const attachments = [];
      try {
        const avatar1 = await getStreamFromURL(`https://graph.facebook.com/${senderID}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
        if (avatar1) attachments.push(avatar1);

        const avatar2 = await getStreamFromURL(`https://graph.facebook.com/${targetID}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
        if (avatar2) attachments.push(avatar2);
      } catch {}

      // ==== SEND MESSAGE ====
      if (attachments.length > 0)
        await api.sendMessage({ body: messageBody, attachment: attachments }, event.threadID, event.messageID);
      else
        await api.sendMessage(messageBody, event.threadID, event.messageID);

    } catch (err) {
      console.error(err);
      return api.sendMessage("❌ 𝐀𝐧 𝐮𝐧𝐞𝐱𝐩𝐞𝐜𝐭𝐞𝐝 𝐞𝐫𝐫𝐨𝐫 𝐨𝐜𝐜𝐮𝐫𝐫𝐞𝐝.", event.threadID, event.messageID);
    }
  }
};
