import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();
const app = express();
connectDB();

app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));