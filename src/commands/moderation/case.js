const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { prisma } = require("../../lib/prisma");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("Manage moderation cases.")
    .addSubcommand((sub) =>
      sub
        .setName("view")
        .setDescription("View a case by its ID.")
        .addStringOption((option) =>
          option.setName("id").setDescription("Case ID").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("user")
        .setDescription("View all cases for a user.")
        .addUserOption((option) =>
          option
            .setName("target")
            .setDescription("User to view")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setDescription("Edit the reason for a case.")
        .addStringOption((option) =>
          option.setName("id").setDescription("Case ID").setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("New reason")
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a case by its ID.")
        .addStringOption((option) =>
          option.setName("id").setDescription("Case ID").setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const caseId = interaction.options.getString("id")?.toUpperCase();

    try {
      if (sub === "view") {
        const caseLog = await prisma.modLog.findUnique({ where: { caseId } });

        if (!caseLog)
          return interaction.reply({
            content: `No case found with ID \`${caseId}\`.`,
            ephemeral: true,
          });

        const embed = new EmbedBuilder()
          .setTitle(`📁 Case: ${caseLog.caseId}`)
          .setColor(0x00bfff)
          .addFields(
            { name: "User ID", value: caseLog.userId, inline: true },
            { name: "Moderator ID", value: caseLog.modId, inline: true },
            { name: "Action", value: caseLog.action, inline: true },
            {
              name: "Reason",
              value: caseLog.reason || "No reason provided",
              inline: false,
            },
            {
              name: "Date",
              value: `<t:${Math.floor(
                new Date(caseLog.timestamp).getTime() / 1000
              )}:F>`,
            }
          );

        return interaction.reply({ embeds: [embed] });
      }

      if (sub === "user") {
        const target = interaction.options.getUser("target");
        const logs = await prisma.modLog.findMany({
          where: { userId: target.id },
          orderBy: { timestamp: "desc" },
          take: 10,
        });

        if (!logs.length)
          return interaction.reply({
            content: `No cases found for ${target.tag}.`,
            ephemeral: true,
          });

        const embed = new EmbedBuilder()
          .setTitle(`📂 Cases for ${target.tag}`)
          .setColor(0x00bfff)
          .setDescription(
            logs
              .map(
                (log) =>
                  `\`[${log.caseId}]\` **${log.action}** by <@${log.modId}> — ${log.reason}`
              )
              .join("\n")
          )
          .setFooter({ text: "Showing latest 10 cases" });

        return interaction.reply({ embeds: [embed] });
      }

      if (sub === "edit") {
        const newReason = interaction.options.getString("reason");

        const updated = await prisma.modLog.update({
          where: { caseId },
          data: { reason: newReason },
        });

        return interaction.reply({
          content: `✅ Case \`${caseId}\` updated.\nNew reason: ${newReason}`,
          ephemeral: true,
        });
      }

      if (sub === "delete") {
        await prisma.modLog.delete({ where: { caseId } });

        return interaction.reply({
          content: `🗑️ Case \`${caseId}\` has been deleted.`,
          ephemeral: true,
        });
      }
    } catch (err) {
      console.error(err);
      return interaction.reply({
        content: "An error occurred processing the command.",
        ephemeral: true,
      });
    }
  },
};
