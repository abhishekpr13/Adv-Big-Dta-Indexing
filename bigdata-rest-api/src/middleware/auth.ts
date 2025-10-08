import { Request,Response,NextFunction } from "express";
import { OAuth2Client } from 'google-auth-library';
const CLIENT_ID = '328696784737-q9vg36g0surecteaa81gu301u40dh3jp.apps.googleusercontent.com'
const client = new OAuth2Client(CLIENT_ID)

export const verifyToken = async(req: Request, res: Response, next: NextFunction) =>{
    const authHeader = req.headers.authorization;
    if (!authHeader){
        return res.status(401).json({
            error: "No Authorization Header"
        })
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({
            error: "No token provided"
        })
    }
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: CLIENT_ID
        })
        const payload = ticket.getPayload();

        req.user = {
            email: payload?.email,
            name: payload?.name,
            googleId: payload?.sub

        }
        next();
    }catch (error) {
        return res.status(401).json({
            error: "Invalid token"
        });
    }

    
}