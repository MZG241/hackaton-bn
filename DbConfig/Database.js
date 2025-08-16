import mongoose, { mongo } from "mongoose";


export const DbConnection = async()=>{
try {
await mongoose.connect(`${process.env.MONGO_URL}`)
console.log("Connected to DB Successfully")
} catch (error) {
console.log("Error connecting to DB: ",error)  
}
}