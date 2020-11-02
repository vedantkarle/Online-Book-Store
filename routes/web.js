const homeController = require("../app/http/controllers/homeController");
const authController = require("../app/http/controllers/authController");
const cartController = require("../app/http/controllers/cartController");
const orderController = require("../app/http/controllers/orderController");
const AdminOrderController = require("../app/http/controllers/admin/orderController");
const StatusController = require("../app/http/controllers/admin/statusController");
const isLoggedIn = require("../app/http/middlewares/guest");
const admin = require("../app/http/middlewares/admin");
const catchAsync = require("../utils/catchAsync");

function initRoutes(app) {
  app.get("/", catchAsync(homeController().index));

  app.get("/cart", isLoggedIn, cartController().getCart);

  app.post("/cart", isLoggedIn, cartController().update);

  app.get("/login", authController().getLogin);

  app.post("/login", authController().postLogin);

  app.get("/register", authController().getRegister);

  app.post("/logout", authController().logout);

  app.post("/register", catchAsync(authController().postRegister));

  app.post("/order", isLoggedIn, orderController().store);

  app.get("/customer/orders", isLoggedIn, catchAsync(orderController().index));

  app.get(
    "/customer/orders/:id",
    isLoggedIn,
    catchAsync(orderController().show)
  );

  app.get("/admin/orders", admin, AdminOrderController().index);

  app.post("/admin/orders/status", admin, StatusController().update);
}

module.exports = initRoutes;
