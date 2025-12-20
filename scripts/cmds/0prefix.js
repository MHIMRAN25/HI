const fs = require("fs-extra");
const { utils } = global;

module.exports = {
	config: {
		name: "prefix",
		version: "3.3",
		author: "Saif",
		countDown: 5,
		role: 0,
		description: "Change or check prefix",
		category: "information",
	},

	langs: {
		en: {
			reset: "𝐘𝐨𝐮𝐫 𝐩𝐫𝐞𝐟𝐢𝐱 𝐡𝐚𝐬 𝐛𝐞𝐞𝐧 𝐫𝐞𝐬𝐞𝐭 𝐭𝐨 𝐝𝐞𝐟𝐚𝐮𝐥𝐭: %1",
			onlyAdmin: "𝐎𝐧𝐥𝐲 𝐚𝐝𝐦𝐢𝐧 𝐜𝐚𝐧 𝐜𝐡𝐚𝐧𝐠𝐞 𝐭𝐡𝐞 𝐬𝐲𝐬𝐭𝐞𝐦 𝐩𝐫𝐞𝐟𝐢𝐱",
			confirmGlobal: "𝐑𝐞𝐚𝐜𝐭 𝐭𝐨 𝐭𝐡𝐢𝐬 𝐦𝐞𝐬𝐬𝐚𝐠𝐞 𝐭𝐨 𝐜𝐨𝐧𝐟𝐢𝐫𝐦 𝐬𝐲𝐬𝐭𝐞𝐦 𝐩𝐫𝐞𝐟𝐢𝐱 𝐜𝐡𝐚𝐧𝐠𝐞",
			confirmThisThread: "𝐑𝐞𝐚𝐜𝐭 𝐭𝐨 𝐭𝐡𝐢𝐬 𝐦𝐞𝐬𝐬𝐚𝐠𝐞 𝐭𝐨 𝐜𝐨𝐧𝐟𝐢𝐫𝐦 𝐜𝐡𝐚𝐭 𝐩𝐫𝐞𝐟𝐢𝐱 𝐜𝐡𝐚𝐧𝐠𝐞",
			successGlobal: "𝐒𝐲𝐬𝐭𝐞𝐦 𝐩𝐫𝐞𝐟𝐢𝐱 𝐜𝐡𝐚𝐧𝐠𝐞𝐝 𝐭𝐨: %1",
			successThisThread: "𝐆𝐫𝐨𝐮𝐩 𝐩𝐫𝐞𝐟𝐢𝐱 𝐜𝐡𝐚𝐧𝐠𝐞𝐝 𝐭𝐨: %1",
			myPrefix: "𝐒𝐲𝐬𝐭𝐞𝐦 𝐩𝐫𝐞𝐟𝐢𝐱: %1\n𝐆𝐫𝐨𝐮𝐩 𝐩𝐫𝐞𝐟𝐢𝐱: %2"
		}
	},

	onStart: async function ({ message, role, args, commandName, event, threadsData, getLang }) {
		if (!args[0]) return message.SyntaxError();

		if (args[0] == 'reset') {
			await threadsData.set(event.threadID, null, "data.prefix");
			return message.reply(`𝐏𝐫𝐞𝐟𝐢𝐱 𝐫𝐞𝐬𝐞𝐭 𝐭𝐨 𝐝𝐞𝐟𝐚𝐮𝐥𝐭: ${global.GoatBot.config.prefix}`);
		}

		const newPrefix = args[0];
		const formSet = {
			commandName,
			author: event.senderID,
			newPrefix
		};

		if (args[1] === "-g") {
			if (role < 2)
				return message.reply(getLang("onlyAdmin"));
			formSet.setGlobal = true;
		} else formSet.setGlobal = false;

		return message.reply(
			args[1] === "-g" ? getLang("confirmGlobal") : getLang("confirmThisThread"),
			(err, info) => {
				formSet.messageID = info.messageID;
				global.GoatBot.onReaction.set(info.messageID, formSet);
			}
		);
	},

	onReaction: async function ({ message, threadsData, event, Reaction, getLang }) {
		const { author, newPrefix, setGlobal } = Reaction;
		if (event.userID !== author) return;

		if (setGlobal) {
			global.GoatBot.config.prefix = newPrefix;
			fs.writeFileSync(global.client.dirConfig, JSON.stringify(global.GoatBot.config, null, 2));
			return message.reply(getLang("successGlobal", newPrefix));
		} else {
			await threadsData.set(event.threadID, newPrefix, "data.prefix");
			return message.reply(getLang("successThisThread", newPrefix));
		}
	},

	onChat: async function ({ event, message, getLang }) {
		if (event.body && event.body.toLowerCase() === "prefix") {
			const adminName = " 𝐒𝐀𝐈𝐅 ";
			const fbLink = "m.me/muhammed.saiful.islam873645485";
			const globalPrefix = global.GoatBot.config.prefix;
			const groupPrefix = utils.getPrefix(event.threadID);
			const timeNow = new Date().toLocaleString("en-US", { timeZone: "Asia/Dhaka" });

			return message.reply(
`🌎 𝐆𝐋𝐎𝐁𝐀𝐋 𝐏𝐑𝐄𝐅𝐈𝐗: ${globalPrefix}
📚 𝐘𝐎𝐔𝐑 𝐆𝐑𝐎𝐔𝐏 𝐏𝐑𝐄𝐅𝐈𝐗: ${groupPrefix}

╭‣ 𝐀𝐃𝐌𝐈𝐍 👑
╰‣ ${adminName}

╭‣ 𝐅𝐀𝐂𝐄𝐁𝐎𝐎𝐊 ⓕ
╰‣ ${fbLink}

╭‣ 🕒 𝐓𝐈𝐌𝐄
╰‣ ${timeNow}

━━━━━━━━━━━━━━━
🪄 𝐏𝐎𝐖𝐄𝐑𝐄𝐃 𝐁𝐘 𝐌𝐈𝐊𝐀𝐒𝐀 🎀`
			);
		}
	}
};
