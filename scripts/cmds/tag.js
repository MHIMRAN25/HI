const config = {
    name: "tag",
    version: "2.0.0",
    author: "Saif",
    credits: "Dipto",
    countDown: 0,
    role: 0,
    hasPermission: 0,
    description: "Tag user(s) by reply/mention/search name",
    category: "box chat",
    commandCategory: "tag",
    guide: "{pn} [reply/mention/name]",
    usages: "reply, mention or search name"
};

const onStart = async ({ api, args, event }) => {
    try {
        let IDs = [];

        // যদি mention করা থাকে
        if (Object.keys(event.mentions).length > 0) {
            IDs = Object.keys(event.mentions);

        // যদি reply করা থাকে
        } else if (event.messageReply) {
            IDs = [event.messageReply.senderID];

        // যদি নাম search দেওয়া হয়
        } else if (args.length > 0) {
            const nameQuery = args.join(" ").toLowerCase();
            const threadInfo = await api.getThreadInfo(event.threadID);

            // filter করে যাদের নামের মধ্যে query আছে তাদের নাও
            IDs = threadInfo.userInfo
                .filter(user => user.name.toLowerCase().includes(nameQuery))
                .map(user => user.id);
        } else {
            IDs = [event.senderID]; // fallback: নিজেকে ট্যাগ করবে
        }

        if (IDs.length === 0) {
            return api.sendMessage("⚠𝐍𝐎 𝐔𝐒𝐄𝐑 𝐃𝐄𝐓𝐄𝐂𝐓𝐄𝐃!", event.threadID, event.messageID);
        }

        const mentions = [];
        let bodyText = "";

        for (let id of IDs) {
            const info = await api.getUserInfo(id);
            const name = info[id]?.name || "Unknown";
            bodyText += `${name} `;
            mentions.push({ tag: name, id });
        }

        await api.sendMessage({
            body: bodyText.trim(),
            mentions
        }, event.threadID, event.messageID);

    } catch (error) {
        console.error(error);
        api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
};

module.exports = {
    config,
    onStart,
    run: onStart
};
