import express from "express"
import { get_overlapping_reservations_in_range, get_tables_by_min_seats } from "../services/mongo_communication"
var router = express.Router()


router.get('/', async (req, res) => {
    const { status, min_seats, start_date, duration } = req.query
    const tables_by_seats = await get_tables_by_min_seats(min_seats);
    //get overlapping reservations
    // check if the status is set to free
    //return available tables

    //change get overlapping... to accept arrays as seatnumbers

    const overlapping_reservations = await get_overlapping_reservations_in_range()

    return res.sendStatus(200)
})

export default router