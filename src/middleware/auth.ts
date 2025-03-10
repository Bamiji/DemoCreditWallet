import { NextFunction, Request, Response } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface CustomRequest extends Request {
    user: JwtPayload | string | undefined;
}

export function verifyJWT(req: Request, res: Response, next: NextFunction) {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    jwt.verify(token, process.env.TOKEN_SECRET ?? 'test', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        (req as CustomRequest).user = decoded;
        next();
    });
}
