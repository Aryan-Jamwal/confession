//jshint esversion:6

require('dotenv').config(); 
const express= require("express");
const bodyParser= require("body-parser");
const ejs= require("ejs");
const mongoose= require("mongoose");
const session= require("express-session");
const passport= require("passport");
const passportLocalMongoose= require("passport-local-mongoose");
const { initialize } = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


const app= express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: "MynameisAryanJamwal,IITBHU'23",
    resave: false,
    saveUninitialized: false
    // cookie: { secure: true }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true});

const userSchema= new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    confession: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User= new mongoose.model("user", userSchema);

passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user, done){
    done(null, user.id);
});
passport.deserializeUser(function(id, done){
    User.findById(id, function(err, user){
        done(err, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/confessions",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


app.get("/",function(req,res){
    res.render("home");
});

app.get("/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
  );

  app.get("/auth/google/confessions", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect confessions.
    res.redirect('/confessions');
  });

app.get("/confessions", function(req, res){
    // if(req.isAuthenticated()){
    //     res.render("confessions");
    // } else{
    //     res.redirect("/login");
    // }

    User.find({"confession": {$ne: null}}, function(err, foundUsers){
        if(err){
            console.log(err);
        } else{
            if(foundUsers){
                res.render("confessions", {usersWithConfessions: foundUsers});
            }
        }
    });

});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    } else{
        res.redirect("/login");
    } 
});

app.post("/submit", function(req, res){
    const submittedConfession= req.body.confession;
    console.log(req.user);

    User.findById(req.user.id, function(err, foundUser){
        if(err){
            console.log(err);
        } else{
            if(foundUser){
                foundUser.confession= submittedConfession;
                foundUser.save(function(){
                    res.redirect("/confessions");
                });
            }
        }
    });
});

app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err);
        } else{
            res.redirect("/");
        }
    });
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register", function(req, res){

    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else{ 
            passport.authenticate("local")(req, res, function(){
                res.redirect("/confessions");
            });
        }
    });
});

app.post("/login", function(req, res){

    const user= new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err){
        if(err){
            console.log(err);
        } else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/confessions");
            });
        }
    }); 
});







app.listen(3000, function(){
    console.log("Server started on port 3000");
});