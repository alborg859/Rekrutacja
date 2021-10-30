import express from "express";
var router = express.Router();

import { compose } from 'compose-middleware'
import constants from '../constants.js'
import { send_email } from "../services/nodemailer_service.js";

const { dateFormat } = constants

import {
  create_reservation_document,
  get_reservations_by_day,
  set_reservation_verification_number,
  get_reservation_by_ID,
  delete_reservation
} from "../services/mongo_communication.js";

import reservation_data_validator from "../middleware/reservation_data_validator.js";
import { generate_6_digit_number } from "../services/helper.js";
import { verify_cancellation_request } from '../validators/deletion_request_validator.js'
import is_table_available from "../middleware/table_availability_checker.js";
import moment from "moment";
import {
  validate_object_id
} from "../validators/id_validator.js"

router.post("/", compose(reservation_data_validator, is_table_available), async (req, res) => {
  const { seatNumber, email } = req.body;

  try {
    const mongo_result = await create_reservation_document(req.body);
    const reservation_id = mongo_result._id.toString();

    const email_txt = `Pomyślnie dokonano rezerwacji stolika nr ${seatNumber}.\n Numer referencyjny rezerwacji to: ${reservation_id}. Do zobaczenia!`;
    const nodemailer_result = await send_email(
      email,
      `Rezerwacja stolika`,
      email_txt
    );

    return res
      .status(200)
      .json({ message: `Pomyślnie złożono rezerwacje nr: ${reservation_id}` });
  } catch (e) {
    return res.status(500).json({ error: e });
  }
});

router.get("/", async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(404).json({ message: 'Nie wprowadzono daty' })
  if (!moment(date, dateFormat, true).isValid()) return res.status(400).json({ message: 'Nieprawidłowy format daty' })


  const dateFrom = moment(date).set({ 'hour': 0, "minute": 0, "second": 0 }, true).format(dateFormat);
  const dateTo = moment(date).set({ 'hour': 0, "minute": 0, "second": 0 }).add(1, 'day').format(dateFormat);

  try {
    const reservations = await get_reservations_by_day(dateFrom, dateTo);
    return res.status(200).json({ bookings: reservations });
  } catch (e) {
    console.log(e)
    return res.status(500).json({ error: e });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Brak ID rezerwacji" });
  if (!validate_object_id(id)) return res.status(400).json({ message: 'Niepoprawne ID' })

  try {
    const verification_number = generate_6_digit_number();
    const reservation = await get_reservation_by_ID(id)
    console.log(reservation);

    if (!reservation)
      return res
        .status(400)
        .json({ message: "Rezerwacja o takim numerze nie istnieje" });
    console.log(reservation)
    const is2HoursBefore = verify_cancellation_request(reservation.date)
    if (!is2HoursBefore) return res.status(400).json({ message: 'Rezerwacje można anulować co najwyżej 2 godziny przed jej rozpoczęciem' })

    const update_result = await set_reservation_verification_number(
      id,
      verification_number
    );

    const email_txt = `Twój kod weryfikacyjny to: ${verification_number}`
    send_email(reservation.email, "Prośba o anulowanie rezerwacji", email_txt)

    return res.status(200).json({
      message: `Pomyślnie złożono prośbę o anulowanie rezerwacji nr: ${id}, kod weryfikacyjny to: ${verification_number}`
    });
  } catch (e) {
    console.log(e)
    return res.status(500).json({ error: e });
  }
});

router.delete("/:id", async (req, res) => {
  //confirming the deletion
  const { id } = req.params;
  const { verificationCode } = req.body;

  if (!id)
    return res.status(400).json({ message: "Brak ID rezerwacji" });
  if (!validate_object_id(id)) return res.status(400).json({ message: 'Niepoprawne ID' })

  if (!verificationCode)
    return res
      .status(400)
      .json({ message: "Brak kodu weryfikacyjnego dla anulowania rezerwacji" });

  const reservation = await get_reservation_by_ID(id);

  if (!reservation)
    return res
      .status(400)
      .json({ message: "Rezerwacja o takim numerze nie isntieje" });

  if (reservation.status != "requested cancellation")
    return res.status(400).json({
      message: `Nie zgłoszono prośby o anulowanie rezerwacji nr ${id}`
    });

  const is2HoursBefore = verify_cancellation_request(reservation.date)
  if (!is2HoursBefore) return res.status(400).json({ message: 'Rezerwacje można anulować co najwyżej 2 godziny przed jej rozpoczęciem' })

  if (reservation.verificationCode != verificationCode)
    return res
      .status(400)
      .json({ message: "Kod weryfikacyjny jest nieprawidłowy" });

  const deletion_result = await delete_reservation(id);

  const email_txt = `Pomyślnie anulowano rezerwacje o nr: ${id}`
  const nodemailer_result = await send_email(reservation.email, "Usunięcie rezerwacji", email_txt)

  return res
    .status(200)
    .json({ message: `Pomyślnie anulowano rezerwacje o nr: ${id}` });
});

export default router;
