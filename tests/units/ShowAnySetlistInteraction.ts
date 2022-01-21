import {ShowAnySetlistInteraction} from "../../src/interactions/ShowAnySetlistInteraction";
import sinon, {SinonStubbedInstance} from "sinon";
import {CommandInteraction, CommandInteractionOptionResolver} from "discord.js";
import SetlistFinderWeb, { NoSetlistsFoundException } from "../../src/services/SetlistFinderWeb";
import SetlistUpdater from "../../src/services/SetlistUpdater";
import {SetlistRepository} from "../../src/repository/SetlistRepository";
import {expect} from "chai";
import {Setlist} from "../../src/helpers/setlist";

describe('ShowAnySetlistInteraction', function () {
    let interaction: SinonStubbedInstance<CommandInteraction>
    let interactionOptionsResolver: SinonStubbedInstance<CommandInteractionOptionResolver>
    let setlistWebFinder: SinonStubbedInstance<SetlistFinderWeb>
    let setlistUpdator: SinonStubbedInstance<SetlistUpdater>
    let setlistRepository: SinonStubbedInstance<SetlistRepository>

    beforeEach(() => {
        interaction = sinon.createStubInstance(CommandInteraction)
        interactionOptionsResolver = sinon.createStubInstance(CommandInteractionOptionResolver)

        interaction.options = interactionOptionsResolver

        setlistWebFinder = sinon.createStubInstance(SetlistFinderWeb)
        setlistUpdator = sinon.createStubInstance(SetlistUpdater)
        setlistRepository = sinon.createStubInstance(SetlistRepository)
    })

    it('when NoSetlistsFoundException is thrown reply with "No search results were found!"', async () => {
        const showAnyInteraction = new ShowAnySetlistInteraction(
            interaction,
            setlistWebFinder,
            setlistUpdator,
            setlistRepository
        )

        interaction.inGuild.returns(true)
        interactionOptionsResolver.getString.withArgs('query').returns('asdf')

        setlistWebFinder.findSetlistIdThroughWebSearch.throws(new NoSetlistsFoundException())

        await showAnyInteraction.invoke()

        sinon.assert.calledOnceWithExactly(interaction.reply, "No search results were found!");
    })

    it('when SetlistNotFoundException is thrown reply with "No setlist was found!"', async () => {
        const showAnyInteraction = new ShowAnySetlistInteraction(
            interaction,
            setlistWebFinder,
            setlistUpdator,
            setlistRepository
        )

        interaction.inGuild.returns(true)
        interactionOptionsResolver.getString.withArgs('query').returns('asdf')

        setlistWebFinder.findSetlistIdThroughWebSearch.returns(Promise.resolve('1231488'))
        setlistRepository.getSetlistById.returns(Promise.resolve(undefined))
        await showAnyInteraction.invoke()

        // TODO: Unsure if these assertions should be here.
        sinon.assert.calledTwice(setlistRepository.getSetlistById)
        sinon.assert.calledOnce(setlistUpdator.runSingleSetlistUpdate)

        sinon.assert.calledOnceWithExactly(interaction.reply, "No setlist was found!");
    })

    it('rethrows exception when unhandled exception is thrown from SetlistFinderWeb', async () => {
        const showAnyInteraction = new ShowAnySetlistInteraction(
            interaction,
            setlistWebFinder,
            setlistUpdator,
            setlistRepository
        )

        interaction.inGuild.returns(true)
        interactionOptionsResolver.getString.withArgs('query').returns('asdf')

        setlistWebFinder.findSetlistIdThroughWebSearch.throws(new Error('lolswag'))

        const promise = showAnyInteraction.invoke()

        await expect(promise).to.be.rejectedWith(Error, 'lolswag');
    })

    it('replies with setlist when setlist already exists in our database', async () => {
        const showAnyInteraction = new ShowAnySetlistInteraction(
            interaction,
            setlistWebFinder,
            setlistUpdator,
            setlistRepository
        )

        interaction.inGuild.returns(true)
        interactionOptionsResolver.getString.withArgs('query').returns('asdf')

        setlistWebFinder.findSetlistIdThroughWebSearch.returns(Promise.resolve('1231488'))

        const setlistMock = sinon.createStubInstance(Setlist)

        const expectedLocationAndDateText = 'Riga 2022-10-11';
        const expectedSetlistUrl = 'https://www.setlist.fm/setlist/muse/2017/little-johns-farm-reading-england-43e29f4b.html';
        const expectedTracklistText = 'some really cool setlist text';

        setlistMock.getSetlistTitle.returns(expectedLocationAndDateText)
        setlistMock.url = expectedSetlistUrl
        setlistMock.getTrackListText.returns(expectedTracklistText)

        setlistRepository.getSetlistById.returns(Promise.resolve(setlistMock))

        await showAnyInteraction.invoke()

        const interactionReplyOptions = interaction.reply.firstCall.firstArg;

        expect(interactionReplyOptions.embeds[0].title).to.equal(expectedLocationAndDateText)
        expect(interactionReplyOptions.embeds[0].description).to.equal(expectedTracklistText)
        expect(interactionReplyOptions.embeds[0].url).to.equal(expectedSetlistUrl)
    })
})