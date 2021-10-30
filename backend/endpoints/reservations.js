import express from "express";
import { compose } from 'compose-middleware'
var router = express.Router();
import constants from '../constants.js'
import { send_email } from "../services/nodemailer_service.js";

const { dateFormat } = constants

import {
  create_reservation_document,
  get_reservations_by_day,
  set_reservation_verification_number,
  get_reservation_by_ID,
  delete_reservation,
  get_overlapping_reservations_in_range
} from "../services/mongo_communication.js";
import reservation_data_validator from "../middleware/reservation_data_validator.js";
import { generate_6_digit_number } from "../services/helper.js";
import { verify_cancellation_request } from '../validators/deletion_request_validator.js'
import is_table_available from "../middleware/table_availability_checker.js";
import moment from "moment";


router.post('/test1', async (req, res) => {
  const { dateFrom, dateTo } = req.body
  const mongo_res = await get_overlapping_reservations_in_range(1, dateFrom, dateTo)
  return res.status(200).json({ mongo_res })
})

router.post("/", compose(reservation_data_validator, is_table_available), async (req, res) => {
  const { seatNumber, email } = req.body;
  console.log(req.body);

  try {
    const mongo_result = await create_reservation_document(req.body);
    const reservation_id = mongo_result._id.toString();


    const email_txt = `Pomyślnie dokonano rezerwacji stolika nr ${seatNumber}.\n Numer referencyjny rezerwacji to: ${reservation_id}. Do zobaczenia!`;
    const nodemailer_result = await send_email(
      email,
      `Rezerwacja stolika`,
      email_txt
    );
    console.log(nodemailer_result);



    return res
      .status(200)
      .json({ message: `Pomyślnie złożono rezerwacje nr: ${reservation_id}` });
  } catch (e) {
    return res.status(500).json({ error: e });
  }
});

router.get("/", async (req, res) => {
  //return reservations from given ISO date
  const { date } = req.query;
  if (!date) return res.status(404).json({ message: 'Nie wprowadzono daty' })


  const dateFrom = moment(date).set({ 'hour': 0, "minute": 0, "second": 0 }).format(dateFormat);
  const dateTo = moment(date).set({ 'hour': 0, "minute": 0, "second": 0 }).add(1, 'day').format(dateFormat);
  console.log(dateFrom, dateTo)

  try {
    const mongo_result = await get_reservations_by_day(dateFrom, dateTo);
    return res.status(200).json({ bookings: mongo_result });
  } catch (e) {
    console.log(e)
    return res.status(500).json({ error: e });
  }
});

router.put("/:id", async (req, res) => {
  //requesting a cancellation of the reservation
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Brak ID rezerwacji" });

  try {
    const verification_number = generate_6_digit_number();
    const mongo_result = await get_reservation_by_ID(id)
    console.log(mongo_result);

    if (!mongo_result)
      return res
        .status(400)
        .json({ message: "Rezerwacja o takim numerze nie istnieje" });
    console.log(mongo_result)
    const is2HoursBefore = verify_cancellation_request(mongo_result.date)
    if (!is2HoursBefore) return res.status(400).json({ message: 'Rezerwacje można anulować co najwyżej 2 godziny przed jej rozpoczęciem' })

    const update_result = await set_reservation_verification_number(
      id,
      verification_number
    );
    console.log("UPDATE RESULT")
    console.log(update_result)

    const email_txt = `Twój kod weryfikacyjny to: ${verification_number}`
    send_email(mongo_result.email, "Prośba o anulowanie rezerwacji", email_txt)

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
  if (!id) return res.status(400).json({ message: "Brak ID rezerwacji" });
  if (!verificationCode)
    return res
      .status(400)
      .json({ message: "Brak kodu weryfikacyjnego dla anulowania rezerwacji" });

  const mongo_result = await get_reservation_by_ID(id);

  if (!mongo_result)
    return res
      .status(400)
      .json({ message: "Rezerwacja o takim numerze nie isntieje" });

  if (mongo_result.status != "requested cancellation")
    return res.status(400).json({
      message: `Nie zgłoszono prośby o anulowanie rezerwacji nr ${id}`
    });

  const is2HoursBefore = verify_cancellation_request(mongo_result.date)
  if (!is2HoursBefore) return res.status(400).json({ message: 'Rezerwacje można anulować co najwyżej 2 godziny przed jej rozpoczęciem' })


  if (mongo_result.verificationCode != verificationCode)
    return res
      .status(400)
      .json({ message: "Kod weryfikacyjny jest nieprawidłowy" });

  const deletion_result = await delete_reservation(id);
  console.log(deletion_result);

  return res
    .status(200)
    .json({ message: `Pomyślnie anulowano rezerwacje o nr: ${id}` });
});

export default router;
