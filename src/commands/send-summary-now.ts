import { SlashCommandBuilder, PermissionFlagsBits, type ChatInputCommandInteraction } from 'discord.js';
import { reportService } from '../services/report.service';
import { canRunDailySummary } from '../../services/billing/plan-limits.middleware';
import { serverService } from '../../services/server.service';
import { logger } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('send-summary-now')
  .setDescription('Generate and post a summary immediately (uses your plan limit)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guildId || !interaction.guild) {
    await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    await serverService.getOrCreate(interaction.guildId, interaction.guild.name);

    const limitCheck = await canRunDailySummary(interaction.guildId);
    if (!limitCheck.allowed) {
      await interaction.editReply({
        content: `❌ ${limitCheck.reason ?? 'Daily summary limit reached. Upgrade your plan for more summaries per day.'}`,
      });
      return;
    }

    await reportService.sendDailyReportToAdmins(interaction.guild);
    await interaction.editReply({
      content: '✅ Summary sent to your summary channel (or admin channels if not set).',
    });
    logger.info('Manual summary sent', { serverId: interaction.guildId });
  } catch (error) {
    logger.error('send-summary-now failed:', error);
    await interaction.editReply({
      content: '❌ Failed to generate summary. Please try again.',
    });
  }
}
