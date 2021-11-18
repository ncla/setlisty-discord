import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    // setlist.fm themself reference all events as "festivals", but you end up with charity events being "festivals" too then
    // e.g. https://www.setlist.fm/setlist/muse/2009/royal-albert-hall-london-england-13d7352d.html
    // so we will use "events" instead :-)
    await knex.schema.table('setlists', function (table) {
        table.string('event_id', 50).nullable().after('venue')
        table.string('event_name').nullable().after('event_id')
        table.timestamp('setlist_page_last_checked').nullable().after('searchable_full_name')
    })

    await knex.schema.raw("ALTER TABLE setlists MODIFY COLUMN searchable_full_name VARCHAR(512) GENERATED ALWAYS AS " +
        "(CONCAT_WS(' ', event_name, venue_name, city_name, state_name, country_name, date)) STORED")
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.table('setlists', function (table) {
        table.dropColumns('event_id', 'event_name', 'setlist_page_last_checked')
    })

    await knex.schema.raw("ALTER TABLE setlists ADD COLUMN searchable_full_name VARCHAR(512) GENERATED ALWAYS AS " +
        "(CONCAT_WS(' ', venue_name, city_name, state_name, country_name, date)) STORED")
}