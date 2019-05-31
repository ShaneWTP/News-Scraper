// Dependencies
var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");
var path = require("path");

// Require models
var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Scrapers
var request = require("request");
var cheerio = require("cheerio");

// Set mongoose to leverage built in JavaScript ES6 Promises
mongoose.Promise = Promise;

// Define port
var port = process.env.PORT || 27017

// Initialize Express
var app = express();

app.use(logger("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// Make public a static dir
app.use(express.static("public"));

// Set Handlebars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

// Database configuration with mongoose
mongoose.connect("mongodb://127.0.0.1:27017/rollingstonedb", { useNewUrlParser: true });
var db = mongoose.connection;

// Show any mongoose errors
db.on("error", function (error) {
  console.log("Mongoose Error: ", error);
});

// Once logged in to the db through mongoose, log a success message
db.once("open", function () {
  console.log("Mongoose connection successful.");
});


//GET requests to render Handlebars pages
app.get("/", function (req, res) {
  Article.find({ "saved": false }, function (error, data) {
    var hbsObject = {
      article: data
    };
    console.log(hbsObject);
    res.render("index", hbsObject);
  });
});

app.get("/saved", function (req, res) {
  Article.find({ "saved": true }).populate("notes").exec(function (error, articles) {
    var hbsObject = {
      article: articles
    };
    res.render("saved", hbsObject);
  });
});

// Get request to scrape site
app.get("/scrape", function (req, res) {
  request("https://www.rollingstone.com/music/music-news/", function (error, response, html) {

    var $ = cheerio.load(html);

    $("article").each(function (i, element) {

      var result = {};

      result.title = $(this).find("h3").text();
      result.summary = $(this).find("p").text();
      result.link = $(this).find("a").attr("href");

      // Create new article entry
      var entry = new Article(result);

      entry.save(function (err, doc) {
        if (err) {
          console.log(err);
        }
        else {
          console.log(doc);
        }
      });

    });
    res.send("Scrape Complete");

  });
});

// Get scraped articles
app.get("/articles", function (req, res) {
  Article.find({}, function (error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      res.json(doc);
    }
  });
});

// Get article by ID
app.get("/articles/:id", function (req, res) {
  Article.findOne({ "_id": req.params.id })
    .populate("note")
    .exec(function (error, doc) {
      if (error) {
        console.log(error);
      }
      else {
        res.json(doc);
      }
    });
});


// Save an article
app.post("/articles/save/:id", function (req, res) {
  Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": true })
    .exec(function (err, doc) {
      if (err) {
        console.log(err);
      }
      else {
        res.send(doc);
      }
    });
});

// Delete an article
app.post("/articles/delete/:id", function (req, res) {
  Article.findOneAndUpdate({ "_id": req.params.id }, { "saved": false, "notes": [] })
    .exec(function (err, doc) {
      if (err) {
        console.log(err);
      }
      else {
        res.send(doc);
      }
    });
});


// Create a new note
app.post("/notes/save/:id", function (req, res) {
  var newNote = new Note({
    body: req.body.text,
    article: req.params.id
  });
  console.log(req.body)
  newNote.save(function (error, note) {
    if (error) {
      console.log(error);
    }
    else {
      Article.findOneAndUpdate({ "_id": req.params.id }, { $push: { "notes": note } })
        .exec(function (err) {
          if (err) {
            console.log(err);
            res.send(err);
          }
          else {
            res.send(note);
          }
        });
    }
  });
});

// Delete a note
app.delete("/notes/delete/:note_id/:article_id", function (req, res) {
  Note.findOneAndRemove({ "_id": req.params.note_id }, function (err) {
    if (err) {
      console.log(err);
      res.send(err);
    }
    else {
      Article.findOneAndUpdate({ "_id": req.params.article_id }, { $pull: { "notes": req.params.note_id } })
        .exec(function (err) {
          if (err) {
            console.log(err);
            res.send(err);
          }
          else {
            res.send("Note Deleted");
          }
        });
    }
  });
});

app.listen(port, function () {
  console.log("App running on port " + port);
});