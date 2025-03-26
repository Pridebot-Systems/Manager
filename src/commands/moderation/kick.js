const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { prisma } = require("../../lib/prisma");
const { generateCaseId } = require("../../events/bot/idcreator");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user from the server.")
    .addUserOption((option) =>
      option.setName("user").setDescription("User to kick").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for kick")
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
    const moderator = interaction.user;
    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);
    const caseId = generateCaseId();

    if (!member) {
      return interaction.reply({
        content: "User not found in the guild.",
        ephemeral: true,
      });
    }

    try {
      await member.kick(reason);

      await prisma.modLog.create({
        data: {
          caseId,
          userId: user.id,
          modId: moderator.id,
          guildId: interaction.guildId,
          action: "KICK",
          reason,
        },
      });

      const embed = new EmbedBuilder()
        .setTitle("User Kicked")
        .setColor(0xffa500)
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
        content: "Failed to kick the user.",
        ephemeral: true,
      });
    }
  },
};
