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

export const get_reservations_by_day = async (dateFrom, dateTo) =>
    await reservation_model.find({
        date: {
            $lt: dateTo,
            $gte: dateFrom
        }
    }).lean();

export const delete_reservation = async id =>
    await reservation_model.deleteOne({ _id: id });

export const get_overlapping_reservations_in_range = async (
    seatNumber,
    dateFrom,
    dateTo
) => {
    //we assume that date < enddate (always)
    const right_partially = {
        date: { $gte: dateFrom, $lte: dateTo },
        enddate: { $gte: dateTo }
    }

    const left_partially = {

        date: { $lte: dateFrom },
        enddate: { $gte: dateFrom, $lte: dateTo }

    }

    const mid = {
        date: { $gte: dateFrom },
        enddate: { $lte: dateTo }
    }

    const query = {
        $or: [
            left_partially, right_partially, mid
        ]
    }
    console.log(dateFrom)
    return await reservation_model.find(query).lean();
}

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

export const get_table_info = async (seatNumber) => table_model.findOne({ seatNumber }).lean()
export const get_tables_by_min_seats = async (minNumberOfSeats) => table_model.find({ minNumberOfSeats }).lean()

export default {
    create_reservation_document,
    get_reservations_by_day,
    init_tables
};
