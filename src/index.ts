import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import auth from './routes/auth.js';
import conversations from './routes/conversations.js';
const app = express();
dotenv.config();
const PORT = process.env.PORT;

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use(cookieParser());

const allowList = ['localhost:3000'] ///set frontend url here

let corsOptionDelegate = (req: express.Request, callback: CallableFunction)=>{
    let corsOption = {
        origin: false,
        credentials: true
    };
    let origin;
    if(req.headers.origin){
        origin = req.headers.origin;
        if(allowList.indexOf(origin)!==-1){
            corsOption = {...corsOption, origin: true}
        }else{
            corsOption = {...corsOption, origin: true}
        }
    }
    callback(null, corsOption)
}
app.use(cors(corsOptionDelegate));
app.get('/',(req, res)=>{
    res.status(200).json({
        message: `Hello to PORT: ${PORT} from Express server`
    })
});

app.use('/auth/', auth);
app.use('/conversations/', conversations);


//add middleware here


app.listen(PORT, ()=>{
    console.log(`Server listening at PORT: ${process.env.PORT}`);
})