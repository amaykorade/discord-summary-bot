import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { serverService } from '../../services/server.service';
import { logger } from '../../utils/logger';

function isValidTimezone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const data = new SlashCommandBuilder()
  .setName('set-summary-time')
  .setDescription('Set when daily summaries are sent (hour in your timezone)')
  .addIntegerOption((opt) =>
    opt
      .setName('hour')
      .setDescription('Hour of day (0-23, e.g. 9 for 9:00 AM)')
      .setMinValue(0)
      .setMaxValue(23)
      .setRequired(true)
  )
  .addStringOption((opt) =>
    opt
      .setName('timezone')
      .setDescription('IANA timezone e.g. UTC, America/New_York, Asia/Kolkata (default: UTC)')
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  const hour = interaction.options.getInteger('hour', true);
  const tzInput = interaction.options.getString('timezone') ?? 'UTC';
  const timezone = tzInput.trim() || 'UTC';

  if (!isValidTimezone(timezone)) {
    await interaction.reply({
      content: `❌ Invalid timezone: \`${timezone}\`. Use one of the common options or a valid IANA timezone (e.g. America/New_York).`,
      ephemeral: true,
    });
    return;
  }

  try {
    const guild = interaction.guild;
    if (guild) await serverService.getOrCreate(interaction.guildId, guild.name);
    await serverService.setSummarySchedule(interaction.guildId, hour, timezone);

    const hourStr = hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`;
    await interaction.reply({
      content: `✅ Daily summary will run at **${hourStr}** (${timezone}). Use \`/send-summary-now\` to get one immediately.`,
      ephemeral: true,
    });
    logger.info('Summary time set', { serverId: interaction.guildId, hour, timezone });
  } catch (error) {
    logger.error('Failed to set summary time:', error);
    await interaction.reply({
      content: 'Failed to save. Please try again.',
      ephemeral: true,
    });
  }
}
