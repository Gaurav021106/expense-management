const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const userModel = require('./models/user');
const Expense = require('./models/expense');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config();


// ======== Database ========
mongoose.connect('mongodb://localhost:27017/Expense-managementDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log('Connected to MongoDB successfully');


// ======== Express Session ========
app.use(session({
  secret: process.env.SESSION_SECRET || 'expensesecret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/Expense-managementDB' }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 },
}));


// ======== Middlewares ========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');


// ======== Nodemailer ========
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// ======== Session Auth Middleware ========
function ensureLoggedIn(req, res, next) {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  next();
}


// ======== Routes ========
app.get('/', (req, res) => res.render('./auth/login'));
app.get('/signup', (req, res) => res.render('./auth/signup'));
app.get('/home', ensureLoggedIn, (req, res) => res.render('./page/home'));

// ======== User Signup Route ========
app.post('/create', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const encodedPassword = await bcrypt.hash(password, salt);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const createdUser = await userModel.create({
      username,
      email,
      password: encodedPassword,
      emailVerified: false,
      verificationCode,
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Please verify your email for Expense Management',
      text: `Your verification code is: ${verificationCode}`,
    });

    res.status(201).json({ success: true, message: 'User created. Verification code sent to email.' });
  } catch (error) {
    if (error.code === 11000) {
      let field = Object.keys(error.keyPattern)[0];
      res.status(400).json({ success: false, message: `${field.charAt(0).toUpperCase() + field.slice(1)} already exists.` });
    } else {
      console.error('Error creating user:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
});


// ======== Email Verification Routes ========
app.post('/verify-email', async (req, res) => {
  try {
    const { email, verificationCode } = req.body;
    const user = await userModel.findOne({ email, verificationCode });
    if (!user) return res.status(400).json({ success: false, message: 'Invalid code or email' });
    user.emailVerified = true;
    user.verificationCode = undefined;
    await user.save();
    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


app.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });
    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.emailVerified) return res.status(400).json({ success: false, message: 'Email already verified' });

    const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = newVerificationCode;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your new verification code for Expense Management',
      text: `Your new verification code is: ${newVerificationCode}`,
    });

    res.json({ success: true, message: 'Verification code resent to your email' });
  } catch (error) {
    console.error('Error resending verification code:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});


// ======== Login Route (sets session) ========
app.post('/check', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await userModel.findOne({
      $or: [{ username }, { email: username }]
    });
    if (!user) return res.status(401).json({ success: false, message: 'No user found with that username or email.' });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ success: false, message: 'Incorrect password.' });
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email not verified. Please check your email and enter the verification code.',
        emailVerificationRequired: true
      });
    }
    req.session.userId = user._id; // <--- session set here
    res.json({ success: true, message: 'Login successful!' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});


// ======== Logout Route ========
app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true, message: 'Logged out' });
});


// ======== Expenses CRUD Routes (protected) ========
app.get('/expenses', ensureLoggedIn, async (req, res) => {
  try {
    const userId = req.session.userId;
    const expenses = await Expense.find({ userId }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching expenses' });
  }
});


app.post('/expenses', ensureLoggedIn, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { name, amount, date } = req.body;
    if (!name || !amount || amount <= 0 || !date) {
      return res.status(400).json({ error: 'Invalid data' });
    }
    const newExpense = await Expense.create({ name, amount, date, userId });
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(500).json({ error: 'Error adding expense' });
  }
});


app.delete('/expenses/:id', ensureLoggedIn, async (req, res) => {
  try {
    const userId = req.session.userId;
    const id = req.params.id;
    const deleted = await Expense.findOneAndDelete({ _id: id, userId });
    if (!deleted) return res.status(404).json({ error: 'Expense not found' });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting expense' });
  }
});


// ======== Start Server ========
app.listen(8000, () => {
  console.log('Server is running on port 8000');
});
