import moment from "moment";
import constants from "../constants.js";
const { dateFormat } = constants;

function validate_email(email) {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export default function reservation_data_validator(req, res, next) {
  const { date, seatNumber, numberOfSeats, duration, email } = req.body;

  const enddate = moment(date).add(duration, 'minutes').format(dateFormat);
  const now = moment(new Date(Date.now()).toISOString()).format(dateFormat);
  const incoming_date = moment(date).format(dateFormat);
  const isDateValid = incoming_date > now;

  if (!date || !seatNumber || !numberOfSeats || !duration || !email) return res.status(400).json({ message: "Niewystarczające dane" })

  if (!isDateValid)
    return res.status(400).json({ message: "Nieprawidłowa data" });

  if (!validate_email(email)) return res.status(400).json({ message: "Nieprawidłowy email" })

  if (isNaN(duration) || duration < 1)
    return res.status(400).json({ message: "Nieprawidłowy czas trwania " })

  if (isNaN(seatNumber) || seatNumber < 1)
    return res.status(400).json({ message: "Nieprawidłowy stolik" });

  if (isNaN(numberOfSeats) || numberOfSeats < 1)
    return res.status(400).json({ message: "Nieprawidłowa ilość miejsc" });
  req.body.enddate = enddate;

  next();
}
