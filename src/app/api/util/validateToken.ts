import prisma from '@/lib/prisma';
import jwt, { JwtPayload } from 'jsonwebtoken';


export async function validateToken(token: any): Promise<boolean> {
    const secretKey = process.env.JWT_SECRET_KEY;
    if (!secretKey) {
        throw new Error("Invalid SecretKey");
    }

    const payload = jwt.verify(token, secretKey) as JwtPayload

    const email = payload?.email;
    if (!email) {
        throw new Error("User email not found in payload");
    }

    const user = await prisma.session.findUnique({
        where: {
            user: email
        }
    });

    if(user?.acessToken === token)
    {
        return true
    }
        return false
}