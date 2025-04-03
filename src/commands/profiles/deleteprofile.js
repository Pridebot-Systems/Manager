require("dotenv").config();
const { SlashCommandBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("deleteprofile")
    .setDescription("Delete a user's profile (Bot Owner Only)")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to delete")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (interaction.user.id !== "691506668781174824") {
      return interaction.reply({
        content: "❌ Only the bot owner can use this command.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("user");
    const userId = user.id;

    try {
      const response = await axios.delete(
        `https://profile.pridebot.xyz/profile/delete/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PROFILE_API_TOKEN}`,
          },
        }
      );

      if (response.status === 200) {
        await interaction.reply({
          content: `✅ Successfully deleted the profile of <@${userId}>.`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: "❌ Failed to delete the profile. Please try again.",
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(
        "Error deleting profile:",
        error.response?.data || error.message
      );
      await interaction.reply({
        content: `❌ Error: ${
          error.response?.data?.message || "An unexpected error occurred."
        }`,
        ephemeral: true,
      });
    }
  },
};
