import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.table('setlists', function (table) {
        table.string('note', 1024).nullable().after('country_name')
        table.string('tour_name').nullable().after('event_name')
        table.timestamp('last_revision').nullable()
        table.timestamps(true, true)
    })

    await knex.schema.table('setlist_tracks', function (table) {
        table.string('set_name').nullable().after('set_number')
        table.tinyint('encore').nullable().after('set_name')
        table.json('cover').nullable().after('tape')
        table.json('with').nullable().after('cover')
    })
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.table('setlists', function (table) {
        table.dropColumns('note', 'tour_name', 'last_revision')
        table.dropTimestamps()
    })

    await knex.schema.table('setlist_tracks', function (table) {
        table.dropColumns('set_name', 'encore', 'cover', 'with')
    })
}