/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
    await knex('wallets').del();
    await knex('wallets').insert([
        {
            balance: 0,
            fk_user_id: 1,
        },
        {
            balance: 100000,
            fk_user_id: 2,
        },
        {
            balance: 500000000000000,
            fk_user_id: 3,
        },
        {
            balance: 500000000000000,
            fk_user_id: 4,
        },
    ]);
};
