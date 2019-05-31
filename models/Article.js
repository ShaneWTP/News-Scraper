// Require mongoose
var mongoose = require("mongoose");
var Note = require("./Note");

// Create schema class
var Schema = mongoose.Schema;

// Create article schema
var ArticleSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  summary: {
    type: String,
  },
  link: {
    type: String,
    required: true
  },
  saved: {
    type: Boolean,
    default: false
  },
  notes: [{
     type: Schema.Types.ObjectId,
     ref: "Note"
  }]
});

// Create model with the ArticleSchema
var Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;