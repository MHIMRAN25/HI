const { config } = global.GoatBot;
const { writeFileSync } = require("fs-extra");

/* 🔤 Fancy font mapper (bold italic style) */
const fancyMap = (text) => {
	const map = {
		a:"𝒂", b:"𝒃", c:"𝒄", d:"𝒅", e:"𝒆", f:"𝒇", g:"𝒈",
		h:"𝒉", i:"𝒊", j:"𝒋", k:"𝒌", l:"𝒍", m:"𝒎", n:"𝒏",
		o:"𝒐", p:"𝒑", q:"𝒒", r:"𝒓", s:"𝒔", t:"𝒕", u:"𝒖",
		v:"𝒗", w:"𝒘", x:"𝒙", y:"𝒚", z:"𝒛",
		A:"𝑨", B:"𝑩", C:"𝑪", D:"𝑫", E:"𝑬", F:"𝑭", G:"𝑮",
		H:"𝑯", I:"𝑰", J:"𝑱", K:"𝑲", L:"𝑳", M:"𝑴", N:"𝑵",
		O:"𝑶", P:"𝑷", Q:"𝑸", R:"𝑹", S:"𝑺", T:"𝑻", U:"𝑼",
		V:"𝑽", W:"𝑾", X:"𝑿", Y:"𝒀", Z:"𝒁",
		0:"𝟎",1:"𝟏",2:"𝟐",3:"𝟑",4:"𝟒",
		5:"𝟓",6:"𝟔",7:"𝟕",8:"𝟖",9:"𝟗"
	};
	return text.split("").map(c => map[c] || c).join("");
};

module.exports = {
	config: {
		name: "admin",
		version: "1.7",
		author: "NTKhang",
		countDown: 5,
		role: 0, // 🌐 public
		shortDescription: {
			en: "Admin manager"
		},
		longDescription: {
			en: "Add, remove and list admin users"
		},
		category: "owner",
		guide: {
			en:
				"{pn} add <uid | @tag>  → add admin (role 2)\n" +
				"{pn} remove <uid | @tag> → remove admin (role 2)\n" +
				"{pn} list → list admins (role 0)"
		}
	},

	langs: {
		en: {
			noPermission:
				"⛔ | 𝑌𝑜𝓊 𝒹𝑜𝓃'𝓉 𝒽𝒶𝓋𝑒 𝓅𝑒𝓇𝓂𝒾𝓈𝓈𝒾𝑜𝓃",

			missingIdAdd:
				"⚠️ | 𝑷𝒍𝒆𝒂𝒔𝒆 𝑴𝒆𝒏𝒕𝒊𝒐𝒏 / 𝑬𝒏𝒕𝒆𝒓 𝑼𝒔𝒆𝒓 𝑰𝑫",

			missingIdRemove:
				"⚠️ | 𝑷𝒍𝒆𝒂𝒔𝒆 𝑴𝒆𝒏𝒕𝒊𝒐𝒏 / 𝑬𝒏𝒕𝒆𝒓 𝑼𝒔𝒆𝒓 𝑰𝑫"
		}
	},

	onStart: async function ({ message, args, usersData, event, getLang }) {

		const isRole2 =
			config.adminBot.includes(event.senderID) ||
			event.senderID == config.ownerID;

		switch (args[0]) {

			/* 🔐 ADD ADMIN */
			case "add":
			case "-a": {
				if (!isRole2)
					return message.reply(getLang("noPermission"));

				if (!args[1])
					return message.reply(getLang("missingIdAdd"));

				let uids = [];
				if (Object.keys(event.mentions).length)
					uids = Object.keys(event.mentions);
				else if (event.messageReply)
					uids.push(event.messageReply.senderID);
				else
					uids = args.filter(arg => !isNaN(arg));

				const added = [];
				const existed = [];

				for (const uid of uids) {
					if (config.adminBot.includes(uid))
						existed.push(uid);
					else {
						config.adminBot.push(uid);
						added.push(uid);
					}
				}

				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				return message.reply(
					"✅ | 𝑨𝑫𝑴𝑰𝑵 𝑨𝑫𝑫𝑬𝑫\n" +
					(added.length
						? added.map(uid => `• ${uid}`).join("\n")
						: "") +
					(existed.length
						? "\n\n⚠️ | 𝑨𝑳𝑹𝑬𝑨𝑫𝒀 𝑨𝑫𝑴𝑰𝑵\n" + existed.map(uid => `• ${uid}`).join("\n")
						: "")
				);
			}

			/* 🔐 REMOVE ADMIN */
			case "remove":
			case "-r": {
				if (!isRole2)
					return message.reply(getLang("noPermission"));

				if (!args[1])
					return message.reply(getLang("missingIdRemove"));

				let uids = [];
				if (Object.keys(event.mentions).length)
					uids = Object.keys(event.mentions);
				else
					uids = args.filter(arg => !isNaN(arg));

				const removed = [];
				const notAdmin = [];

				for (const uid of uids) {
					if (config.adminBot.includes(uid)) {
						config.adminBot.splice(config.adminBot.indexOf(uid), 1);
						removed.push(uid);
					}
					else notAdmin.push(uid);
				}

				writeFileSync(global.client.dirConfig, JSON.stringify(config, null, 2));

				return message.reply(
					"✅ | 𝑨𝑫𝑴𝑰𝑵 𝑹𝑬𝑴𝑶𝑽𝑬𝑫\n" +
					removed.map(uid => `• ${uid}`).join("\n")
				);
			}

			/* 👑 LIST ADMIN (FULL STYLISH) */
			case "list":
			case "-l": {
				const list = await Promise.all(
					config.adminBot.map(async (uid, index) => {
						const name = await usersData.getName(uid);
						return (
							`✨ ${fancyMap(String(index + 1))}. ${fancyMap(name)}\n` +
							`   └─ 𝑼𝑰𝑫: ${fancyMap(uid)}`
						);
					})
				);

				return message.reply(
					"👑 | 𝑨𝑫𝑴𝑰𝑵 𝑳𝑰𝑺𝑻\n" +
					"━━━━━━━━━━━━━━━━━━\n" +
					(list.length ? list.join("\n\n") : "𝑵𝒐 𝑨𝒅𝒎𝒊𝒏 𝑭𝒐𝒖𝒏𝒅")
				);
			}

			default:
				return message.SyntaxError();
		}
	}
};
