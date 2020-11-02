const Book = require("../../models/book");

function homeController() {
  return {
    async index(req, res) {
      const books = await Book.find();

      return res.render("home", { books });
    },
  };
}

module.exports = homeController;
