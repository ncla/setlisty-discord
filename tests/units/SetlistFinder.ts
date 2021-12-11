import SetlistFinder from "../../src/services/SetlistFinder";
import {ArtistRepository} from "../../src/repository/ArtistRepository";
import {SetlistRepository} from "../../src/repository/SetlistRepository";
import {Setlist} from "../../src/helpers/setlist";

import chai, {expect} from "chai";
import ChaiAsPromised from "chai-as-promised";
import sinon from "sinon";
import { ArtistNotFoundException, SetlistNotFoundException } from "../../src/helpers/exceptions";

chai.use(ChaiAsPromised);

describe('SetlistFinder', function () {
    it('throws when no artist is found', async () => {
        const guildId = '1337';

        const mockArtistRepo = sinon.createStubInstance(ArtistRepository);
        mockArtistRepo.getArtistIdForGuildId.returns(Promise.resolve(undefined));

        const setlistRepo = sinon.createStubInstance(SetlistRepository)
        let command = new SetlistFinder(mockArtistRepo, setlistRepo)

        let promise = command.invoke(guildId, "doesntmatter")

        await expect(promise).to.eventually.be.rejectedWith(ArtistNotFoundException)
        expect(mockArtistRepo.getArtistIdForGuildId.calledOnce).to.be.true
    })

    describe('when query starts with `id`:', () => {
        it('error thrown when not found', async () => {
            const passedSetlistId = "123"

            const mockSetlistRepo = sinon.createStubInstance(SetlistRepository)
            mockSetlistRepo.getSetlistById.returns(Promise.resolve(undefined))

            const mockArtistRepo = sinon.createStubInstance(ArtistRepository)
            mockArtistRepo.getArtistIdForGuildId.returns(Promise.resolve(555))

            let command = new SetlistFinder(mockArtistRepo, mockSetlistRepo)
            let promise = command.invoke('111', `id:${passedSetlistId}`)

            await expect(promise).to.eventually.be.rejectedWith(SetlistNotFoundException)

            sinon.assert.calledOnceWithExactly(mockSetlistRepo.getSetlistById, passedSetlistId)
        })

        it('returns correct setlist when it was found', async () => {
            const passedSetlistId = "123";
            const expectedSetlist = <Setlist>{id: "123"};

            const mockSetlistRepo = sinon.createStubInstance(SetlistRepository)
            mockSetlistRepo.getSetlistById.returns(Promise.resolve(expectedSetlist))

            const mockArtistRepo = sinon.createStubInstance(ArtistRepository)
            mockArtistRepo.getArtistIdForGuildId.returns(Promise.resolve(555))

            let command = new SetlistFinder(mockArtistRepo, mockSetlistRepo);
            let promise = command.invoke('111', `id:${passedSetlistId}`);

            await expect(promise).to.become(expectedSetlist);

            sinon.assert.calledOnceWithExactly(mockSetlistRepo.getSetlistById, passedSetlistId);
        })
    })

    describe('when querying by name', () => {
        it('error thrown when not found', async () => {
            const searchQuery = "i like ducks";

            const mockSetlistRepo = sinon.createStubInstance(SetlistRepository)
            mockSetlistRepo.getSetlistBySearchQuery.returns(Promise.resolve(undefined))

            const mockArtistRepo = sinon.createStubInstance(ArtistRepository)
            mockArtistRepo.getArtistIdForGuildId.returns(Promise.resolve(555))

            let command = new SetlistFinder(mockArtistRepo, mockSetlistRepo);
            let promise = command.invoke('111', searchQuery);

            await expect(promise).to.be.rejectedWith(SetlistNotFoundException);
            sinon.assert.calledOnceWithExactly(mockSetlistRepo.getSetlistBySearchQuery, searchQuery, 555);
        })

        it('returns correct setlist when it was found', async () => {
            const searchQuery = "i like ducks";
            const expectedSetlist = <Setlist>{id: "123"};

            const mockSetlistRepo = sinon.createStubInstance(SetlistRepository)
            mockSetlistRepo.getSetlistBySearchQuery.returns(Promise.resolve(expectedSetlist))

            const mockArtistRepo = sinon.createStubInstance(ArtistRepository)
            mockArtistRepo.getArtistIdForGuildId.returns(Promise.resolve(555))

            let command = new SetlistFinder(mockArtistRepo, mockSetlistRepo);
            let promise = command.invoke('111', searchQuery);

            await expect(promise).to.become(expectedSetlist);
        })
    })
});