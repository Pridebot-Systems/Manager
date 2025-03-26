const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { prisma } = require("../../lib/prisma");
const { generateCaseId } = require("../../events/bot/idcreator");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Remove timeout from a user.")
    .addUserOption((option) =>
      option.setName("user").setDescription("User to unmute").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for unmute")
        .setRequired(false)
    ),

  async execute(interaction) {
    const modRole = "1256010531844919388";
    const logChannelId = "1312101101616758877";

    if (!interaction.member.roles.cache.has(modRole)) {
      return interaction.reply({
        content: "You don't have permission to use this command.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("user");
    const reason =
      interaction.options.getString("reason") || "No reason provided";
    const caseId = generateCaseId();
    const moderator = interaction.user;

    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);
    if (!member)
      return interaction.reply({
        content: "User not found in the server.",
        ephemeral: true,
      });

    try {
      await member.timeout(null, reason); // Clears the timeout

      await prisma.modLog.create({
        data: {
          caseId,
          userId: user.id,
          modId: moderator.id,
          guildId: interaction.guildId,
          action: "UNMUTE",
          reason,
        },
      });

      const embed = new EmbedBuilder()
        .setTitle("🔊 User Unmuted")
        .setColor(0x00cc99)
        .addFields(
          { name: "User", value: `${user.tag} (${user.id})`, inline: true },
          { name: "Moderator", value: `<@${moderator.id}>`, inline: true },
          { name: "Reason", value: reason, inline: false },
          { name: "Case ID", value: `\`${caseId}\``, inline: true }
        )
        .setTimestamp();

      const logChannel = await interaction.guild.channels
        .fetch(logChannelId)
        .catch(() => null);
      if (logChannel) await logChannel.send({ embeds: [embed] });

      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      console.error(err);
      await interaction.reply({
        content: "Failed to unmute the user.",
        ephemeral: true,
      });
    }
  },
};
