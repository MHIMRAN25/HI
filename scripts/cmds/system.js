const si = require('systeminformation');
const request = require("request");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "system",
    aliases: ["sys", "up2"],
    version: "1.0",
    author: "",
    countDown: 5,
    role: 0,
    shortDescription: "Show system information",
    category: "utility",
    guide: "{pn}"
  },

  formatBytes(bytes) {
    const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
      bytes /= 1024;
      i++;
    }
    return `${bytes.toFixed(1)} ${units[i]}`;
  },

  onStart: async function ({ api, event }) {
    const timeStart = Date.now();

    try {
      const cpuData = await si.cpu();
      const cpuTemp = await si.cpuTemperature();
      const loadData = await si.currentLoad();
      const diskInfo = await si.diskLayout();
      const memLayout = await si.memLayout();
      const mem = await si.mem();
      const os = await si.osInfo();

      let uptime = process.uptime();
      const hours = String(Math.floor(uptime / 3600)).padStart(2, "0");
      const minutes = String(Math.floor((uptime % 3600) / 60)).padStart(2, "0");
      const seconds = String(Math.floor(uptime % 60)).padStart(2, "0");

      const msg =
`SYSTEM INFORMATION

CPU
• Model: ${cpuData.manufacturer} ${cpuData.brand}
• Speed: ${cpuData.speed} GHz
• Cores: ${cpuData.cores}
• Physical Cores: ${cpuData.physicalCores}
• Temperature: ${cpuTemp.main} °C
• Load: ${loadData.currentLoad.toFixed(1)} %

Memory
• Slot Size: ${this.formatBytes(memLayout[0].size)}
• Type: ${memLayout[0].type}
• Total: ${this.formatBytes(mem.total)}
• Available: ${this.formatBytes(mem.available)}

Disk
• Name: ${diskInfo[0].name}
• Size: ${this.formatBytes(diskInfo[0].size)}
• Type: ${diskInfo[0].type}

Operating System
• Platform: ${os.platform}
• Build: ${os.build}

Uptime: ${hours}:${minutes}:${seconds}
Ping: ${Date.now() - timeStart} ms`;

      const images = [
        "https://i.imgur.com/u1WkhXi.jpg",
        "https://i.imgur.com/zuUMUDp.jpg",
        "https://i.imgur.com/skHrcq9.jpg",
        "https://i.imgur.com/TE9tH8w.jpg",
        "https://i.imgur.com/on9p0FK.jpg",
        "https://i.imgur.com/mriBW5m.jpg",
        "https://i.imgur.com/ju7CyHo.jpg",
        "https://i.imgur.com/KJunp2s.jpg",
        "https://i.imgur.com/6knPOgd.jpg",
        "https://i.imgur.com/Nxcbwxk.jpg",
        "https://i.imgur.com/FgtghTN.jpg",
      ];

      const imgPath = __dirname + "/cache/system.jpg";

      request(encodeURI(images[Math.floor(Math.random() * images.length)]))
        .pipe(fs.createWriteStream(imgPath))
        .on("close", () => {
          api.sendMessage(
            {
              body: msg,
              attachment: fs.createReadStream(imgPath)
            },
            event.threadID,
            () => fs.unlinkSync(imgPath),
            event.messageID
          );
        });

    } catch (err) {
      console.error(err);
      api.sendMessage("Error occurred while gathering system info.", event.threadID);
    }
  }
};
