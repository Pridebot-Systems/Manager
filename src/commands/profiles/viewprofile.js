require("dotenv").config();
const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const axios = require("axios");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewprofile")
    .setDescription("View your profile or another user's profile")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to view the profile of")
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const userId = user.id;
    const owner = "691506668781174824";

    try {
      const response = await axios.get(
        `https://profile.pridebot.xyz/profile/${userId}`
      );
      const profileData = response.data;

      const embedColor = profileData.color || "#FF00EA";
      const pronounsValue = profileData.pronouns || "Not set";
      const otherPronounsValue = profileData.otherPronouns
        ? `, ${profileData.otherPronouns}`
        : "";
      const combinedPronouns =
        pronounsValue.includes("Not set") && otherPronounsValue
          ? otherPronounsValue.substring(2)
          : pronounsValue + otherPronounsValue;

      const sexualityValue = profileData.sexuality || "Not set";
      const otherSexualityValue = profileData.otherSexuality
        ? `, ${profileData.otherSexuality}`
        : "";
      const combinedSexuality =
        sexualityValue.includes("Not set") && otherSexualityValue
          ? otherSexualityValue.substring(2)
          : sexualityValue + otherSexualityValue;

      const genderValue = profileData.gender || "Not set";
      const otherGenderValue = profileData.otherGender
        ? `, ${profileData.otherGender}`
        : "";
      const combinedGender =
        genderValue.includes("Not set") && otherGenderValue
          ? otherGenderValue.substring(2)
          : genderValue + otherGenderValue;

      const profileFields = [
        {
          name: "Preferred Name",
          value: profileData.preferredName || "Not set",
          inline: true,
        },
      ];
      if (profileData.age) {
        profileFields.push({
          name: "Age",
          value: profileData.age.toString(),
          inline: true,
        });
      }
      if (profileData.bio) {
        profileFields.push({
          name: "Bio",
          value: profileData.bio.replace(/\\n/g, "\n"),
          inline: false,
        });
      }
      profileFields.push(
        {
          name: "Sexual Orientation",
          value: combinedSexuality,
          inline: true,
        },
        {
          name: "Romantic Orientation",
          value: profileData.romanticOrientation || "Not set",
          inline: true,
        },
        { name: "Gender", value: combinedGender, inline: true },
        { name: "Pronouns", value: combinedPronouns, inline: true }
      );

      const profileEmbed = new EmbedBuilder()
        .setColor(`${embedColor}`)
        .setTitle(`${user.username}'s Profile`)
        .addFields(profileFields)
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

      const components = [];

      if (profileData.pronounpage) {
        components.push(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("Pronoun Page")
              .setStyle(ButtonStyle.Link)
              .setURL(profileData.pronounpage)
          )
        );
      }

      if (interaction.user.id === owner) {
        components.push(
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel("Delete Profile")
              .setStyle(ButtonStyle.Danger)
              .setCustomId(`delete_profile_${userId}`)
          )
        );
      }

      if (components.length > 0) {
        await interaction.reply({ embeds: [profileEmbed], components });
      } else {
        await interaction.reply({ embeds: [profileEmbed] });
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return interaction.reply({
          content: "❌ No profile found for that user.",
          ephemeral: true,
        });
      }

      console.error("Error fetching profile:", error);
      return interaction.reply({
        content: "❌ There was an error fetching the profile data.",
        ephemeral: true,
      });
    }
  },
};
