require("dotenv").config();
const axios = require("axios");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const { commands } = client;
      const { commandName } = interaction;
      const command = commands.get(commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: `Error occurred while executing this command`,
          ephemeral: true,
        });
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith("delete_profile_")) {
        // Check bot owner
        if (interaction.user.id !== "691506668781174824") {
          return interaction.reply({
            content: "❌ Only the bot owner can delete profiles.",
            ephemeral: true,
          });
        }

        const targetUserId = interaction.customId.split("_")[2];

        try {
          await axios.delete(
            `https://profile.pridebot.xyz/profile/delete/${targetUserId}`,
            {
              headers: {
                Authorization: `Bearer ${process.env.PROFILE_API_TOKEN}`,
              },
            }
          );

          await interaction.reply({
            content: `✅ <@${targetUserId}>'s profile has been deleted successfully.`,
            ephemeral: true,
          });
        } catch (error) {
          console.error(
            "Error deleting profile:",
            error.response?.data || error.message
          );
          await interaction.reply({
            content: `❌ Failed to delete <@${targetUserId}>'s profile.`,
            ephemeral: true,
          });
        }
      }
    }
  },
};
