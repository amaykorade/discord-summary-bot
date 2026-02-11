import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { serverService } from '../../services/server.service';
import { logger } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('set-summary-channel')
  .setDescription('Set the channel where daily summaries will be posted')
  .addChannelOption((opt) =>
    opt
      .setName('channel')
      .setDescription('The channel to post daily summaries (use current channel if omitted)')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  const channel = interaction.options.getChannel('channel') ?? interaction.channel;
  if (!channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({ content: 'Please select a valid text channel.', ephemeral: true });
    return;
  }

  try {
    const guild = interaction.guild;
    if (guild) await serverService.getOrCreate(interaction.guildId, guild.name);
    await serverService.setSummaryChannel(interaction.guildId, channel.id);
    await interaction.reply({
      content: `✅ Daily summaries will now be posted to <#${channel.id}>.`,
      ephemeral: true,
    });
    logger.info('Summary channel set', { serverId: interaction.guildId, channelId: channel.id });
  } catch (error) {
    logger.error('Failed to set summary channel:', error);
    await interaction.reply({
      content: 'Failed to save the summary channel. Please try again.',
      ephemeral: true,
    });
  }
}
