export default function table_query_validator(res, req, next) {

    const { status, min_seats, start_date, duration } = req.query

    if (!min_seats) return res.status(400).json({ message: "Nie ustalono minimalnych miejsc przy stole" })
    if (!start_date) return res.status(400).json({ message: "Nie ustalono minimalnych miejsc przy stole" })
    if (!duration) return res.status(400).json({ message: "Nie ustalono minimalnych miejsc przy stole" })

    next()
}