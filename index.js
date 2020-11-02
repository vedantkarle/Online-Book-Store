require("dotenv").config();
const express = require("express");
const app = express();
const path = require("path");
const ejs = require("ejs");
const mongoose = require("mongoose");
const expressEjsLayout = require("express-ejs-layouts");
const passport = require("passport");
const LocalStartegy = require("passport-local").Strategy;
const session = require("express-session");
const flash = require("express-flash");
const bcrypt = require("bcrypt");
const User = require("./app/models/user");
const mongoDBStore = require("connect-mongo")(session);
const AppError = require("./utils/appError");

const Emitter = require("events");

//Database

mongoose.connect(process.env.MONGO_URL, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: true,
});

const connection = mongoose.connection;

passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    cb(err, user);
  });
});

//session

const mongoStore = new mongoDBStore({
  mongooseConnection: connection,
  collection: "sessions",
});

//Event emitter

const eventEmitter = new Emitter();
app.set("eventEmitter", eventEmitter);

app.use(
  session({
    store: mongoStore,
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStartegy({ usernameField: "email" }, async (email, password, cb) => {
    const user = await User.findOne({ email: email });
    if (!user) {
      return cb(null, false, { message: "No user with this email" });
    }
    bcrypt
      .compare(password, user.password)
      .then((match) => {
        if (match) {
          return cb(null, user, { message: "Logged in successfully" });
        }
        return cb(null, false, { message: "Wrong username or password" });
      })
      .catch((err) => {
        return cb(null, false, { message: "Something went wrong" });
        4;
      });
  })
);

app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.user = req.user;
  next();
});

app.use(expressEjsLayout);
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set("views", path.join(__dirname, "/resources/views"));
app.set("view engine", "ejs");

require("./routes/web")(app);

app.all("*", (req, res, next) => {
  next(new AppError(`Cant Find ${req.originalUrl}`, 404));
});

app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
  if (err.name === "CastError") message = "Invalid Value";
  if (err.code === 11000) message = "Duplicate Field Value";
  res.status(statusCode).render("error", { title: "Error", message });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log("server started");
});

//Socket
const io = require("socket.io")(server);

io.on("connection", (socket) => {
  //Join
  socket.on("join", (orderId) => {
    socket.join(orderId);
  });
});

eventEmitter.on("orderUpdated", (data) => {
  io.to(`order_${data.id}`).emit("orderUpdated", data);
});

eventEmitter.on("orderPlaced", (data) => {
  io.to("adminRoom").emit("orderPlaced", data);
});
