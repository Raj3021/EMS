import bcrypt from "bcrypt";

const hash = await bcrypt.hash("Admin@123", 12);
console.log(hash);
