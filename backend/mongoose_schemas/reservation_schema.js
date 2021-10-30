import mongoose from "mongoose";
const { Schema } = mongoose;

const reservationSchema = new Schema({
  date: { type: String, required: true } /* ISO 8061 */,
  enddate: String,
  duration: { type: Number, required: true },
  seatNumber: { type: Number, required: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  numberOfSeats: { type: Number, required: true },
  verificationCode: String,
  status: String
});

export default reservationSchema;
