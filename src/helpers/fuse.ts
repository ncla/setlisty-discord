import Fuse from 'fuse.js'
import knex from 'knex';
const env: string = process.env.NODE_ENV || 'development'
const knexConfig = require('../../knexfile')[env]
const knexClient = knex(knexConfig)

class FuseInstance {
    protected fuseInstance: Fuse<any>

    constructor() {
        const options = {
            keys: [
                {
                    name: 'venue_name',
                    weight: 0.8
                },
                {
                    name: 'city_name',
                    weight: 0.4
                },
                {
                    name: 'state_name',
                    weight: 0.2
                },
                {
                    name: 'country_name',
                    weight: 0.6
                },
                {
                    name: 'date',
                    weight: 0.2
                }
            ],
            includeScore: true,
            includeMatches: true,
            shouldSort: true
        }

        this.fuseInstance = new Fuse([], options)
    }

    public async load () {
        const list = await knexClient('setlists')
            .select('id', 'date', 'venue_name', 'city_name', 'state_name', 'country_name')

        this.fuseInstance.setCollection(list)

        return this
    }

    public async search (phrase: string) {
        return this.fuseInstance.search(phrase)
    }
}

export default FuseInstance