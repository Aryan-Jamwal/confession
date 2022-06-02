//jshint esversion:6

require('dotenv').config(); 
const express= require("express");
const bodyParser= require("body-parser");
const ejs= require("ejs");
const mongoose= require("mongoose");
const encrypt= require("mongoose-encryption");


const app= express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser:true});

const userSchema= new mongoose.Schema({
    email: String,
    passward: String
});


userSchema.plugin(encrypt,{secret: process.env.SECRET, encryptedFields:["passward"]}); 


const User= new mongoose.model("user", userSchema);


app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register", function(req, res){
    const newUser= new User({
        email: req.body.username,
        passward: req.body.passward
    });

    newUser.save(function(err){
        if(err){
            console.log(err);
        } else{
            res.render("secrets");
        }
    });
});

app.post("/login", function(req, res){
    const userEmail= req.body.username;
    const passward= req.body.passward;
    User.findOne({email: userEmail},function(err, foundOne){
        if(err){
            console.log(err);
        } else{
            if(foundOne){
                if(passward===passward)
                res.render("secrets");
            }
        }
    });
});







app.listen(3000, function(){
    console.log("Server started on port 3000");
});