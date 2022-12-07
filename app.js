//jshint esversion:6

require('dotenv').config();
const express=require("express");
const ejs = require("ejs");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
const googleStrategy = require("passport-google-oauth20").Strategy;
const facebookStrategy=require("passport-facebook").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app=express();

app.use(express.static("public"));

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.URI,{ useNewUrlParser: true });
//mongoose.connect("mongodb://localhost:27017/userDB");

userSchema = new mongoose.Schema({
    username: String,
    password: String,
    secret:String
}, { writeConcern: { w: 'majority', j: true, wtimeout: 1000 } });

userSchema2 = new mongoose.Schema({
    purchasecount: Number
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User=new mongoose.model("User",userSchema);
const Count=new mongoose.model("Count",userSchema2);

passport.use(User.createStrategy());
passport.serializeUser(function(user,done){
    done(null,user.id);
});
passport.deserializeUser(function(id,done){
    User.findById(id, function(err,user){
        done(err, user);
    });
});

// Make our google strategy by using middleware.
passport.use(new googleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://powerful-brushlands-72875.herokuapp.com/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    //console.log("Google Login Success with Id: "+profile.id);
    User.findOrCreate({ username: profile.emails[0].value }, function (err, user) {
        return cb(err, user);
    });
  }
));
passport.use(new facebookStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    callbackURL: "https://powerful-brushlands-72875.herokuapp.com/auth/facebook/secrets",
    profileFields: ["id","displayName", "photos", "gender", "email"]
},
function(accessToken, refreshToken, profile, cb) {
    //console.log("FB Login Success with Id: "+profile.id);
    User.findOrCreate({ username: profile.emails[0].value }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    if(req.isAuthenticated()){
        res.render("index", {usernameejs: "Anurag", subMenuLoginejs:"Sign Out", deliverTopersonejs:"Deliver to Anurag",mysalaryejs:""});
    }
    else{
        res.render("index", {usernameejs:"Sign In", subMenuLoginejs:"Sign In",deliverTopersonejs:"Hello",mysalaryejs:""});
    }
});
app.post("/",function(req,res){
    if(req.isAuthenticated()){
        res.render("index", {usernameejs: "Anurag", subMenuLoginejs:"Sign Out",deliverTopersonejs:"Deliver to Anurag",mysalaryejs:""});
    }
    else{
        res.render("index", {usernameejs:"Sign In", subMenuLoginejs:"Sign In",deliverTopersonejs:"Hello",mysalaryejs:""});
    }
});
app.get("/auth/google", passport.authenticate("google", { scope : ["profile","email"] }));
app.get("/auth/google/secrets", passport.authenticate("google", { failureRedirect: "/login" }), function(req, res) {
    res.redirect("/secrets");
});
app.get("/auth/facebook", passport.authenticate("facebook"));
app.get("/auth/facebook/secrets", passport.authenticate("facebook", { failureRedirect: "/login" }), function(req, res) {
    res.redirect("/secrets");
});

app.get("/login",function(req,res){
    res.render("login",{errorMessage:""});
});
app.get("/register",function(req,res){
    res.render("register",{errorMessage:""});
});

app.get("/secrets",function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    }
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
        var currentPurchaseCount=0;
        Count.find(function(err,result){
            if(!err){
                if(!result){
                    const newcount=new Count({
                        purchasecount:1
                    });
                    newcount.save();
                    res.render("submit",)
                }else{
                    currentPurchaseCount=result.purchasecount;
                }
            }
        });
    }
    else{
        res.redirect("/login");
    }
});

app.get("/logout", function(req,res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect("/");
      });
});

app.post("/register", function(req,res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if (err) {
            console.log(err);
            res.render("register",{errorMessage:"Please use valid credentials. This username might already be in use."});
        } else {
          passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
          });
        }
      });
});

app.post("/login",function(req,res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
      });
      req.login(user, function(err){
        if (err) {
          console.log(err);
          res.render("login",{errorMessage:"Please use valid credentials."});
        } else {
          passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
          });
        }
      });
});
app.listen(process.env.PORT || 3000,function(){
    console.log("PORT successfully connected!!!");
});