import bcrypt from 'bcryptjs';
/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const seed = async function (knex) {
    await knex('users').del();
    await knex('users').insert([
        {
            id: 1,
            email: 'seed@mail.com',
            first_name: 'firstname',
            last_name: 'lastname',
            password_hash: await bcrypt.hash('password', 10),
        },
        {
            id: 2,
            email: 'seed2@mail.com',
            first_name: 'firstname2',
            last_name: 'lastname2',
            password_hash: await bcrypt.hash('password2', 10),
        },
    ]);
};
