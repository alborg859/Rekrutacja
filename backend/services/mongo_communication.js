import mongoose from "mongoose";

import reservation_schema from "../mongoose_schemas/reservation_schema.js";
import table_schema from "../mongoose_schemas/table_schema.js";
import { readFile } from "fs/promises";

const reservation_model = mongoose.model("Reservation", reservation_schema);
const table_model = mongoose.model("Table", table_schema);

mongoose
    .connect("mongodb://localhost:27017/SOLVRO_REZERWACJE")
    .then(() => console.log("Mongoose ready to use!"));

export const create_reservation_document = async data => {
    const new_reservation = new reservation_model(data);
    return await new_reservation.save();
};

//user can request as many times as they want, the verificationCode changes each time
export const set_reservation_verification_number = async (
    id,
    verification_number
) =>
    await reservation_model
        .updateOne(
            { _id: id },
            {
                verificationCode: `${verification_number}`,
                status: "requested cancellation"
            }
        )
        .lean();

export const get_reservation_by_ID = async id =>
    await reservation_model.findOne({ _id: id }).lean();

export const get_reservations_by_day = async date =>
    await reservation_model.find({ date }).lean();

export const delete_reservation = async id =>
    await reservation_model.deleteOne({ _id: id });

export const get_overlapping_reservations_in_range = async (
    seatNumber,
    dateFrom,
    dateTo
) => await reservation_model.find({}).lean();

export const init_tables = async () => {
    //make sure all the tables from given JSON file are indeed in the database
    const current_tables = await table_model
        .find({}, "number minNumberOfSeats maxNumberOfSeats -_id")
        .lean();
    console.log(current_tables);
    let current_seatNumbers = [];
    current_tables.forEach(e => current_seatNumbers.push(e.number));

    console.log(current_seatNumbers);

    const seats = JSON.parse(
        await readFile(new URL("../seats.json", import.meta.url))
    );

    var pending_tables = [];
    seats.tables.forEach(e => {
        const isPresent = current_seatNumbers.includes(e.number);
        if (!isPresent) pending_tables.push(e);
    });

    console.log("PendingTables");
    console.log(pending_tables);

    try {
        await table_model.insertMany(pending_tables);
    } catch (e) {
        throw e;
    }
};

export default {
    create_reservation_document,
    get_reservations_by_day,
    init_tables
};
