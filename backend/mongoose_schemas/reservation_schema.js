import mongoose from 'mongoose';
const { Schema } = mongoose;

const reservationSchema = new Schema({
    date: String, /* ISO 8061 */
    duration: Number,
    seatNumber: Number,
    fullName: String,
    phone: String,
    email: String,
    numberOfSeats: Number,
});