require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

const app = express();

// --- Database -------------------------------------------------------------
connectDB();

// --- Middleware -----------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Locally uploaded images (used when Cloudinary is not configured)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API routes -----------------------------------------------------------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/upload', require('./routes/upload'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// --- Frontend -------------------------------------------------------------
// In development the React app runs on Vite (port 5173) and proxies /api here.
// Once you run `npm run build`, the compiled files appear in client/dist and
// this server hosts them, so everything is on one origin in production.
const clientDist = path.join(__dirname, 'client', 'dist');

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.get(/^(?!\/api|\/uploads).*/, (req, res) => {
    res.status(200).send(
      `<pre style="font-family:system-ui;padding:40px;line-height:1.6">
The API is running, but the React app has not been built yet.

  Development:  cd client && npm install && npm run dev   ->  http://localhost:5173
  Production:   cd client && npm run build                ->  reload this page
</pre>`
    );
  });
}

// --- Error handler --------------------------------------------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
