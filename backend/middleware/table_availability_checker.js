import moment from "moment"
import { get_overlapping_reservations_in_range, get_table_info } from "../services/mongo_communication.js"
import constants from "../constants.js"
const { dateFormat } = constants

export default async function is_table_available(req, res, next) {
    const { seatNumber, numberOfSeats, date, duration } = req.body
    const table_info = await get_table_info(seatNumber)
    if (!table_info) return res.status(400).json({ message: "Wskazano nieprawidłowy stolik" })

    if (table_info.minNumberOfSeats > numberOfSeats || table_info.maxNumberOfSeats < numberOfSeats)
        return res.status(400).json({ message: "Wprowadzono nieprawidłową ilość miejsc" })

    const dateFrom = moment(date).format(dateFormat)
    const dateTo = moment(date).add(duration, 'minutes').format(dateFormat)

    console.log(`${dateFrom} >> ${dateTo}`)

    const overlapping_reservations = await get_overlapping_reservations_in_range(seatNumber, dateFrom, dateTo);
    console.log(overlapping_reservations)
    if (overlapping_reservations.length > 0) return res.status(400).json({ message: "Ten stolik jest już zarezerwowany w tym okresie czasu" })


    next()
};


