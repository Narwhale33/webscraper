var express = require("express");
var router = express.Router();
var request = require("request");
var cheerio = require("cheerio");
var mongoose = require("mongoose");
mongoose.Promise = Promise;

var Note = require("../models/Note.js");
var Article = require("../models/Article.js");

router.get("/", function(req, res) {
  res.render("index");
});

router.get("/save", function(req, res) {
  Article.find({}, function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      var hbsArticleObject = {
        articles: doc
      };
      res.render("save", hbsArticleObject);
    }
  });
});



router.post("/scrape", function(req, res) {
 
  request("http://www.nytimes.com/", function(error, response, html) {
    
    var $ = cheerio.load(html);
    var scrapedArticles = {};
    $("article h2").each(function(i, element) {
      var result = {};
      result.title = $(this).children("a").text();
      console.log("Title from results: " + result.title);
      result.link = $(this).children("a").attr("href");
      scrapedArticles[i] = result;
    });
    console.log("Scraped Articles: " + scrapedArticles);
    var hbsArticleObject = {
        articles: scrapedArticles
    };
    res.render("index", hbsArticleObject);
  });
});


router.post("/save", function(req, res) {
  console.log("Title: " + req.body.title);
  var newArticleObject = {};

  newArticleObject.title = req.body.title;
  newArticleObject.link = req.body.link;
  var entry = new Article(newArticleObject);
  console.log("Save Articles: " + entry);
  entry.save(function(err, doc) {
    if (err) {
      console.log(err);
    }
    else {
      console.log(doc);
    }
  });
  res.redirect("/save");
});



router.get("/delete/:id", function(req, res) {
 
  console.log("Delete is ready.");
  Article.findOneAndRemove({"_id": req.params.id}, function (err, offer) {
    if (err) {
      console.log("Not able to delete:" + err);
    } else {
      console.log("Able to delete");
    }
    res.redirect("/save");
  });
});



router.get("/notes/:id", function(req, res) {
  
  console.log("Delete is ready.");
  Note.findOneAndRemove({"_id": req.params.id}, function (err, doc) {
    if (err) {
      console.log("Not able to delete:" + err);
    } else {
      console.log("Able to delete");
    }
    res.send(doc);
  });
});



router.get("/articles/:id", function(req, res) {

  Article.findOne({"_id": req.params.id})
  .populate('notes')
  .exec(function(err, doc) {
    if (err) {
      console.log("cannot find.");
    }
    else {
      console.log("Get article and note? " + doc);
      res.json(doc);
    }
  });
});



router.post("/articles/:id", function(req, res) {
  
  var newNote = new Note(req.body);
  newNote.save(function(error, doc) {
    if (error) {
      console.log(error);
    }
    else {
      Article.findOneAndUpdate({ "_id": req.params.id }, {$push: {notes: doc._id}}, {new: true, upsert: true})
      .populate('notes')
      .exec(function (err, doc) {
        if (err) {
          console.log("Cannot find article.");
        } else {
          console.log("Save note? " + doc.notes);
          res.send(doc);
        }
      });
    }
  });
});


module.exports = router;
