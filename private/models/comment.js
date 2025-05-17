const DB = require("mongoose");
const commentStructure = new DB.Schema({
   ogPost: { type: DB.Schema.Types.ObjectId, ref: 'Post' }, //Refetens till post användarens id
   user: { type: DB.Schema.Types.ObjectId, ref: 'User' }, //Referens till användarens id
   content: { type: String, required: true },
   date: { type: Date, default: Date.now }
});

const Comment = DB.model('Comment', commentStructure);
module.exports = Comment; 
