require("dotenv").config();
const { connect } = require("mongoose");
const { Client, Collection, GatewayIntentBits, Events } = require("discord.js");
const fs = require("fs");
const { rulesMessage } = require("./commands/messages/rules.js");
const { transMessage } = require("./commands/messages/translation.js");
const { botcommands } = require("./commands/messages/botcommands.js");
const { managePM2 } = require("./commands/process/terminal.js");

const { checkBotStatus } = require("./events/bot/statuschecker.js");

const botStartTime = Math.floor(Date.now() / 1000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
  ],
});
client.commands = new Collection();
client.commandArray = [];
client.botStartTime = botStartTime;

const functionFolders = fs.readdirSync(`./src/functions`);
for (const folder of functionFolders) {
  const functionFiles = fs
    .readdirSync(`./src/functions/${folder}`)
    .filter((file) => file.endsWith(".js"));
  for (const file of functionFiles) {
    require(`./functions/${folder}/${file}`)(client);
  }
}

client.on("messageCreate", async (message) => {
  rulesMessage(message, client);
  transMessage(message, client);
  botcommands(message, client);
  managePM2(message, client);
});

const events = {
  memberAdd: require("./events/server/welcome.js"),
  memberRemove: require("./events/server/leave.js"),
};

client.on(Events.GuildMemberAdd, async (member) => {
  events.memberAdd(client, member);
});

client.on(Events.GuildMemberRemove, async (member) => {
  events.memberRemove(client, member);
});

const commandsPath = "./src/commands";
const clientId = "1193779874935099472";
client.handleCommands(commandsPath, clientId);
client.handleEvents();
client.login(process.env.token);

connect(process.env.databaseToken)
  .then(() => console.log("Connected to MongoDB"))
  .catch(console.error);


client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  checkBotStatus(client);
  setInterval(() => checkBotStatus(client), 60000);
});;
