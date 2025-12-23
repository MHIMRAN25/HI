const { getStreamFromURL } = global.utils;

module.exports = {
  config: {
    name: "spy",
    aliases: ["s"],
    version: "1.2",
    role: 0,
    author: "Tamim",
    description: "Get user information and profile photo",
    category: "information",
    countDown: 10,
  },

  onStart: async function ({ event, message, usersData, api, args }) {
    try {
      const uid1 = event.senderID;
      const uid2 = Object.keys(event.mentions)[0];
      let uid;

      if (args[0]) {
        if (/^\d+$/.test(args[0])) uid = args[0];
        else {
          const match = args[0].match(/profile\.php\?id=(\d+)/);
          if (match) uid = match[1];
        }
      }

      if (!uid) {
        uid =
          event.type === "message_reply"
            ? event.messageReply.senderID
            : uid2 || uid1;
      }

      const userInfo = await api.getUserInfo(uid);

      // ==== FIXED AVATAR USING ACCESS TOKEN ====
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarStream = await getStreamFromURL(avatarUrl);

      let genderText;
      switch (userInfo[uid].gender) {
        case 1:
          genderText = "Girl 🙋‍♀️";
          break;
        case 2:
          genderText = "Boy 🙋";
          break;
        default:
          genderText = "Gay 🤷";
      }

      const userData = await usersData.get(uid);
      const money = userData.money || 0;
      const allUser = await usersData.getAll();
      const rank =
        allUser.slice().sort((a, b) => b.exp - a.exp).findIndex((u) => u.userID === uid) + 1;
      const moneyRank =
        allUser.slice().sort((a, b) => b.money - a.money).findIndex((u) => u.userID === uid) + 1;

      const position = userInfo[uid].type;
      const babyTeach = 0;

      const info = `
╭━━━[ 💫 𝐔𝐒𝐄𝐑 𝐈𝐍𝐅𝐎 💫 ]━━━╮
┃ 👤 𝐍𝐚𝐦𝐞: ❀ ${userInfo[uid].name}
┃ 🌟 𝐆𝐞𝐧𝐝𝐞𝐫: ♡ ${genderText}
┃ 🆔 𝐔𝐈𝐃: ✧ ${uid}
┃ 💼 𝐂𝐥𝐚𝐬𝐬: ✦ ${position ? position?.toUpperCase() : "Normal User🥺"}
┃ 🌐 𝐔𝐬𝐞𝐫𝐧𝐚𝐦𝐞: ✪ ${userInfo[uid].vanity || "None"}
┃ 🔗 𝐏𝐫𝐨𝐟𝐢𝐥𝐞 𝐔𝐑𝐋: ✿ ${userInfo[uid].profileUrl}
┃ ✨ 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲: ❁ ${userInfo[uid].isBirthday !== false ? userInfo[uid].isBirthday : "Private"}
┃ 🏷️ 𝐍𝐢𝐜𝐤𝐧𝐚𝐦𝐞: ❂ ${userInfo[uid].alternateName || "None"}
┃ 🤖 𝐅𝐫𝐢𝐞𝐧𝐝 𝐰𝐢𝐭𝐡 𝐁𝐨𝐭: ♡ ${userInfo[uid].isFriend ? "Yes✅" : "No❎"}
╰━━━━━━━━━━━━━━━━━━━━━━╯
╭━━━[ 𝗨𝗦𝗘𝗥 𝗦𝗧𝗔𝗧𝗦 ]━━━╮
┃ ✦ 𝗠𝗼𝗻𝗲𝘆: $${formatMoney(money)}
┃ ✦ 𝗥𝗮𝗻𝗸: #${rank}/${allUser.length}
┃ ✦ 𝗠𝗼𝗻𝗲𝘆 𝗥𝗮𝗻𝗸: #${moneyRank}/${allUser.length}
┃ ✦ 𝗕𝗮𝗯𝘆 𝗧𝗲𝗮𝗰𝗵: ${babyTeach || 0}
╰━━━━━━━━━━━━━━━━━━━━━━╯`;

      message.reply({
        body: info,
        attachment: avatarStream
      });
    } catch (err) {
      console.log(err);
      message.reply("❌ Something went wrong while fetching user info.");
    }
  },
};

function formatMoney(num) {
  const units = ["", "K", "M", "B", "T", "Q"];
  let unit = 0;
  while (num >= 1000 && ++unit < units.length) num /= 1000;
  return num.toFixed(1).replace(/\.0$/, "") + units[unit];
}
