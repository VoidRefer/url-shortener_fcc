require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const bodyParser = require('body-parser');
const { status } = require('express/lib/response');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }))

// Database
let urlDatabase = [];
let idCounter = 1;

// Helper function for validating urls
function validateUrl(url, callback) {
  console.log("Validating URL:", url);
  try {
    const urlObject = new URL(url);
    dns.lookup(urlObject.hostname, (err) => {
      if (err) {
        console.log("DNS lookup error:", err);
        return callback(false);
      }
      callback(true);
    });
  } catch {
    callback(false);
  }
}

// POST /api/shorturl
app.post("/api/shorturl", (req, res) => {
  const originalUrl = req.body.url;

  // Check if url present in request body
  if (!originalUrl) {
    return res.json({ error: 'invalid url' });
  }

  // Validate url
  validateUrl(originalUrl, (isValid) => {
    if (!isValid) {
      return res.json({ error: 'invalid url' });
    }

    // Check if url is in the database
    let existingEntry = urlDatabase.find(entry => entry.original_url === originalUrl);
    if (existingEntry) {
      return res.json({
        original_url: originalUrl,
        short_url: existingEntry.short_url
      })
    }

    // Add new entry to database
    const shortUrl = idCounter++;
    urlDatabase.push({
      original_url: originalUrl,
      short_url: shortUrl
    });
    res.json({
      original_url: originalUrl,
      short_url: shortUrl
    });
  })
})

// GET /api/shorturl/<short_url>
app.get("/api/shorturl/:short_url", (req, res) => {
  const shortUrl = parseInt(req.params.short_url);

  // Find the original url
  const entry = urlDatabase.find(entry => entry.short_url === shortUrl);
  if (!entry){
    return res.json({ error: 'invalid url'});
  }

  // Redirerect to original url
  res.redirect(entry.original_url);
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
