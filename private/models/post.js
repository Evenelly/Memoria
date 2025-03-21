const DB = require("mongoose");
const postStructure = new DB.Schema({
   user: { type: DB.Schema.Types.ObjectId, ref: 'User' },  // Referens till användarens ID
   content: { type: String, required: true },
   date: { type: Date, default: Date.now },
   commentsId: [{ type: DB.Schema.Types.ObjectId, ref: "Comment" }]
});

const Post = DB.model('Post', postStructure);
module.exports = Post;