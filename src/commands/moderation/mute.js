const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { prisma } = require("../../lib/prisma");
const { generateCaseId } = require("../../events/bot/idcreator");
const ms = require("ms");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mute")
    .setDescription("Temporarily mute a user using timeout.")
    .addUserOption((option) =>
      option.setName("user").setDescription("User to mute").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("Mute duration (e.g., 10m, 1h)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for mute")
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
    const rawDuration = interaction.options.getString("duration");
    const duration = ms(rawDuration);
    const reason =
      interaction.options.getString("reason") || "No reason provided";
    const caseId = generateCaseId();
    const moderator = interaction.user;

    if (!duration || duration > 28 * 24 * 60 * 60 * 1000) {
      return interaction.reply({
        content: "Invalid duration. Max timeout is 28 days.",
        ephemeral: true,
      });
    }

    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);
    if (!member)
      return interaction.reply({
        content: "User not found in the server.",
        ephemeral: true,
      });

    try {
      await member.timeout(duration, reason);

      await prisma.modLog.create({
        data: {
          caseId,
          userId: user.id,
          modId: moderator.id,
          guildId: interaction.guildId,
          action: `MUTE (${rawDuration})`,
          reason,
        },
      });

      const embed = new EmbedBuilder()
        .setTitle("🔇 User Muted")
        .setColor(0x9999ff)
        .addFields(
          { name: "User", value: `${user.tag} (${user.id})`, inline: true },
          { name: "Moderator", value: `<@${moderator.id}>`, inline: true },
          { name: "Duration", value: rawDuration, inline: true },
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
        content: "Failed to mute the user.",
        ephemeral: true,
      });
    }
  },
};
