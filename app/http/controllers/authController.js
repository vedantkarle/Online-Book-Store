const User = require("../../models/user");
const bcrypt = require("bcrypt");
const passport = require("passport");

function authController() {
  return {
    getLogin(req, res) {
      res.render("auth/login");
    },
    getRegister(req, res) {
      res.render("auth/register");
    },
    postLogin(req, res, next) {
      const { email, password } = req.body;
      if (!email || !password) {
        req.flash("error", "All fields are required");
        return res.redirect("/login");
      }
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          req.flash("error", info.message);
          return next(err);
        }
        if (!user) {
          req.flash("error", info.message);
          return res.redirect("/login");
        }
        req.logIn(user, (err) => {
          if (err) {
            req.flash("error", info.message);
            return next(err);
          }

          return res.redirect("/");
        });
      })(req, res, next);
    },
    async postRegister(req, res) {
      const { name, email, password } = req.body;
      // Validate request
      if (!name || !email || !password) {
        req.flash("error", "All fields are required");
        req.flash("name", name);
        req.flash("email", email);
        return res.redirect("/register");
      }

      // Check if email exists

      const existingUser = await User.findOne({ email: email });

      if (existingUser) {
        req.flash("error", "Email already taken");
        req.flash("name", name);
        req.flash("email", email);
        return res.redirect("/register");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      // Create a user
      const user = new User({
        name,
        email,
        password: hashedPassword,
      });

      user
        .save()
        .then((user) => {
          req.flash("success", "Account created successfully!");
          return res.redirect("/login");
        })
        .catch((err) => {
          req.flash("error", "Something went wrong!");
          return res.redirect("/register");
        });
    },
    logout(req, res) {
      req.logout();
      res.redirect("/");
    },
  };
}

module.exports = authController;
