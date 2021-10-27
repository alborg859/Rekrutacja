import mongoose from 'mongoose';
const { Schema } = mongoose;

const tableSchema = new Schema({
    number: { type: Number, required: true },
    minNumberOfSeats: { type: Number, required: true },
    maxNumberOfSeats: { type: Number, required: true },
});

export default tableSchema