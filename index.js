const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const Razorpay = require('razorpay');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const SECRET_KEY = 'your-secret-key';

// MongoDB connection
mongoose.connect('mongodb+srv://ridhima4826:95N5RGS2s5hfdmZu@uplift.cackl.mongodb.net/Attachment', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected successfully to MongoDB");
}).catch((error) => {
  console.error("MongoDB connection error:", error);
});

// Define MongoDB schemas
const UserSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: String,
  status: String,
  availability: String,
  price: Number
});

const ArticleSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  image: String,
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: Number,
    comment: String
  }],
  averageRating: Number
});

const AppointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: String,
  time: String,
  price: Number,
  status: String
});

const SessionSchema = new mongoose.Schema({
  className: String,
  date: String,
  time: String,
  venue: String,
  description: String,
  image: String,
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const QuestionSchema = new mongoose.Schema({
  question: String
});

// Create models
const User = mongoose.model('User', UserSchema);
const Article = mongoose.model('Article', ArticleSchema);
const Appointment = mongoose.model('Appointment', AppointmentSchema);
const Session = mongoose.model('Session', SessionSchema);
const Question = mongoose.model('Question', QuestionSchema);

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Razorpay configuration
const razorpay = new Razorpay({
  key_id: 'rzp_test_jnFll4vBKCwPho',
  key_secret: 'rj1C0dsKibu56PiiOhUqdGFp'
});

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ridhima4826.be22@chitkara.edu.in',
    pass: 'sfnl vaar qlgu awmw'
  }
});

// Routes

// POST /signup
app.post('/signup', async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      status: role === 'doctor' ? 'pending' : 'approved',
      availability: 'unavailable',
      price: 0
    });

    await newUser.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// POST /login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user._id, username: user.username, email: user.email, role: user.role, status: user.status }, SECRET_KEY);
      res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role, status: user.status } });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// POST /create-order
app.post('/create-order', authenticateToken, async (req, res) => {
  try {
    const options = {
      amount: req.body.amount,
      currency: req.body.currency,
      receipt: req.body.receipt,
      notes: req.body.notes
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// GET /users
app.get('/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.sendStatus(403);
  }
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// POST /articles
app.post('/articles', authenticateToken, upload.single('image'), async (req, res) => {
  const { title, content } = req.body;
  try {
    const newArticle = new Article({
      title,
      content,
      author: req.user.id,
      image: req.file ? /uploads/${req.file.filename} : null,
      reviews: [],
      averageRating: 0
    });
    await newArticle.save();
    res.status(201).json(newArticle);
  } catch (error) {
    res.status(500).json({ message: 'Error creating article', error: error.message });
  }
});

// GET /articles
app.get('/articles', async (req, res) => {
  try {
    const articles = await Article.find().populate('author', 'username email');
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles', error: error.message });
  }
});

// GET /articles/:username
app.get('/articles/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const articles = await Article.find({ author: user._id }).populate('author', 'username email');
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user articles', error: error.message });
  }
});

// PUT /articles/:id
app.put('/articles/:id', authenticateToken, upload.single('image'), async (req, res) => {
  const { title, content } = req.body;
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    if (article.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this article' });
    }
    article.title = title;
    article.content = content;
    if (req.file) {
      article.image = /uploads/${req.file.filename};
    }
    await article.save();
    res.json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error updating article', error: error.message });
  }
});

// DELETE /articles/:id
app.delete('/articles/:id', authenticateToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    if (article.author.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this article' });
    }
    await Article.findByIdAndDelete(req.params.id);
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting article', error: error.message });
  }
});

// POST /articles/:id/reviews
app.post('/articles/:id/reviews', authenticateToken, async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    const newReview = {
      user: req.user.id,
      rating: parseInt(rating),
      comment
    };
    article.reviews.push(newReview);
    article.averageRating = article.reviews.reduce((sum, review) => sum + review.rating, 0) / article.reviews.length;
    await article.save();
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: 'Error adding review', error: error.message });
  }
});

// GET /doctors
app.get('/doctors', async (req, res) => {
  try {
    const doctors = await User.find({ role: 'doctor', status: 'approved' });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching doctors', error: error.message });
  }
});

// PUT /doctors/:id
app.put('/doctors/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.sendStatus(403);
  }
  const { status, availability, price } = req.body;
  try {
    console.log('Updating doctor:', req.params.id);
    console.log('Update data:', { status, availability, price });

    const doctor = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'doctor' },
      { status, availability, price },
      { new: true }
    );

    if (!doctor) {
      console.log('Doctor not found:', req.params.id);
      return res.status(404).json({ message: 'Doctor not found' });
    }

    console.log('Doctor updated successfully:', doctor);
    res.json(doctor);
  } catch (error) {
    console.error('Error updating doctor:', error);
    res.status(500).json({ message: 'Error updating doctor', error: error.message });
  }
});

// POST /bookAppointment
app.post('/bookAppointment', authenticateToken, async (req, res) => {
  const { doctorId, date, time } = req.body;
  try {
    const isSlotBooked = await Appointment.findOne({ doctor: doctorId, date, time });
    if (isSlotBooked) {
      return res.status(400).json({ message: 'This slot is already booked. Please choose another time.' });
    }

    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    if (doctor.availability !== 'available') {
      return res.status(400).json({ message: 'Doctor is not available' });
    }

    const newAppointment = new Appointment({
      user: req.user.id,
      doctor: doctorId,
      date,
      time,
      price: doctor.price,
      status: 'booked'
    });
    await newAppointment.save();

    const mailOptions = {
      from: 'ridhima4826.be22@chitkara.edu.in',
      to: req.user.email,
      subject: 'Appointment Confirmation',
      text: Thank you for booking an appointment with Dr. ${doctor.username}. Your appointment is scheduled for ${date} at ${time}.
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending confirmation email:', error);
      } else {
        console.log('Confirmation email sent:', info.response);
      }
    });

    res.status(201).json(newAppointment);
  } catch (error) {
    res.status(500).json({ message: 'Error booking appointment', error: error.message });
  }
});

// GET /appointments
app.get('/appointments', authenticateToken, async (req, res) => {
  try {
    const appointments = await Appointment.find({ user: req.user.id }).populate('doctor', 'username email');
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching appointments', error: error.message });
  }
});

// PUT /appointments/:id
app.put('/appointments/:id', authenticateToken, async (req, res) => {
  const { date, time } = req.body;
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, user: req.user.id });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointmentDate = new Date(appointment.date);
    const currentDate = new Date();
    const twoDaysFromNow = new Date(currentDate.setDate(currentDate.getDate() + 2));

    if (appointmentDate <= twoDaysFromNow) {
      return res.status(400).json({ message: 'Cannot update appointment within 2 days of the scheduled date' });
    }

    appointment.date = date;
    appointment.time = time;
    await appointment.save();
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Error updating appointment', error: error.message });
  }
});

// DELETE /appointments/:id
app.delete('/appointments/:id', authenticateToken, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, user: req.user.id });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointmentDate = new Date(appointment.date);
    const currentDate = new Date();
    const twoDaysFromNow = new Date(currentDate.setDate(currentDate.getDate() + 2));

    if (appointmentDate < twoDaysFromNow) {
      return res.status(400).json({ message: 'Cannot cancel appointment within 2 days of the scheduled date' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling appointment', error: error.message });
  }
});

// Middleware for authenticating approved doctors
async function authenticateApprovedDoctor(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role !== 'doctor' || user.status !== 'approved') {
      return res.status(403).json({ message: 'Only approved doctors can perform this action' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// POST /sessions
app.post('/sessions', authenticateApprovedDoctor, upload.single('image'), async (req, res) => {
  const { className, date, time, venue, description } = req.body;
  try {
    const newSession = new Session({
      className,
      date,
      time,
      venue,
      description,
      image: req.file ? /uploads/${req.file.filename} : null,
      doctor: req.user.id
    });
    await newSession.save();
    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ message: 'Error creating session', error: error.message });
  }
});

// GET /sessions
app.get('/sessions', async (req, res) => {
  try {
    const currentDate = new Date();
    const sessions = await Session.find({ date: { $gte: currentDate } }).populate('doctor', 'username email');
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sessions', error: error.message });
  }
});

// PUT /sessions/:id
app.put('/sessions/:id', authenticateApprovedDoctor, upload.single('image'), async (req, res) => {
  const { className, date, time, venue, description } = req.body;
  try {
    const session = await Session.findOne({ _id: req.params.id, doctor: req.user.id });
    if (!session) {
      return res.status(404).json({ message: 'Session not found or you are not authorized to update it' });
    }

    const sessionDate = new Date(session.date);
    const currentDate = new Date();
    const twoDaysFromNow = new Date(currentDate.setDate(currentDate.getDate() + 2));

    if (sessionDate < twoDaysFromNow) {
      return res.status(400).json({ message: 'Cannot update session within 2 days of the scheduled date' });
    }

    session.className = className;
    session.date = date;
    session.time = time;
    session.venue = venue;
    session.description = description;
    if (req.file) {
      session.image = /uploads/${req.file.filename};
    }
    await session.save();
    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Error updating session', error: error.message });
  }
});

// DELETE /sessions/:id
app.delete('/sessions/:id', authenticateApprovedDoctor, async (req, res) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, doctor: req.user.id });
    if (!session) {
      return res.status(404).json({ message: 'Session not found or you are not authorized to delete it' });
    }
    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting session', error: error.message });
  }
});

// POST /chatbot
app.post('/chatbot', async (req, res) => {
  const { query } = req.body;

  if (!query || query.trim() === '') {
    return res.status(400).json({ message: 'Query cannot be empty' });
  }

  try {
    const questions = await Question.find({
      question: { $regex: query, $options: 'i' }
    });

    if (questions.length > 0) {
      return res.json({ questions: questions.map(q => q.question) });
    } else {
      return res.json({ message: 'No matching questions found.' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
});

// GET /doctor-profile
app.get('/doctor-profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  try {
    const doctor = await User.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json({ email: doctor.email, price: doctor.price, availability: doctor.availability });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /doctor-profile
app.put('/doctor-profile', authenticateToken, async (req, res) => {
  if (req.user.role !== 'doctor') {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  const { email, price, availability } = req.body;

  try {
    const doctor = await User.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.email = email;
    doctor.price = price;
    doctor.availability = availability;

    await doctor.save();
    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /check-availability
app.get('/check-availability', authenticateToken, async (req, res) => {
  const { doctorId, date, time } = req.query;
  console.log(Checking availability for doctorId: ${doctorId}, date: ${date}, time: ${time});

  try {
    const isSlotBooked = await Appointment.findOne({ doctor: doctorId, date, time });
    console.log(Slot availability result: ${!isSlotBooked});
    res.json({ available: !isSlotBooked });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ message: 'An error occurred while checking availability' });
  }
});

app.listen(PORT, () => {
  console.log(Server is running on port ${PORT});
});