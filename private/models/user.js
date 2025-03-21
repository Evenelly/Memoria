const DB = require("mongoose");
const userStructure = new DB.Schema({
   username: { type: String, required: true, unique: true },
   password: { type: String, required: true },
   profilePicture: { type: String },
   friends: [{ type: DB.Schema.Types.ObjectId, ref: 'User' }]
});

const User = DB.model("User", userStructure);
module.exports = User;