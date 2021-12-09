import {Setlist} from "../../helpers/setlist";
import {InteractionReplyOptions, MessageActionRow, MessageButton, MessageEmbed} from "discord.js";
import dayjs from "dayjs";
import {MessageButtonStyles} from "discord.js/typings/enums";

export default class BaseShowSetlistInteraction {
    protected static buildSetlistReply(setlist: Setlist): InteractionReplyOptions {
        let messageEmbed = new MessageEmbed()
            .setTitle(setlist.getSetlistTitle())
            .setURL(setlist.url)
            .setColor('#3f92a6')
            .setDescription(setlist.getTrackListText())
            .setTimestamp(dayjs(setlist.date).valueOf())

        if (setlist.note) {
            messageEmbed.addField('Note', setlist.note)
        }

        if (setlist.tour_name) {
            messageEmbed.addField('Tour', setlist.tour_name, true)
        }

        if (setlist.last_revision) {
            messageEmbed.addField('Last revision', `<t:${dayjs(setlist.last_revision).unix()}:R>`, true)
        }

        if (setlist.updated_at) {
            messageEmbed.addField('Last fetched by Setlisty', `<t:${dayjs(setlist.updated_at).unix()}:R>`, true)
        }

        return {
            embeds: [
                messageEmbed
            ],
            components: [
                new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setLabel('View')
                            .setURL(setlist.url)
                            .setStyle(MessageButtonStyles.LINK),
                        new MessageButton()
                            .setLabel('Edit')
                            .setURL(`https://www.setlist.fm/edit?setlist=${setlist.id}&step=song`)
                            .setStyle(MessageButtonStyles.LINK)
                    )
            ]
        }
    }
}