import constants from "../constants.js";
const { dateFormat } = constants;

const verify_cancellation_request = (dateFrom) => {

    const now = moment(new Date(Date.now()).add(2, 'hours').toISOString()).format(dateFormat);
    const incoming_date = moment(dateFrom).format(dateFormat);

    return now < incoming_date

}

export default verify_cancellation_request