import express from "express";

var router = express.Router();

import { send_email } from "../services/nodemailer_service.js";

import {
  create_reservation_document,
  get_reservations_by_day,
  set_reservation_verification_number,
  get_reservation_by_ID,
  delete_reservation
} from "../services/mongo_communication.js";
import reservationDataValidator from "../middleware/reservation_data_validator.js";
import { generate_6_digit_number } from "../services/helper.js";
import { verify_cancellation_request } from '../validators/deletion_request_validator.js'

router.post("/", reservationDataValidator, async (req, res) => {
  const { seatNumber, email } = req.body;
  console.log(req.body);

  try {
    const mongo_result = await create_reservation_document(req.body);
    const reservation_id = mongo_result._id.toString();

    //TODO:availability check

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
  //return reservations from given date
  const { date } = req.query;
  const day = date.split("T")[0];

  try {
    const mongo_result = await get_reservations_by_day(day);
    return res.status(200).json({ bookings: mongo_result });
  } catch (e) {
    return res.status(500).json({ error: e });
  }
});

router.put("/:id", async (req, res) => {
  //requesting a cancellation of the reservation
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Brak ID rezerwacji" });

  try {
    //TODO: check czy są 2 godziny do rozpoczęcia
    const verification_number = generate_6_digit_number();
    const mongo_result = get_reservation_by_ID(id)
    console.log(mongo_result);

    if (!mongo_result)
      return res
        .status(400)
        .json({ message: "Rezerwacja o takim numerze nie istnieje" });

    const is2HoursBefore = verify_cancellation_request(mongo_result.date)
    if (!is2HoursBefore) return res.status(400).json({ message: 'Rezerwacje można anulować co najwyżej 2 godziny przed jej rozpoczęciem' })

    const update_result = await set_reservation_verification_number(
      id,
      verification_number
    );
    console.log("UPDATE RESULT")
    console.log(update_result)

    const email_txt = `Twój kod weryfikacyjny to: ${verification_number}`
    nodemailer_result.send_email(mongo_result.email, "Prośba o anulowanie rezerwacji", email_txt)

    return res.status(200).json({
      message: `Pomyślnie złożono prośbę o anulowanie rezerwacji nr: ${id}, kod weryfikacyjny to: ${verification_number}`
    });
  } catch (e) {
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
