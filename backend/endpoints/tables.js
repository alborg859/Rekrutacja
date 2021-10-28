import express from "express"
var router = express.Router()


router.get('/', async (req, res) => {
    const { status, min_seats, start_date, duration } = req.query
    return res.sendStatus(200)
})

export default router