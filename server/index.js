const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Models
const Image = mongoose.model('Image', new mongoose.Schema({
  url: String,
  userId: String,
  username: String,
}));
const User = mongoose.model('User', new mongoose.Schema({
  githubId: String,
  username: String,
  displayName: String,
  avatar: String,
}));

// Passport GitHub Strategy
passport.use(new GitHubStrategy({
  clientID: process.env.GITHUB_CLIENT_ID,
  clientSecret: process.env.GITHUB_CLIENT_SECRET,
  callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/auth/github/callback',
}, async (accessToken, refreshToken, profile, done) => {
  let user = await User.findOne({ githubId: profile.id });
  if (!user) {
    user = await User.create({
      githubId: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      avatar: profile.photos[0]?.value,
    });
  }
  return done(null, user);
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

// Auth Routes
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback', passport.authenticate('github', {
  failureRedirect: 'http://localhost:3000',
}), (req, res) => {
  res.redirect('http://localhost:3000');
});
app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('http://localhost:3000');
  });
});
app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Image API
app.get('/api/images', async (req, res) => {
  const { userId } = req.query;
  let images;
  if (userId) {
    images = await Image.find({ userId });
  } else {
    images = await Image.find();
  }
  res.json(images);
});
app.post('/api/images', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  const { url } = req.body;
  const image = await Image.create({ url, userId: req.user.id, username: req.user.username });
  res.json(image);
});
app.delete('/api/images/:id', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  const image = await Image.findById(req.params.id);
  if (!image) return res.status(404).json({ error: 'Not found' });
  if (image.userId !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  await image.deleteOne();
  res.json({ success: true });
});

// MongoDB Connection & Server Start
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pinterest-clone')
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error(err)); 