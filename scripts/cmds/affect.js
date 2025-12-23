const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

// --- Unicode bold italic map ---
const boldItalicMap = {
  a:"𝙖",b:"𝙗",c:"𝙘",d:"𝙙",e:"𝙚",f:"𝙛",g:"𝙜",h:"𝙝",i:"𝙞",j:"𝙟",k:"𝙠",l:"𝙡",m:"𝙢",
  n:"𝙣",o:"𝙤",p:"𝙥",q:"𝙦",r:"𝙧",s:"𝙨",t:"𝙩",u:"𝙪",v:"𝙫",w:"𝙬",x:"𝙭",y:"𝙮",z:"𝙯",
  A:"𝘼",B:"𝘽",C:"𝘾",D:"𝘿",E:"𝙀",F:"𝙁",G:"𝙂",H:"𝙃",I:"𝙄",J:"𝙅",K:"𝙆",L:"𝙇",M:"𝙈",
  N:"𝙉",O:"𝙊",P:"𝙋",Q:"𝙌",R:"𝙍",S:"𝙎",T:"𝙏",U:"𝙐",V:"𝙑",W:"𝙒",X:"𝙓",Y:"𝙔",Z:"𝙕",
  "0":"𝟬","1":"𝟭","2":"𝟮","3":"𝟯","4":"𝟰","5":"𝟱","6":"𝟲","7":"𝟳","8":"𝟴","9":"𝟵","!":"❗","?":"❓",
  ".":"﹒",",":"﹐","'":"’","\"":'”',":":"꞉",";":"；","-":"−","_":"＿","/":"／","\\":"＼","&":"＆","%":"％",
  " ":" "
};

function toBoldItalic(str){
  return str.split("").map(c => boldItalicMap[c] || c).join("");
}

// --- Helper: FB avatar buffer using access token ---
async function getFbAvatarBuffer(uid) {
  const url = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
  const res = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(res.data);
}

module.exports = {
  config: {
    name: "affect",
    version: "2.0",
    author: "Saif",
    countDown: 0,
    role: 0,
    shortDescription: "Affect image with anime style",
    longDescription: "Affect image with coins",
    category: "fun",
    guide: "{pn} [@tag | r | rnd | random]"
  },

  onStart: async function({ event, message, usersData, api, args }) {
    const COST = 500;
    const senderID = event.senderID;

    // --- Check balance ---
    let user = await usersData.get(senderID);
    let balance = user.money || 0;
    if (balance < COST) return message.reply(toBoldItalic(`🌸 senpai… you need ${COST} coins!\n💰 your balance: ${balance} coins!`));

    // Deduct coins
    await usersData.set(senderID, { ...user, money: balance - COST });
    const remaining = balance - COST;

    // --- Determine target ---
    const mention = Object.keys(event.mentions);
    let targetID;

    if (args[0] && ["r", "rnd", "random"].includes(args[0].toLowerCase())) {
      const allUsers = await api.getThreadInfo(event.threadID)
        .then(res => res.participantIDs.filter(id => id != senderID && id != api.getCurrentUserID()));
      if (!allUsers.length) return message.reply(toBoldItalic("nyaa~ no one to affect!"));
      targetID = allUsers[Math.floor(Math.random() * allUsers.length)];
    } else if (mention.length > 0) {
      targetID = mention[0];
    } else if (event.type === "message_reply" && event.messageReply) {
      targetID = event.messageReply.senderID;
    } else {
      return message.reply(toBoldItalic("🌸 tag, reply, or use r/rnd/random!"));
    }

    if (targetID === senderID) return message.reply(toBoldItalic("ara ara~ you can't affect yourself baka (>///<)"));

    // --- Names ---
    const senderInfo = await api.getUserInfo([senderID]);
    const nameSender = Object.values(senderInfo)[0].name;

    const targetInfo = await api.getUserInfo([targetID]);
    const nameTarget = Object.values(targetInfo)[0].name;

    // --- Generate image ---
    const avatarURL = await getFbAvatarBuffer(targetID);
    const img = await new DIG.Affect().getImage(avatarURL);
    const tmpDir = path.join(__dirname, "tmp");
    fs.ensureDirSync(tmpDir);
    const pathSave = path.join(tmpDir, `${targetID}_Affect.png`);
    fs.writeFileSync(pathSave, Buffer.from(img));

    // --- Anime-style final message ---
    const animeReplies = [
      `nyaa~ ${nameSender} affected ${nameTarget}!`,
      `baka! ${nameTarget}-san got affected by ${nameSender}-chan 💥`,
      `${nameTarget}-kun is now under ${nameSender}-senpai's magic 😼`,
      `sugoi ${nameSender} made ${nameTarget}-san affected! ⚡`,
      `ara ara… ${nameSender} did a super affect on ${nameTarget}-kun 💫`
    ];
    const chosenReply = toBoldItalic(animeReplies[Math.floor(Math.random() * animeReplies.length)]);

    // --- Send final message ---
    await message.reply({
      body: `${chosenReply}\n\n${toBoldItalic(`💸 deducted: ${COST} coins!\n💳 remaining: ${remaining}`)}`,
      attachment: fs.createReadStream(pathSave)
    });

    fs.unlinkSync(pathSave);
  }
};
