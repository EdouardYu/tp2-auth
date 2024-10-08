var express = require("express");
const path = require('path');

const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcrypt');
const User = require('./models/userModel'); 

const { roles } = require('./models/roles');
const AccessControl = require('accesscontrol');

const session = require('express-session');

var app = express();
const router = express.Router();

app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded({ extended: true })); //Parse URL-encoded bodies

app.set('view engine', 'ejs');

app.use(express.static(__dirname + '/public'));

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Step 2 - Question 1

mongoose.connect('mongodb://localhost:27017/AuthAndAccessControl', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("Connection to MongoDB Failed:", err);
});

function strongPassword(password) {
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&-])[A-Za-z\d@$!%*?&-]{12,}$/;
    return strongPassword.test(password);
}

function checkEmailFormat(email) {
    const checkEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return checkEmail.test(email);
}

function grantAccess(action, resource) {
    return (req, res, next) => {
        const role = req.session.user.role;
        const permission = ac.can(role)[action](resource);
        if (!permission.granted) {
            return res.status(403).send("Access Denied");
        }
        next();
    };
}

router.get("/", function (req, res) {
    res.render('index');
});

router.get("/register", function (req, res) {
    res.render('register');
});

app.post('/register', async function(req, res){

    const { username, password, passwordConfirm, email, role } = req.body;
    
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

    let newUser = new User({
        username: sanitizedUsername,
        email: sanitizedEmail,
        password,
        role: role || 'user'
    });
    
    const existingAdmin = await User.findOne({ role: 'admin' });
        if (role === 'admin' && !existingAdmin) {
            newUser.role = 'admin';
        } else if (role === 'admin' && req.user.role !== 'admin') {
            return res.status(403).send("Only administrators can change the user's role.");
        }

    await newUser.save();
    console.log("New user registered :", newUser) 

    //3- if success redirect to login
    res.redirect('/login');

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

    const correctPassword = await bcrypt.compare(password, user.password);
    if (!correctPassword) {
        return res.status(400).send("Incorrect password.");
     }

     req.session.user = {
        username: user.username,
        role: user.role
     };


    //3- if success redirect to home page 
     console.log("User connected:", user);
     res.redirect('/home');

 });
 
router.get("/home", function (req, res) {
    const user = req.session.user;
    if (!user) {
       return res.redirect('/login');
    }
    
    res.render('home', { user });
    
});

router.get('/admin/users', async (req, res) => {
    const user = req.session.user;

    if (!user || user.role !== 'admin') {
        return res.status(403).send("Access Denied. You don't have the rights.");
    }

    const users = await User.find();
    res.render('userProfile', { user, users });
});

router.post('/admin/users/:userId/role', async (req, res) => {
    const user = req.session.user;

    if (!user || user.role !== 'admin') {
        return res.status(403).send("Access Denied. You don't have the rights.");
    }

    const { userId } = req.params;
    const { role } = req.body;

    await User.findByIdAndUpdate(userId, { role });
    res.redirect('/admin/users');
});

router.put('/user/:userId', grantAccess('updateOwn', 'profile'), async (req, res) => {
    const { userId } = req.params;
    const { username, email } = req.body;
    const updatedUser = await User.findByIdAndUpdate(userId, { username, email }, { new: true });
    res.redirect('/profile');
});

router.delete('/admin/users/:userId/delete', grantAccess('deleteAny', 'profile'), async (req, res) => {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.redirect('/admin/users');
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send("Disconnection Failed");
        }
        res.redirect('/login');
    });
});

app.use('/', router);

var port = process.env.PORT || 9000;

app.listen(port, function () {
    console.log("Server Has Started! port: ", port);
});
