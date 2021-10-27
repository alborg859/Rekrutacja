import express from "express"
var router = express.Router();
import { create_reservation_document, get_reservations_by_day } from '../services/mongo_communication.js'

router.post('/', async (req, res) => {
    //creating a reservation
    console.log(req.body)
    try {
        //checking if the table is free

        const mongo_result = await create_reservation_document(req.body)
        console.log(mongo_result)
        return res.send(200).json({ message: `Pomyślnie zarezerwowano stolik` })
    } catch (e) {
        return res.status(500).json({ error: e })
    }
})

router.get('/', async (req, res) => {
    //return reservations from today
    const { date } = req.query
    const day = date.split('T')[0]

    try {
        const mongo_result = await get_reservations_by_day(day)
        return res.status(200).json({ bookings: mongo_result })
    }
    catch (e) {
        return res.status(500).json({ error: e })
    }

})

router.put('/:id', async (req, res) => {
    //requesting a cancellation of the reservation
    const id = req.params.id
})

router.delete('/:id', async (req, res) => {
    //confirming the deletion?
    const id = req.params.id

})

export default router