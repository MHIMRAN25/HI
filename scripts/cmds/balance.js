// Number shorthand parser
function parseAmount(str) {
  if (!str) return NaN;
  str = str.toLowerCase();

  const map = {
    k: 1e3, m: 1e6, b: 1e9, t: 1e12,
    q: 1e15, qa: 1e18, qd: 1e21, sx: 1e24,
    sp: 1e27, oc: 1e30, no: 1e33, dc: 1e36
  };

  for (let key in map) {
    if (str.endsWith(key)) {
      let num = parseFloat(str.replace(key, ""));
      return num * map[key];
    }
  }
  return parseFloat(str);
}

// Format number with commas
function addCommas(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Format number with shorthand (K, M, B…)
function formatMoney(amount) {
  const units = [
    { v: 1e36, s: "Dc" },
    { v: 1e33, s: "No" },
    { v: 1e30, s: "Oc" },
    { v: 1e27, s: "Sp" },
    { v: 1e24, s: "Sx" },
    { v: 1e21, s: "Qd" },
    { v: 1e18, s: "Qa" },
    { v: 1e15, s: "Q" },
    { v: 1e12, s: "T" },
    { v: 1e9,  s: "B" },
    { v: 1e6,  s: "M" },
    { v: 1e3,  s: "K" }
  ];
  for (let u of units) {
    if (amount >= u.v) return (amount / u.v).toFixed(2) + u.s;
  }
  return addCommas(amount);
}

// Style-4 Fancy Font
function fancy(text) {
  const map = {
    A:"𝐀",B:"𝐁",C:"𝐂",D:"𝐃",E:"𝐄",F:"𝐅",G:"𝐆",H:"𝐇",I:"𝐈",J:"𝐉",
    K:"𝐊",L:"𝐋",M:"𝐌",N:"𝐍",O:"𝐎",P:"𝐏",Q:"𝐐",R:"𝐑",S:"𝐒",T:"𝐓",
    U:"𝐔",V:"𝐕",W:"𝐖",X:"𝐗",Y:"𝐘",Z:"𝐙",
    a:"𝐚",b:"𝐛",c:"𝐜",d:"𝐝",e:"𝐞",f:"𝐟",g:"𝐠",h:"𝐡",i:"𝐢",j:"𝐣",
    k:"𝐤",l:"𝐥",m:"𝐦",n:"𝐧",o:"𝐨",p:"𝐩",q:"𝐪",r:"𝐫",s:"𝐬",t:"𝐭",
    u:"𝐮",v:"𝐯",w:"𝐰",x:"𝐱",y:"𝐲",z:"𝐳",
    0:"𝟎",1:"𝟏",2:"𝟐",3:"𝟑",4:"𝟒",5:"𝟓",6:"𝟔",7:"𝟕",8:"𝟖",9:"𝟗"
  };
  return text.split("").map(c => map[c] || c).join("");
}

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal"],
    version: "4.1",
    author: "Saif",
    countDown: 5,
    role: 0,
    description: "View or transfer balance with stylish UI",
    category: "bank"
  },

  onStart: async function ({ message, usersData, event, args }) {

    const adminIDs = [
      "100081317798618",
      "100078639797619",
      "100001946540538",
      "61581271750258",
      "2871953095"
    ];

    const reply = event.messageReply;
    const targetID = reply ? reply.senderID : event.senderID;

    const senderData = await usersData.get(event.senderID);
    const senderName = senderData.name || "User";

    const targetData = await usersData.get(targetID);
    const targetName = targetData.name || "User";

    // ---------------------- ADMIN ADD ----------------------
    if (args[0] === "add") {
      if (!adminIDs.includes(event.senderID))
        return message.reply("❌ Only admin can add money.");

      const amount = parseAmount(args[1]);
      if (isNaN(amount) || amount <= 0)
        return message.reply("❌ Invalid amount.");

      senderData.money += amount;
      await usersData.set(event.senderID, senderData);

      return message.reply(
        `🎀 ${fancy("Hey")} ${fancy(senderName)}\n` +
        `${fancy("Added")} ${fancy(formatMoney(amount))}\n` +
        `${fancy("New Balance Is")} ${fancy(formatMoney(senderData.money))}`
      );
    }

    // ---------------------- TRANSFER ----------------------
    if (args[0] === "transfer") {

      if (!reply)
        return message.reply("❌ Reply to someone to transfer.");

      const amount = parseAmount(args[1]);
      if (isNaN(amount) || amount <= 0)
        return message.reply("❌ Invalid amount.");

      if (senderData.money < amount)
        return message.reply("❌ You don't have enough money.");

      // Transfer
      senderData.money -= amount;
      targetData.money += amount;

      await usersData.set(event.senderID, senderData);
      await usersData.set(targetID, targetData);

      return message.reply(
        `🎀 ${fancy("Hey")} ${fancy(senderName)}\n` +
        `${fancy("You Transferred")} ${fancy(formatMoney(amount))} ${fancy("To")} "${fancy(targetName)}"\n` +
        `${fancy("Your New Balance Is")} ${fancy(formatMoney(senderData.money))}`
      );
    }

    // ---------------------- CHECK BALANCE ----------------------
    if (targetID === event.senderID) {
      return message.reply(
        `🎀 ${fancy("Hey")} ${fancy(senderName)}\n` +
        `${fancy("Your Balance Is")} ${fancy(formatMoney(senderData.money))}`
      );
    }

    return message.reply(
      `🎀 ${fancy("Hey")} "${fancy(targetName)}"\n` +
      `${fancy("Balance Is")} ${fancy(formatMoney(targetData.money))}`
    );
  }
};
