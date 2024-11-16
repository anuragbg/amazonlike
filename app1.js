//jshint esversion:6
import dotenv from "dotenv";
import express from "express";
import ejs from "ejs";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"; 
import { Strategy as FacebookStrategy } from "passport-facebook";
import findOrCreate from "mongoose-findorcreate";

dotenv.config(); // Added dotenv configuration to load environment variables

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

// Session and Passport configuration
app.use(
  session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Database connection
mongoose.connect("mongodb://localhost:27017/userDB", { useNewUrlParser: true, useUnifiedTopology: true });

// Schema and model definitions
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  secret: String,
});

const userSchema2 = new mongoose.Schema({
  purchasecount: Number,
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);
const Count = mongoose.model("Count", userSchema2);

// Passport Local Authentication
passport.use(User.createStrategy());
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "https://yourdomain.com/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ username: profile.emails[0].value }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

// Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      callbackURL: "https://yourdomain.com/auth/facebook/secrets",
      profileFields: ["id", "displayName", "photos", "gender", "email"],
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOrCreate({ username: profile.emails[0].value }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

// Routes
app.get("/", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("index", { usernameejs: "Anurag", subMenuLoginejs: "Sign Out", deliverTopersonejs: "Deliver to Anurag", mysalaryejs: "" });
  } else {
    res.render("index", { usernameejs: "Sign In", subMenuLoginejs: "Sign In", deliverTopersonejs: "Hello", mysalaryejs: "" });
  }
});

app.post("/", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("index", { usernameejs: "Anurag", subMenuLoginejs: "Sign Out", deliverTopersonejs: "Deliver to Anurag", mysalaryejs: "" });
  } else {
    res.render("index", { usernameejs: "Sign In", subMenuLoginejs: "Sign In", deliverTopersonejs: "Hello", mysalaryejs: "" });
  }
});

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/secrets", passport.authenticate("google", { failureRedirect: "/login" }), function (req, res) {
  res.redirect("/secrets");
});

app.get("/auth/facebook", passport.authenticate("facebook"));
app.get("/auth/facebook/secrets", passport.authenticate("facebook", { failureRedirect: "/login" }), function (req, res) {
  res.redirect("/secrets");
});

app.get("/login", function (req, res) {
  res.render("login", { errorMessage: "" });
});

app.get("/register", function (req, res) {
  res.render("register", { errorMessage: "" });
});

app.get("/secrets", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("secrets");
  } else {
    res.redirect("/login");
  }
});

app.get("/professor", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("professor");
  } else {
    res.redirect("/login");
  }
});

app.get("/logout", function (req, res) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post("/register", function (req, res) {
  User.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      res.render("register", { errorMessage: "Please use valid credentials. This username might already be in use." });
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
      res.render("login", { errorMessage: "Please use valid credentials." });
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.listen(process.env.PORT || 3000, function () {
  console.log("PORT successfully connected!!!");
});
