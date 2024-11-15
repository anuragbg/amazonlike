//jshint esversion:6

require('dotenv').config();
import express, { static as static_ } from "express";
import ejs from "ejs";
import { urlencoded } from "body-parser";
import { connect, Schema, model } from "mongoose";
import session from "express-session";
import { initialize, session as _session, use, serializeUser, deserializeUser, authenticate } from "passport";
import passportLocalMongoose from "passport-local-mongoose";
import { Strategy as googleStrategy } from "passport-google-oauth20";
import { Strategy as facebookStrategy } from "passport-facebook";
import findOrCreate from "mongoose-findorcreate";

const app=express();

app.use(static_("public"));

app.set("view engine","ejs");
app.use(urlencoded({extended:true}));

app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false
}));
app.use(initialize());
app.use(_session());

//mongoose.connect(process.env.URI,{ useNewUrlParser: true });
connect("mongodb://localhost:27017/userDB");

userSchema = new Schema({
    username: String,
    password: String,
    secret:String
}, { writeConcern: { w: 'majority', j: true, wtimeout: 1000 } });

userSchema2 = new Schema({
    purchasecount: Number
});
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User=new model("User",userSchema);
const Count=new model("Count",userSchema2);

use(User.createStrategy());
serializeUser(function(user,done){
    done(null,user.id);
});
deserializeUser(function(id,done){
    User.findById(id, function(err,user){
        done(err, user);
    });
});

// Make our google strategy by using middleware.
use(new googleStrategy({
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
use(new facebookStrategy({
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
app.get("/auth/google", authenticate("google", { scope : ["profile","email"] }));
app.get("/auth/google/secrets", authenticate("google", { failureRedirect: "/login" }), function(req, res) {
    res.redirect("/secrets");
});
app.get("/auth/facebook", authenticate("facebook"));
app.get("/auth/facebook/secrets", authenticate("facebook", { failureRedirect: "/login" }), function(req, res) {
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
app.get("/professor",function(req,res){
    if(req.isAuthenticated()){
        res.render("professor");
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
          authenticate("local")(req, res, function(){
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
          authenticate("local")(req, res, function(){
            res.redirect("/secrets");
          });
        }
      });
});
app.post("/submit",function(req,res){
    res.redirect("/"); //Temporrary action after submit!!! I have to change this later
});


app.listen(process.env.PORT || 3000,function(){
    console.log("PORT successfully connected!!!");
});