const express = require("express");
const server = express();
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const cookie = require("cookie-parser");
const multer = require("multer"); //för profilbild
const DB = require("mongoose"); //för databs 
const bcrypt = require('bcryptjs'); //för att crypta lösenord

const upload = multer({ dest: "public/uploads" });


const User = require(__dirname + "/models/user.js");
const Post = require(__dirname + "/models/post.js");
const Comment = require(__dirname + "/models/comment.js");

let userId = 0;
let postId = 21;

server.use(cookie());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(express.json()); 
server.use(express.static(path.join(__dirname, "../public")));
server.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));


server.listen(3030, function () {
   console.log("The server has started");
});


server.get("/init", function(req,res){
   res.sendFile(path.join(__dirname, "../public", "login.html"));
})

//kollar ifall användaren finns i mongo/login (färdig med mongo)
server.post("/login", async function (req, res) {
   var usernameInput = req.body.usernameInput;
   var passwordInput = req.body.passwordInput;

   try {
      const user = await User.findOne({ username: usernameInput });

      if(user){
         const isPasswordCorrect = await bcrypt.compare(passwordInput, user.password); //jämför inputet med användarens lösenord
         if (isPasswordCorrect) { //ifall det matchar
            res.cookie("userId", user._id.toString()); //sparar id i cookies
            res.sendFile(path.join(__dirname, "../public", "index.html"));
         } else {
            res.send("Wrong password");
         }
      }else{
         res.send("wrong username")
      }
      

   } catch (err) {
      res.status(500).send("Error during login");
      console.error(err);
   }
});

//lägger till användare i mongo/sign in (färdig med mongo)
server.post('/signup', async (req, res) => {

   newUsername = req.body.newUsername;
   newPassword = req.body.newPassword;

   if (!newUsername || !newPassword) {
      return res.status(400).send("Username and password are required");
   }

   //kolla ifall användaren redan finns
   const existingUser = await User.findOne({ newUsername });
   if (existingUser) {
      return res.status(400).send("Username already taken");
   }
   else{
      // crypta lösenordet
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      //Skapar ny användare
      const newUser = new User({
         username: newUsername,
         password: hashedPassword,  //Sparar de crypta lösenordet
         profilePicture: ""
      });


      const savedUser = await newUser.save();
      console.log(savedUser)
      res.status(201).send("User created");
   }
});








//lägger till ny post i mongo (färdig med mongo)
server.post("/post", async function(req,res){
   postContent = req.body.textInput;

   const userId = req.cookies.userId;

   const post = new Post({
      user: userId,
      content: postContent
   });
   console.log(post)

   await post.save();
   res.redirect("/index.html"); 

   console.log("post added")
})


//lägger till kommentarar på inlägg (färdig med mongo)
server.post("/comment", async function (req, res) {
   const commentInput = req.body.commentInput;
   const ogPostId = req.body.postInfo;

   const userId = req.cookies.userId;

   const commenterUser = await User.findOne({ _id: userId });
   console.log(ogPostId)



   const newComment = new Comment({
      ogPost: ogPostId,
      user: commenterUser,
      content: commentInput
   })

   await newComment.save();

   const ogPost = await Post.findOne({_id: ogPostId})
   ogPost.commentsId.push(newComment._id)
   await ogPost.save()


   if (commenterUser) {
      res.redirect("/index.html"); 
   } else {
      res.status(404).send("Post not found.");
   }
});


//skickar alla posts till main (färdig med mongo)
server.get("/posts", async function (req, res) {
   try {
      const posts = await Post.find().populate({path: "commentsId", select: "-ogPost", populate: {path: "user", select: "username"}}); 
      //console.log(posts[0].commentsId[0])
      //console.log(posts)

      formatedPosts = []
      for (let i = 0; i < posts.length; i++) {
         const user = await User.findOne({ _id: posts[i].user });

         userObj = {
            postId: posts[i]._id,
            username: user.username,
            content: posts[i].content,
            date: posts[i].date,
            comments: posts[i].commentsId
         }
         formatedPosts.push(userObj)
      }

      //console.log(formatedPosts)
      res.json(formatedPosts);
   } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).send("Internal Server Error");
   }
});


//skickar vänner till main (färdigt med mongo)
server.get("/friends", async function(req, res){

   const userId = req.cookies.userId;
   const user = await User.findOne({ _id: userId });

   userFriends = []

   for (let i = 0; i < user.friends.length; i++) {
      const friendUser = await User.findOne({ _id: user.friends[i] });
      console.log(friendUser)

      let userObj = {
         username: friendUser.username,
         userId: friendUser.userId, 
         posts: friendUser.posts
      }
      userFriends.push(userObj)
   }

   if (user) {
      res.json(userFriends);
   } else {
      res.status(404).send("User not found.");
   }
})




//skickar profilbild till main (färdig med mongo)
server.get("/sendProfilePicture", async function (req, res) {

   const userId = req.cookies.userId;

   const user = await User.findOne({ _id: userId });

   if (user) {
      res.json({ profilePicture: user.profilePicture });
   } else {
      res.status(404).send("User not found.");
   }
})

//uppdatera profil/settings sidan (färdig med mongo)
server.post("/saveFile", upload.single("profilePicture"), async function (req, res, next) {
   let newUsername = req.body.newUsername
   let oldPassword = req.body.oldPassword
   let newPassword = req.body.newPassword
   let cookies = req.body.cookies


   if (req.file) {
      filePath = req.file.path;
   } else {
      filePath = null;
   }

   const userId = req.cookies.userId;

   const user = await User.findOne({ _id: userId });

   if (newUsername !== undefined) {
      user.username = newUsername
   }

   const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password)
   if (newPassword !== undefined || oldPassword !== undefined || isPasswordCorrect) {
      if (user.password === oldPassword) {
         user.password = newPassword;
      }
   }
   console.log(cookies)

   if (filePath !== null || filePath !== undefined) {
      user.profilePicture = filePath;
   }

   if(cookies === null){ //blir bara yes hela tiden?
      //req.cookies.username = null
      //req.cookies.userId = null
      //gör det när man loggar ut istället, för annars kommer väldigt många saker inte fungera
   }

   await user.save()
   res.json({ message: "Profile updated successfully", user });
});

