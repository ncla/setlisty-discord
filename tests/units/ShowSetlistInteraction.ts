import {InteractionGuardException, ShowSetlistInteraction} from "../../src/interactions/ShowSetlistInteraction";
import {SetlistFinder} from "../../src/services/SetlistFinder";
import sinon from "sinon";
import {ArtistRepository} from "../../src/repository/ArtistRepository";
import {SetlistRepository} from "../../src/repository/SetlistRepository";
import {CommandInteraction, CommandInteractionOptionResolver} from "discord.js";
import {expect} from "chai";

describe('ShowSetlistInteraction', function () {
    it('throws exception when "only allowed in guilds" guard fails', async () => {
        const mockArtistRepo = sinon.createStubInstance(ArtistRepository);
        mockArtistRepo.getArtistIdForGuildId.returns(Promise.resolve(undefined));

        const setlistRepo = sinon.createStubInstance(SetlistRepository)
        let setlistFinder = new SetlistFinder(mockArtistRepo, setlistRepo)

        const interaction = sinon.createStubInstance(CommandInteraction)

        interaction.options = sinon.createStubInstance(CommandInteractionOptionResolver)
        interaction.inGuild.returns(false)

        const showSetlistInteraction = new ShowSetlistInteraction(interaction, setlistFinder)

        const promise = showSetlistInteraction.invoke()

        await expect(promise).to.be.rejectedWith(InteractionGuardException, 'Sorry, this bot is not available through DMs');
    })
})