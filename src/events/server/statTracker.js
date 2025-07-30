const { ChannelType } = require("discord.js");

const updateChannelName = async (client) => {
  try {
    console.log("[STATS] Starting statsTracker update (External Bot)");

    // Fetch stats from Pridebot API
    let stats = null;
    try {
      const res = await fetch("https://api.pridebot.xyz/stats");
      stats = await res.json();
    } catch (err) {
      console.error("[STATS] Failed to fetch stats from API:", err);
      return;
    }

    const {
      currentGuildCount: guilds = 0,
      totalUserCount: users = 0,
      commandsCount: registeredCommands = 0,
      totalUsage = 0,
      profileAmount = 0,
      vote = {},
    } = stats;

    const votingTotal = vote.votingtotal || 0;

    const channels = [
      { id: "1152452882663227423", name: `Guilds: ${guilds}` },
      { id: "1152452919719903313", name: `Users: ${users}` },
      {
        id: "1152452950132805722",
        name: `# of Commands: ${registeredCommands}`,
      },
      { id: "1221546215976603729", name: `Commands used: ${totalUsage}` },
      { id: "1246264055388438700", name: `Profiles: ${profileAmount}` },
      { id: "1261162314267230248", name: `Bot Votes: ${votingTotal}` },
    ];

    for (const entry of channels) {
      const channel = await client.channels.fetch(entry.id).catch(() => null);
      if (!channel || channel.type !== ChannelType.GuildVoice) {
        console.warn(`[STATS] Channel ${entry.id} missing or invalid type`);
        continue;
      }

      try {
        await channel.setName(entry.name);
        console.log(`[STATS] Updated: ${entry.name}`);
      } catch (err) {
        console.error(`[STATS] Failed to update ${entry.name}:`, err);
      }
    }
  } catch (err) {
    console.error("[STATS] statsTracker failed completely:", err);
  }
};

module.exports = { updateChannelName };
