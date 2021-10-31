import constants from "../constants.js";
import moment from 'moment'
const { dateFormat } = constants;

export const verify_cancellation_request = (dateFrom) => {
    const now = moment(new Date(Date.now()).toISOString()).add(2, 'hours').format(dateFormat);
    const incoming_date = moment(dateFrom).format(dateFormat);
    return now < incoming_date

}


