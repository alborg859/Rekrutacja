import mongoose from 'mongoose';
const { Schema } = mongoose;

const tableSchema = new Schema({
    number: Number,
    minNumberOfSeats: Number,
    maxNumberOfSeats: Number,
});