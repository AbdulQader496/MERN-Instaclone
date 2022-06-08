import express from "express";
import cors from 'cors';
import mongoose from "mongoose";
import Pusher from "pusher";
//import res from "/express/lib/response.js";
import dbModel from "./dbModel.js";

// app config
const app = express();
const port = process.env.PORT || 8080;

const pusher = new Pusher({
    appId: "1420265",
    key: "776bb38adafcc47e32e2",
    secret: "d95ad76aabe4a1645d8c",
    cluster: "ap1",
    useTLS: true
  });

// middlewares
app.use(express.json())
app.use(cors())



// DB config
const connection_url = "mongodb://localhost:27017/?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false";
mongoose.connect(connection_url, {})

mongoose.connection.once('open', () =>{

    console.log('DB connected')

    const changeStream = mongoose.connection.collection('posts').watch()

    changeStream.on('change', (change) => {
        console.log('change trigger on pusher ...')
        console.log(change)
        console.log('End of change')


        if (change.operationType === 'insert') {
            console.log('change trigger on pusher ... IMG uploaded')

            const postDetails = change.fullDocument;
            pusher.trigger('posts', 'inserted', {

                user: postDetails.user,
                caption: postDetails.caption,
                image: postDetails.image,
            })
        } else {
            console.log('unknown trigger from pusher!!')
        }
    })
})

// api routes
app.get("/", (req, res) => res.status(200).send('hello world!'));

app.post("/upload",(req, res) => {
    const body = req.body;
    dbModel.create(body, (error, data) => {
        if(error) {
            res.status(500).send(error);
        } else {
            res.status(201).send(data)
        }
    })

});

app.get("/sync", (req, res) => {
    dbModel.find((error, data) => {
        if(error) {
            res.status(500).send(error);
        } else {
            res.status(200).send(data)
        }
    })
})

// listener 
app.listen(port, () => console.log(`listining on localhost:${port}`))