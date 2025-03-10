/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function (knex) {
    return knex.schema.createTable('wallets', (table) => {
        table.increments('id').primary();
        table.decimal('balance', 19, 4).notNullable();
        table.integer('fk_user_id').unsigned().notNullable();
        table.foreign('fk_user_id').references('id').inTable('users').onDelete('CASCADE');
        table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function (knex) {
    return knex.schema.dropTableIfExists('wallets');
};
