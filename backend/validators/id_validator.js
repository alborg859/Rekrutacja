import mongoose from 'mongoose'
const { Types: { ObjectId } } = mongoose;
export const validate_object_id = (id) => ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;
export default validate_object_id