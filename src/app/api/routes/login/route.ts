import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import crypto from 'crypto';
import { padronizedHash } from "../../util/hash";
import  jwt  from "jsonwebtoken";

const generateJWT = (user: any) => {
    const payload = {
        id: user.id,
        email: user.email
    };

    const secretKey = process.env.JWT_SECRET_KEY || 'your-secret-key';
    const token = jwt.sign(payload, secretKey, { expiresIn: '1h' }); // Gera o token

    return token;
};


const validateHash = (salt: string, storedHashedPassword:string, password: string) => {
  
    const passwordValidate = padronizedHash(password, salt)

    if(storedHashedPassword === passwordValidate)
    {
        return true
    }
    return false
}

export async function POST (request: NextRequest){
    
    try{
        const body = await request.json()
        const { email, password } = body

        const user = await prisma.user.findUnique({where:{email}})

        if (!user) {
            return new NextResponse('User not found', { status: 404 })
        }

        const validatedPassword = validateHash(user.salt, user.hashedPassword, password)

        if(!validatedPassword){
            return new NextResponse('Invalid credentials', { status: 401 })
        }
        const token = generateJWT(user);
        
        return new NextResponse(JSON.stringify({ token }), { status: 200 });
    } catch (err) {
        console.error(err);
        return new NextResponse('Error during login', { status: 500 });
    }

}