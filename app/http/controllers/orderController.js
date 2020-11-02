const Order = require("../../models/order");
const moment = require("moment");
const AppError = require("../../../utils/appError");
const sms = require("fast-two-sms");
const stripe = require("stripe")(process.env.STRIPE_KEY);

function orderController() {
  return {
    store(req, res) {
      const { phone, address, stripeToken, paymentType } = req.body;
      if (!phone || !address) {
        return res.status(400).json({ message: "All fields are required" });
      }

      let total = 0;
      req.user
        .populate("cart.items.productId")
        .execPopulate()
        .then((user) => {
          const products = user.cart.items.map((product) => {
            total += product.quantity * product.productId.price;
            return {
              quantity: product.quantity,
              product: { ...product.productId._doc },
            };
          });
          const order = new Order({
            customerId: req.user._id,
            products: products,
            phone: phone,
            address: address,
          });

          sms.sendMessage({
            authorization:
              "j69HYhRef2FK5LOiqktZSc0lsByd1EVovgWuAUT4zXQxaP87MmwSOpsBPDCGlH0UAhcieIqg9fQ8dvau",
            message:
              "To confirm your order plz contact 7507232188(Whatsapp Only)",
            numbers: [order.phone],
          });

          order
            .save()
            .then((result) => {
              Order.populate(
                result,
                { path: "customerId" },
                (err, placedOrder) => {
                  //Stripe Payment

                  if (paymentType === "card") {
                    stripe.charges
                      .create({
                        amount: total * 100,
                        source: stripeToken,
                        currency: "inr",
                        description: `Book Order: ${placedOrder._id}`,
                      })
                      .then(() => {
                        placedOrder.paymentStatus = true;
                        placedOrder.paymentType = paymentType;
                        placedOrder
                          .save()
                          .then((ord) => {
                            const eventEmitter = req.app.get("eventEmitter");
                            eventEmitter.emit("orderPlaced", ord);
                            req.user.clearCart();
                            return res.json({
                              message:
                                "Payment Successfull,Order Placed Successfully",
                            });
                          })
                          .catch((err) => {
                            console.log(err);
                          });
                      })
                      .catch((err) => {
                        req.user.clearCart();
                        return res.json({
                          message:
                            "Order Placed but Payment Failed! You can pay at delivery time",
                        });
                      });
                  } else {
                    req.user.clearCart();
                    return res.json({
                      message: "Order Placed!",
                    });
                  }
                }
              );
            })
            .catch((err) => {
              return res.status(500).json({
                message: "Something went wrong",
              });
            });
        });
    },
    async index(req, res) {
      const orders = await Order.find({ customerId: req.user._id }, null, {
        sort: { createdAt: -1 },
      });
      res.header(
        "Cache-Control",
        "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
      );
      res.render("customer/order", { orders, moment: moment });
    },
    async show(req, res, next) {
      const order = await Order.findById(req.params.id);

      if (!order) {
        return next(new AppError("No Order with that Id Exists!", 404));
      }

      if (req.user._id.toString() === order.customerId.toString()) {
        return res.render("customer/singleOrder", { order });
      }
      return res.redirect("/");
    },
  };
}

module.exports = orderController;
