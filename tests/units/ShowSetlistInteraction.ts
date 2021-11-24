import {InteractionGuardException, ShowSetlistInteraction} from "../../src/interactions/ShowSetlistInteraction";
import SetlistFinder from "../../src/services/SetlistFinder";
import sinon, {SinonStubbedInstance} from "sinon";
import {CommandInteraction, CommandInteractionOptionResolver} from "discord.js";
import {expect} from "chai";
import {Setlist} from "../../src/helpers/setlist";

describe('ShowSetlistInteraction', function () {
    let setlistFinder: SinonStubbedInstance<SetlistFinder>
    let interaction: SinonStubbedInstance<CommandInteraction>
    let interactionOptionsResolver: SinonStubbedInstance<CommandInteractionOptionResolver>

    beforeEach(() => {
        setlistFinder = sinon.createStubInstance(SetlistFinder)
        interaction = sinon.createStubInstance(CommandInteraction)
        interactionOptionsResolver = sinon.createStubInstance(CommandInteractionOptionResolver)

        interaction.options = interactionOptionsResolver
    })

    describe('when interaction is sent through DM', () => {
        it('throws exception from "only allowed in guilds" guard', async () => {
            interaction.inGuild.returns(false)

            const showSetlistInteraction = new ShowSetlistInteraction(interaction, setlistFinder)
            const promise = showSetlistInteraction.invoke()

            await expect(promise).to.be.rejectedWith(InteractionGuardException, 'Sorry, this bot is not available through DMs');
        })
    })

    describe('when query option value is empty', () => {
        it('throws exception from query guard', async () => {
            interaction.inGuild.returns(true)
            interactionOptionsResolver.getString.withArgs('query').returns('')

            const showSetlistInteraction = new ShowSetlistInteraction(interaction, setlistFinder)
            const promise = showSetlistInteraction.invoke()

            await expect(promise).to.be.rejectedWith(InteractionGuardException, 'Missing query parameter');
        })
    })

    describe('when invoking SetlistFinder', () => {
        const exceptions = [
            {
                name: 'ArtistNotFoundException',
                expectedReply: 'No artist ID set in this server',
                exception: SetlistFinder.ArtistNotFoundException
            },
            {
                name: 'SetlistNotFoundException',
                expectedReply: 'No setlist was found!',
                exception: SetlistFinder.SetlistNotFoundException
            }
        ]

        exceptions.map(({name, expectedReply, exception}) => {
            it(`replies with "${expectedReply}" when ${name} is thrown`, async () => {
                interaction.inGuild.returns(true)
                interactionOptionsResolver.getString.withArgs('query').returns('asdf')

                setlistFinder.invoke.throws(new exception)

                const showSetlistInteraction = new ShowSetlistInteraction(interaction, setlistFinder)
                await showSetlistInteraction.invoke()

                sinon.assert.calledOnceWithExactly(interaction.reply, expectedReply);
            })
        })

        it('rethrows exception when unhandled exception is thrown from SetlistFinder', async () => {
            interaction.inGuild.returns(true)
            interactionOptionsResolver.getString.withArgs('query').returns('asdf')

            setlistFinder.invoke.throws(new Error('lol'))

            const showSetlistInteraction = new ShowSetlistInteraction(interaction, setlistFinder)
            const promise = showSetlistInteraction.invoke()

            await expect(promise).to.be.rejectedWith(Error, 'lol');
        })
    })

    describe('when setlist is found', () => {
        it('replies with setlist', async () => {
            const guildId = '123';
            const query = 'riga 2022';
            const expectedLocationAndDateText = 'Riga 2022-10-11';
            const expectedSetlistUrl = 'https://www.setlist.fm/setlist/muse/2017/little-johns-farm-reading-england-43e29f4b.html';
            const expectedTracklistText = 'some really cool setlist text';

            interaction.inGuild.returns(true)
            interaction.guildId = guildId
            interactionOptionsResolver.getString.withArgs('query').returns(query)

            const setlistMock = sinon.createStubInstance(Setlist)

            setlistMock.getLocationAndDateText.returns(expectedLocationAndDateText)
            setlistMock.url = expectedSetlistUrl
            setlistMock.getTrackListText.returns(expectedTracklistText)

            setlistFinder.invoke.withArgs(guildId, query).returns(Promise.resolve(setlistMock))

            const showSetlistInteraction = new ShowSetlistInteraction(interaction, setlistFinder)
            await showSetlistInteraction.invoke()

            const interactionReplyOptions = interaction.reply.firstCall.firstArg;

            expect(interactionReplyOptions.embeds[0].title).to.equal(expectedLocationAndDateText)
            expect(interactionReplyOptions.embeds[0].description).to.equal(expectedTracklistText)
            expect(interactionReplyOptions.embeds[0].url).to.equal(expectedSetlistUrl)
        })
    })
})