module.exports = {
  config: {
    name: "intro",
    version: "1.4",
    author: "Saif",
    eventType: ["message"],
    role: 0
  },

  onStart: async function({ event, api }) {
    try {
      // Catbox JPG link
      const link = "https://files.catbox.moe/kdkocu.jpg";

      // Fetch user info from senderID of the replied message
      const replyUserID = event.messageReply.senderID;
      const userInfo = await api.getUserInfo(replyUserID);
      const replyUserName = userInfo[replyUserID].name || "Baby";

      // Send message + attachment mentioning their name
      await api.sendMessage(
        {
          body: `✨ Hey ${replyUserName}, YOUR INTRO FORM IS HERE, BABY! 💖`,
          attachment: await global.utils.getStreamFromURL(link)
        },
        event.threadID,
        event.messageID
      );
    } catch (err) {
      console.log(err);
      api.sendMessage("_⚠️ SOMETHING WENT WRONG (>_<)_", event.threadID);
    }
  },

  onChat: async function({ event, api }) {
    if (!event.messageReply) return; // must reply
    if (!event.body) return;

    const cmd = event.body.trim().toLowerCase();
    if (!cmd.startsWith("intro")) return;

    // Fire intro reply
    this.onStart({ event, api });
  }
};
