const { exec } = require("child_process");

async function managePM2(message, client) {
  const mention = `<@${client.user.id}>`;
  if (!message.content.startsWith(mention)) return;

  const args = message.content.slice(mention.length).trim().split(/ +/);
  const command = args[0]?.toLowerCase();
  const pidOrProcess = args[1];

  if (!["restart", "stop", "list"].includes(command)) {
    await message.channel.send(
      "Invalid usage. Use:\n" +
        "`@bot restart {pid}` - Restart a process by PID\n" +
        "`@bot stop {pid}` - Stop a process by PID\n" +
        "`@bot list` - View the PM2 process list"
    );
    return;
  }

  const allowedUserIds = ["691506668781174824"];
  if (!allowedUserIds.includes(message.author.id)) {
    await message.channel.send(
      "You do not have permission to use this command."
    );
    return;
  }

  if (command === "list") {
    exec("pm2 list", (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing PM2 command: ${error.message}`);
        message.channel.send(
          `Failed to execute command: \`pm2 list\`.\nError: \`${error.message}\``
        );
        return;
      }

      if (stderr) {
        console.error(`PM2 STDERR: ${stderr}`);
        message.channel.send(`Command executed with warnings: \`${stderr}\``);
        return;
      }

      message.channel.send(`PM2 Process List:\n\`\`\`${stdout}\`\`\``);
    });
    return;
  }

  if (!pidOrProcess) {
    await message.channel.send(
      "Invalid usage. Provide a process ID for restart/stop commands."
    );
    return;
  }

  const pm2Command = `pm2 ${command} ${pidOrProcess}`;
  exec(pm2Command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing PM2 command: ${error.message}`);
      message.channel.send(
        `Failed to execute command: \`${pm2Command}\`.\nError: \`${error.message}\``
      );
      return;
    }

    if (stderr) {
      console.error(`PM2 STDERR: ${stderr}`);
      message.channel.send(`Command executed with warnings: \`${stderr}\``);
      return;
    }

    message.channel.send(`Command executed successfully:\n\`${stdout}\``);
  });
}

module.exports = { managePM2 };
