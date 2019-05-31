// Require mongoose
var mongoose = require("mongoose");

// Create a schema class
var Schema = mongoose.Schema;

// Create the note schema
var NoteSchema = new Schema({
    body: {
        type: String
    },
    article: {
        type: Schema.Types.ObjectId,
        ref: "Article"
    }
});

// Create model with the NoteSchema
var Note = mongoose.model("Note", NoteSchema);

module.exports = Note;