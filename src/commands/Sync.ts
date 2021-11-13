import Discord from 'discord.js';
import SetlistUpdater from '../setlist';

// Using DiscordMessage and transforming it into a reply
export class Sync {
    public DiscordMessage: Discord.Message;
    private updater: SetlistUpdater;

    public static command() {
        return new SlashCommandBuilder().setName('sync').setDescription('Replies with pong pong!')
    }

    public constructor(DiscordMessage: Discord.Message, artistId: string|undefined) {
        if (artistId === undefined) {
            throw Error('No artist ID specified in ENV')
        }

        this.DiscordMessage = DiscordMessage;
        this.updater = new SetlistUpdater(artistId)
        this.invoke()
        return this
    }

    protected invoke() {
        if (this.DiscordMessage.author.id == process.env.ADMIN_USER_ID) {
            return this.DiscordMessage.reply('Starting sync..').then(() => {
                return this.updater.run()
            }).then(() => {
                this.DiscordMessage.reply('Setlist sync complete')
            }).catch((err) => {
                this.DiscordMessage.reply('Failed to sync')
                console.error(err)
            })
        }
    }
}