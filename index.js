require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
//const mongoose = require('mongoose');

//const mySecret = process.env['DB_URL']
const { MongoClient } = require('mongodb');
const dns = require('dns')
const urlparser = require('url')
const client = new MongoClient(process.env.DB_URL)
const db = client.db("urlshortner");
const urls = db.collection("urls")
    //mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology:  true  });

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});


app.post('/api/shorturl', async function(request, response) {
    console.log(request.body);
    const url = request.body.url;
    const hostname = urlparser.parse(url).hostname;

    const address = await performDnsLookup(hostname);
    if (!address) {
        return response.json({ error: 'Invalid URL' });
    }

    const urlCount = await countUrlDocuments();
    const urlDoc = {
        url,
        short_url: urlCount,
    };
    const result = await insertUrlDocument(urlDoc);
    console.log(result);
    response.json({ original_url: url, short_url: urlCount });
});

async function performDnsLookup(hostname) {
    return new Promise((resolve) => {
        dns.lookup(hostname, (error, address) => {
            resolve(address);
        });
    });
}

async function countUrlDocuments() {
    return await urls.countDocuments({});
}

async function insertUrlDocument(urlDoc) {
    return await urls.insertOne(urlDoc);
}


app.get("/api/shorturl/:short_url", async(req, res) => {
    const shorturl = req.params.short_url
    const urlDoc = await urls.findOne({ short_url: +shorturl })
    res.redirect(urlDoc.url)
})


app.listen(port, function() {
    console.log(`Listening on port ${port}`);
});