import express from "express"
import moment from "moment"
import { get_overlapping_reservations_in_range, get_tables_by_min_seats } from "../services/mongo_communication.js"
var router = express.Router()
import constants from '../constants.js'
import table_query_validator from "../middleware/table_query_validator.js"
const { dateFormat } = constants

router.get('/', table_query_validator, async (req, res) => {
    const { status, min_seats, start_date, duration } = req.query

    const tables_by_seats = await get_tables_by_min_seats(min_seats);
    let table_numbers = [];
    tables_by_seats.forEach(table => {
        table_numbers.push(table.number)
    });

    const dateFrom = moment(start_date).format(dateFormat)
    const dateTo = moment(start_date).add(duration, "minutes").format(dateFormat)

    const overlapping_reservations = await get_overlapping_reservations_in_range(table_numbers, dateFrom, dateTo)

    let unavailable_tables = []
    overlapping_reservations.forEach(reservation => {
        const seatNumber = reservation.seatNumber
        if (!unavailable_tables.includes(seatNumber)) unavailable_tables.push(seatNumber)
    });

    const available_tables = tables_by_seats.filter((t) => {
        t.status = 'free'
        return !unavailable_tables.includes(t.number)
    })

    return res.status(200).json(available_tables)
})

export default router