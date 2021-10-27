import mongoose from 'mongoose';

import reservation_schema from '../mongoose_schemas/reservation_schema.js'
import table_schema from '../mongoose_schemas/table_schema.js'
import { readFile } from 'fs/promises';


const reservation_model = mongoose.model('Reservation', reservation_schema)
const table_model = mongoose.model('Table', table_schema)

mongoose.connect('mongodb://localhost:27017/SOLVRO_REZERWACJE').then(() => console.log('Mongoose ready to use!'))

export const create_reservation_document = async (data) => {
    const new_reservation = new reservation_model(data)
    const result = await new_reservation.save()
    return result
}

export const get_reservations_by_day = async (date) => {
    const result = await reservation_model.find({ date }).lean()
    return result
}

export const init_tables = async () => {
    const current_tables = await table_model.find({}).lean()
    console.log(current_tables)
    const seats = JSON.parse(await readFile(new URL('../seats.json', import.meta.url)));
    console.log(seats)

}

export default {
    create_reservation_document,
    get_reservations_by_day,
    init_tables
}
