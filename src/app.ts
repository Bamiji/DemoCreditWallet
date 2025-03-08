import express from 'express';

import { userCreate } from './api/user.js';

export const app = express();
const port = process.env.PORT ?? '3000';

app.use(express.json());

app.post('/api/v1/user', userCreate);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
