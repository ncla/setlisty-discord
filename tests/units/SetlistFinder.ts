import {SetlistNotFoundException, ArtistDoesntExistException, SetlistFinder} from "../../src/services/SetlistFinder";
import {ArtistRepository} from "../../src/repository/ArtistRepository";
import {SetlistRepository} from "../../src/repository/SetlistRepository";
import {SetlistInterface} from "../../src/types/setlist";

describe('SetlistFinder', function () {
    // unit test :-)
    const makeArtistRepo = (returnValue: number | undefined = undefined) => {
        return <ArtistRepository>{
            async getArtistIdForGuildId(guildId: number): Promise<number | undefined> {
                return Promise.resolve(returnValue)
            }
        }
    }

    const makeSetlistRepo = (returnValue: SetlistInterface | undefined = undefined) => {
        return <SetlistRepository>{
            async getSetlistById(id: string): Promise<SetlistInterface | undefined> {
                return Promise.resolve(returnValue)
            },
            async getSetlistBySearchQuery(query: string, artistId: number): Promise<SetlistInterface | undefined> {
                return Promise.resolve(returnValue)
            }
        }
    }

    it('throws when no artist is found', async () => {
        const guildId = 1337;

        const mockArtistRepo = makeArtistRepo(undefined)
        const spy = jest.spyOn(mockArtistRepo, 'getArtistIdForGuildId')

        let command = new SetlistFinder(mockArtistRepo, makeSetlistRepo())

        let promise = command.invoke(guildId, "doesntmatter")

        await expect(promise).rejects.toThrow(ArtistDoesntExistException)
        expect(spy).toHaveBeenCalledWith(guildId)
    })

    describe('when query starts with `id`:', () => {
        it('error thrown when not found', async () => {
            const passedSetlistId = "123";

            const mockSetlistRepo = makeSetlistRepo(undefined);
            const mockArtistRepo = makeArtistRepo(555);

            const spy = jest.spyOn(mockSetlistRepo, 'getSetlistById');

            let command = new SetlistFinder(mockArtistRepo, mockSetlistRepo);
            let promise = command.invoke(111, `id:${passedSetlistId}`);

            await expect(promise).rejects.toThrow(SetlistNotFoundException);

            expect(spy).toHaveBeenCalledWith(passedSetlistId);
        })

        it('returns correct setlist when it was found', async () => {
            const passedSetlistId = "123";
            const expectedSetlist = <SetlistInterface>{id: "123"};

            const mockSetlistRepo = makeSetlistRepo(expectedSetlist);
            const mockArtistRepo = makeArtistRepo(555);

            const spy = jest.spyOn(mockSetlistRepo, 'getSetlistById');

            let command = new SetlistFinder(mockArtistRepo, mockSetlistRepo);
            let promise = command.invoke(111, `id:${passedSetlistId}`);

            await expect(promise).resolves.toEqual(expectedSetlist);

            expect(spy).toHaveBeenCalledWith(passedSetlistId);
        })
    })

    describe('when querying by name', () => {
        it('error thrown when not found', async () => {
            const searchQuery = "i like ducks";

            const mockSetlistRepo = makeSetlistRepo(undefined);
            const mockArtistRepo = makeArtistRepo(555);
            const spy = jest.spyOn(mockSetlistRepo, 'getSetlistBySearchQuery');

            let command = new SetlistFinder(mockArtistRepo, mockSetlistRepo);
            let promise = command.invoke(111, searchQuery);

            await expect(promise).rejects.toThrow(SetlistNotFoundException);

            expect(spy).toHaveBeenCalledWith(searchQuery, 555);
        })

        it('returns correct setlist when it was found', async () => {
            const searchQuery = "i like ducks";
            const expectedSetlist = <SetlistInterface>{id: "123"};

            const mockSetlistRepo = makeSetlistRepo(expectedSetlist);
            const mockArtistRepo = makeArtistRepo(555);

            let command = new SetlistFinder(mockArtistRepo, mockSetlistRepo);
            let promise = command.invoke(111, searchQuery);

            await expect(promise).resolves.toEqual(expectedSetlist);
        })
    })
});