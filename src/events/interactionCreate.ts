import { Events, type Interaction } from 'discord.js';
import { commands } from '../commands';
import { logger } from '../../utils/logger';

export const name = Events.InteractionCreate;

export async function execute(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) return;

  const cmd = commands.find((c) => c.data.name === interaction.commandName);
  if (cmd) {
    try {
      await cmd.execute(interaction);
    } catch (error) {
      logger.error(`Command ${interaction.commandName} failed:`, error);
      const reply = { content: 'An error occurred while running this command.', ephemeral: true };
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(reply);
        } else {
          await interaction.reply(reply);
        }
      } catch {
        // Ignore follow-up errors
      }
    }
  }
}
