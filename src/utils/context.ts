import jwt from 'jsonwebtoken';
import express from 'express';
type Context = {
    userId: string,
    role: string
};
export default function context(req: express.Request){
    const auth_header = req.get("Authorization");
    if(auth_header){
        const jwtToken = auth_header.split(" ")[1];
        if(jwtToken){
            const verify = jwt.verify(jwtToken, process.env.SECRET_KEY);
            if(typeof verify==='object'){
                const {userId, role} = verify;
                return {userId, role};
            }
        }
        return null;
    }
}