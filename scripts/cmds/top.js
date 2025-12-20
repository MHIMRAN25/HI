function formatMoney(amount) {
	if (amount >= 1e15) return (amount / 1e15).toFixed(2) + "QT";
	if (amount >= 1e12) return (amount / 1e12).toFixed(2) + "T";
	if (amount >= 1e9) return (amount / 1e9).toFixed(2) + "B";
	if (amount >= 1e6) return (amount / 1e6).toFixed(2) + "M";
	if (amount >= 1e3) return (amount / 1e3).toFixed(2) + "K";
	return amount.toString();
}

// Stylish bold font wrapper
function stylish(text) {
	return text.split("").map(c => {
		const boldMap = {
			"a":"𝗮","b":"𝗯","c":"𝗰","d":"𝗱","e":"𝗲","f":"𝗳","g":"𝗴","h":"𝗵","i":"𝗶","j":"𝗷","k":"𝗸","l":"𝗹","m":"𝗺","n":"𝗻","o":"𝗼","p":"𝗽","q":"𝗾","r":"𝗿","s":"𝘀","t":"𝘁","u":"𝘂","v":"𝘃","w":"𝘄","x":"𝘅","y":"𝘆","z":"𝘇",
			"A":"𝗔","B":"𝗕","C":"𝗖","D":"𝗗","E":"𝗘","F":"𝗙","G":"𝗚","H":"𝗛","I":"𝗜","J":"𝗝","K":"𝗞","L":"𝗟","M":"𝗠","N":"𝗡","O":"𝗢","P":"𝗣","Q":"𝗤","R":"𝗥","S":"𝗦","T":"𝗧","U":"𝗨","V":"𝗩","W":"𝗪","X":"𝗫","Y":"𝗬","Z":"𝗭",
			"0":"𝟬","1":"𝟭","2":"𝟮","3":"𝟯","4":"𝟰","5":"𝟱","6":"𝟲","7":"𝟳","8":"𝟴","9":"𝟵"
		};
		return boldMap[c] || c;
	}).join("");
}

function getRankEmoji(rank) {
	const emojis = ["👑","🥈","🥉","🔷","🔶","⭐","✨","▪️"];
	if (rank === 1) return emojis[0];
	if (rank === 2) return emojis[1];
	if (rank === 3) return emojis[2];
	if (rank <= 5) return emojis[3];
	if (rank <= 10) return emojis[4];
	if (rank <= 15) return emojis[5];
	return emojis[6];
}

module.exports = {
	config: {
		name: "top",
		aliases: ["richlist"],
		version: "Mikasa-3.1",
		author: "Saif",
		shortDescription: "💰 Top Money Leaderboard",
		longDescription: "🏆 Displays users with highest balances in stylish bold font with mentions",
		category: "bank",
		guide: {
			en: "{p}top [number]"
		}
	},

	onStart: async function ({ api, event, usersData, args }) {
		try {
			const allUsers = await usersData.getAll();
			const topCount = args[0] ? Math.min(parseInt(args[0]), 20) : 10;

			const topUsers = allUsers
				.filter(user => user.money !== undefined)
				.sort((a, b) => b.money - a.money)
				.slice(0, topCount);

			if (topUsers.length === 0) {
				return api.sendMessage("❌ No users with money data found!", event.threadID);
			}

			let leaderboardMsg = `🏆 ${stylish("TOP")} ${stylish(topCount.toString())} ${stylish("RICHEST USERS")}\n━━━━━━━━━━━━━━━━━━\n\n`;
			let mentions = [];

			topUsers.forEach((user, index) => {
				const rank = index + 1;
				const name = user.name || "Unknown User";
				const money = stylish(formatMoney(user.money || 0));
				const uid = user.userID || user.id;

				leaderboardMsg += `${getRankEmoji(rank)} ${stylish("Rank")} ${stylish(rank.toString())}: ${stylish(name)}\n💰 ${stylish("Balance")}: ${money}\n\n`;

				if (uid) mentions.push({ tag: name, id: uid });
			});

			leaderboardMsg += `━━━━━━━━━━━━━━━━━━\n💡 Use {p}top 5 for top 5 or {p}top 20 for top 20`;

			api.sendMessage({ body: leaderboardMsg, mentions }, event.threadID);

		} catch (error) {
			console.error("❌ Top Command Error:", error);
			api.sendMessage("⚠️ Failed to fetch leaderboard. Please try again later.", event.threadID);
		}
	}
};
