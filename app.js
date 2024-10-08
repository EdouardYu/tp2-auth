var express = require("express");
const path = require('path');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const User = require('./models/userModel'); 

const { roles } = require('./models/roles');
const AccessControl = require('accesscontrol');

var app = express();
const router = express.Router();

app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded()); //Parse URL-encoded bodies

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

// Step 2 - Question 1

mongoose.connect('mongodb://localhost:27017/AuthAndAccessControl', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("Connection to MongoDB Failed:", err);
});

// Step 1 - Question 1
function strongPassword(password) {
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&-])[A-Za-z\d@$!%*?&-]{12,}$/;
    return strongPassword.test(password);
}

// Step 1 - Question 2
function checkEmailFormat(email) {
    const checkEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return checkEmail.test(email);
}

router.get("/", function (req, res) {
    res.render('index');
});

router.get("/register", function (req, res) {
    res.render('register');
});

app.post('/register', async function(req, res){

    const { username, password, passwordConfirm, email } = req.body;
    
    if (!strongPassword(password)) {
            return res.status(400).send("The password must contain at least 12 characters, one uppercase, one lowercase, numbers and special characters.");
        }
        
    if (password !== passwordConfirm) {
            return res.status(400).send("The passwords aren't the same.");
        }
        
    if (!checkEmailFormat(email)) {
            return res.status(400).send("Incorrect email !");
        }
        
    const sanitizedUsername = validator.escape(username);
    const sanitizedEmail = validator.normalizeEmail(email);
     
        
    //1- get data 
    console.log({ sanitizedUsername, sanitizedEmail });

    //2- add user to database 
    const existingUser = await User.findOne({ $or: [{ username: sanitizedUsername }, { email: sanitizedEmail }] });
    if (existingUser) {
        return res.status(400).send("The user's email already exists.");
    }

    const newUser = new User({
        username: sanitizedUsername,
        email: sanitizedEmail,
        password
    });

    await newUser.save();
    console.log("Nouvel utilisateur enregistré :", newUser) 

    //3- if success redirect to login
    res.redirect('login');

 });

//Showing login form
router.get("/login", function (req, res) {
    res.render('login');
});

app.post('/login', async function(req, res){

    //1- get data 
    //console.log(req.body);
    
    //2- authenticate user 
    const { username, password } = req.body;
    const user = await User.findOne({ username: username });
    if (!user) {
        return res.status(400).send("User not found.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).send("Incorrect password.");
     }

    //3- if success redirect to home page 
     console.log("User connected:", user);
     res.redirect('/home');

 });
 
router.get("/home", function (req, res) {
    res.render('home');
});

app.use('/', router);

var port = process.env.PORT || 9000;

app.listen(port, function () {
    console.log("Server Has Started! port: ", port);
});
