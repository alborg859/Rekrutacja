import express from 'express'
const app = express()
const port = 3000
app.use(express.json())

import { init_tables } from './services/mongo_communication.js'

import reservations from './endpoints/reservations.js'
import tables from './endpoints/tables.js'


app.use('/reservations', reservations)
app.use('/tables', tables)

app.listen(port, () => {
    console.log(`Rezerwacje dla restauracji Solvro - LISTENING ON PORT ${port}`)
    init_tables()
})