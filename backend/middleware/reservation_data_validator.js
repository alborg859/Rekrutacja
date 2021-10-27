import moment from "moment";
import constants from "../constants.js";
const { dateFormat } = constants;

export default function reservationDataValidator(req, res, next) {
  const { date, seatNumber, numberOfSeats } = req.body;

  const now = moment(new Date(Date.now()).toISOString()).format(dateFormat);
  const incoming_date = moment(date).format(dateFormat);
  console.log(now, incoming_date);
  const isDateValid = incoming_date > now;

  if (!isDateValid)
    return res.status(400).json({ message: "Nieprawidłowa data" });

  if (seatNumber < 1)
    return res.status(400).json({ message: "Nieprawidłowy stolik" });

  if (numberOfSeats < 1)
    return res.status(400).json({ message: "Nieprawidłowa ilość miejsc" });

  next();
}
