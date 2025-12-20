const { getStreamsFromAttachment } = global.utils;

module.exports = {
	config: {
		name: "notification",
		aliases: ["notify", "noti"],
		version: "3.0",
		author: "NTKhang (Styled by Saif)",
		countDown: 5,
		role: 2,
		category: "owner",
		envConfig: { delayPerGroup: 250 }
	},

	langs: {
		en: {
			missingMessage: "⚠️ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐚 𝐧𝐨𝐭𝐢𝐟𝐢𝐜𝐚𝐭𝐢𝐨𝐧 𝐦𝐞𝐬𝐬𝐚𝐠𝐞",
			sendingNotification: "📡 𝐒𝐞𝐧𝐝𝐢𝐧𝐠 𝐧𝐨𝐭𝐢𝐟𝐢𝐜𝐚𝐭𝐢𝐨𝐧 𝐭𝐨 %1 𝐠𝐫𝐨𝐮𝐩𝐬...",
			sentNotification: "✅ 𝐍𝐨𝐭𝐢𝐟𝐢𝐜𝐚𝐭𝐢𝐨𝐧 𝐬𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲 𝐬𝐞𝐧𝐭 𝐭𝐨 %1 𝐠𝐫𝐨𝐮𝐩𝐬"
		}
	},

	onStart: async function({ message, api, event, args, envCommands, threadsData, usersData, getLang }) {
		const { delayPerGroup } = envCommands.notification;
		if (!args[0]) return message.reply(getLang("missingMessage"));

		const senderName = await usersData.getName(event.senderID);

		const formSend = {
			body:
`🎀 𝐀𝐃𝐌𝐈𝐍 𝐍𝐎𝐓𝐈𝐅𝐈𝐂𝐀𝐓𝐈𝐎𝐍
━━━━━━━━━━━━━━━━
𝐒𝐞𝐧𝐝𝐞𝐫: ${senderName}

𝐌𝐞𝐬𝐬𝐚𝐠𝐞:
${args.join(" ")}

━━━━━━━━━━━━━━━━
𝐘𝐨𝐮𝐫 𝐌𝐢𝐤𝐚𝐬𝐚 𝐁𝐚𝐛𝐲`,
			attachment: await getStreamsFromAttachment(
				[
					...event.attachments,
					...(event.messageReply?.attachments || [])
				].filter(i => ["photo","png","animated_image","video","audio"].includes(i.type))
			)
		};

		const allThreadID = (await threadsData.getAll()).filter(
			t => t.isGroup && t.members.find(m => m.userID == api.getCurrentUserID())?.inGroup
		);

		message.reply(getLang("sendingNotification").replace("%1", allThreadID.length));

		let success = 0;
		for (const thread of allThreadID) {
			try {
				await api.sendMessage(formSend, thread.threadID);
				success++;
				await new Promise(r => setTimeout(r, delayPerGroup));
			} catch {}
		}

		message.reply(getLang("sentNotification").replace("%1", success));
	}
};
