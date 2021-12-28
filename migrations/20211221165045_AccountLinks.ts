import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('users', (table) => {
        table.increments('id')
        table.bigInteger('discord_user_id').unique()
        table.string('setlistfm_username').nullable()
    })

    await knex.schema.createTable('setlist_attendees', (table) => {
        table.increments('id')
        table.string('setlist_id', 50)
        table.integer('user_id').notNullable().unsigned()

        table
            .foreign('user_id')
            .references('id')
            .inTable('users')

        table
            .foreign('setlist_id')
            .references('id')
            .inTable('setlists');
    })
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('setlist_attendees')
    await knex.schema.dropTable('users')
}
