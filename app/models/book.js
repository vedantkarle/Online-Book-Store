const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bookSchema = new Schema({
  name: {
    type: String,
    required: [true, "A book must have a name"],
  },
  image: {
    type: String,
    required: [true, "A book must have a image"],
  },
  price: {
    type: Number,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
});

const Book = mongoose.model("Book", bookSchema);

module.exports = Book;
