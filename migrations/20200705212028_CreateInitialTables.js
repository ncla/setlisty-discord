// SELECT *, MATCH (venue_name, city_name, state_name, country_name) AGAINST ('bush empire' IN NATURAL LANGUAGE MODE) AS score FROM setlisty.setlists ORDER BY score DESC
exports.up = function(knex) {
    return Promise.all([
        knex.schema.createTable('artists', (table) => {
            table.increments('id')
            table.string('musicbrainz_id').unique().notNullable()
            table.string('artist_name').notNullable()
        }),
        knex.schema.createTable('discord_guilds', (table) => {
            table.increments('id')
            table.bigInteger('guild_id').unique()
            table.integer('artist_id').unsigned()

            table
                .foreign('artist_id')
                .references('id')
                .inTable('artists');
        }),
        knex.schema.createTable('setlists', (table) => {
            table.string('id', 50).primary()
            table.integer('artist_id').notNullable().unsigned()
            table.date('date').notNullable()
            table.json('venue')
            table.string('venue_name')
            table.string('city_name')
            table.string('state_name')
            table.string('country_name')
            table.string('url', 2048).notNullable()

            table
                .foreign('artist_id')
                .references('id')
                .inTable('artists');
        }).then(() => {
            return knex.schema.raw("ALTER TABLE setlists ADD COLUMN searchable_full_name VARCHAR(512) GENERATED ALWAYS AS " +
                "(CONCAT_WS(' ', venue_name, city_name, state_name, country_name, date)) STORED")
        }).then(() => {
            return knex.schema.table('setlists', (table) => {
                table.index('searchable_full_name', 'searchable_full_name_fulltext', 'FULLTEXT')
            })
        }),

        knex.schema.createTable('setlist_tracks', (table) => {
            table.string('setlist_id', 50)
            table.string('name')
            table.boolean('tape').notNullable()
            table.tinyint('set_number')
                .unsigned()
                .defaultTo(0)
                .comment('If the set is an encore, this is the number of the encore, starting with 1 for the first encore, 2 for the second and so on. Otherwise 0 for main set.')
                .notNullable()
            table.string('note')
            table.integer('order_number').unsigned().notNullable()

            table
                .foreign('setlist_id')
                .references('id')
                .inTable('setlists');
        })
    ])
};

exports.down = async function(knex) {
    await knex.schema.dropTable('discord_guilds')
    await knex.schema.dropTable('setlist_tracks')
    await knex.schema.dropTable('setlists')
    await knex.schema.dropTable('artists')
};
