import dotenv from 'dotenv';
dotenv.config({ path: '../../../.env' });
const config = {
    development: {
        client: 'mysql2',
        connection: {
            database: process.env.DB_DATABASE,
            host: process.env.DB_HOST,
            password: process.env.DB_PASSWORD,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
        },
        migrations: {
            directory: '../../../knex/migrations',
        },
        seeds: {
            directory: '../../../knex/seeds',
        },
    },
    test: {
        client: 'mysql2',
        connection: {
            database: 'testdemocreditwallet',
            host: process.env.DB_HOST,
            password: process.env.DB_PASSWORD,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
        },
        migrations: {
            directory: '../../../knex/migrations',
        },
        seeds: {
            directory: '../../../knex/seeds',
        },
    },
};
export default config;
