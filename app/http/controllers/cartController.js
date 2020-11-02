const Book = require("../../models/book");

function cartController() {
  return {
    getCart(req, res) {
      req.user
        .populate("cart.items.productId")
        .execPopulate()
        .then((user) => {
          const products = user.cart.items;
          let totalAmount = 0;
          products.forEach((product) => {
            user.cart.totalQuantity += product.quantity;
            totalAmount += product.quantity * product.productId.price;
          });
          return res.render("customer/cart", {
            products: products,
            totalAmount,
          });
        })
        .catch((err) => console.log(err));
    },
    update(req, res) {
      const bookId = req.body.bookId;
      Book.findById(bookId)
        .then((book) => {
          return req.user.addToCart(book);
        })
        .then((result) => {
          res.redirect("/cart");
        });
    },
  };
}

module.exports = cartController;
