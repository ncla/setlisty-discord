import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('user_update_jobs', (table) => {
        table.increments('id')
        table.integer('user_id').notNullable().unsigned()
        table.enum('status', ['WAITING', 'IN_PROGRESS', 'ERROR', 'COMPLETED']).notNullable()
        table.text('debug', 'longtext')
        table.timestamps(true, true)

        table
            .foreign('user_id')
            .references('id')
            .inTable('users')
    })
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('user_update_jobs')
}
