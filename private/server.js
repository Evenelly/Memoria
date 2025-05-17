const express = require("express");
const server = express();
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const cookie = require("cookie-parser"); // För att hantera cookies
const multer = require("multer"); // För uppladdning av filer, t.ex. profilbild
const DB = require("mongoose"); // För att koppla upp mot MongoDB
const bcrypt = require('bcryptjs'); // För att hasha och jämföra lösenord
require('dotenv').config();


// Multer konfiguration: filer sparas temporärt i "public/uploads"
const upload = multer({ dest: "public/uploads" });

// Anslut till MongoDB med Mongoose
DB.connect(process.env.MONGODB_URI)
   .then(() => {
      console.log("MongoDB connected successfully");
      server.listen(3031, () => {
         console.log("The server has started");
      });
   })
   .catch(err => {
      console.error("MongoDB connection error:", err);
   });

// Modellfiler för användare, inlägg och kommentarer
const User = require(__dirname + "/models/user.js");
const Post = require(__dirname + "/models/post.js");
const Comment = require(__dirname + "/models/comment.js");

// Globala variabler (kan behöva hanteras bättre i framtiden)
let userId = 0;
let postId = 21;
let remember = true;

// Middleware för cookies, formulärdata och JSON
server.use(cookie());
server.use(bodyParser.urlencoded({ extended: true }));
server.use(express.json());

// Statisk filserver för publika filer och uppladdningar
server.use(express.static(path.join(__dirname, "../public")));
server.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// Startar servern på port 3030 (OBS: dubbel start, kan skapa problem)
server.listen(3030, function () {
   console.log("The server has started");
});

// GET /init - initierar sidan baserat på "remember"-variabeln
server.get("/init", function (req, res) {
   if (remember) {
      // Om remember är true, skicka index.html
      res.sendFile(path.join(__dirname, "../public", "index.html"));
   } else {
      // Annars radera cookie och skicka login.html
      res.cookie("userId", "", { expires: new Date(0) });
      res.sendFile(path.join(__dirname, "../public", "login.html"));
   }
});

// POST /login - hanterar inloggning, kontrollerar användare och lösenord
server.post("/login", async function (req, res) {
   var usernameInput = req.body.usernameInput;
   var passwordInput = req.body.passwordInput;

   try {
      // Hitta användare i databasen med angivet användarnamn
      const user = await User.findOne({ username: usernameInput });

      if (user) {
         // Jämför angivet lösenord med det hashade lösenordet i databasen
         const isPasswordCorrect = await bcrypt.compare(passwordInput, user.password);
         if (isPasswordCorrect) {
            // Om lösenordet stämmer, spara userId i cookie och skicka index.html
            res.cookie("userId", user._id.toString());
            res.sendFile(path.join(__dirname, "../public", "index.html"));
         } else {
            // Fel lösenord
            res.send("Wrong password");
         }
      } else {
         // Användarnamn hittades inte
         res.send("wrong username");
      }
   } catch (err) {
      // Hantera serverfel
      res.status(500).send("Error during login");
      console.error(err);
   }
});

// POST /signup - registrerar en ny användare
server.post('/signup', async (req, res) => {
   newUsername = req.body.newUsername;
   newPassword = req.body.newPassword;

   // Kontrollera att både användarnamn och lösenord skickas med
   if (!newUsername || !newPassword) {
      return res.status(400).send("Username and password are required");
   }

   // Kontrollera om användarnamnet redan finns i databasen
   const existingUser = await User.findOne({ newUsername });
   if (existingUser) {
      return res.status(400).send("Username already taken");
   } else {
      // Hasha lösenordet med bcrypt (10 salt-rundor)
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Skapa ny användare med hashat lösenord och tom profilbild
      const newUser = new User({
         username: newUsername,
         password: hashedPassword,
         profilePicture: ""
      });

      // Spara användaren i databasen
      const savedUser = await newUser.save();
      console.log(savedUser);
      res.status(201).send("User created");
   }
});

// POST /post - skapa ett nytt inlägg
server.post("/post", async function (req, res) {
   postContent = req.body.textInput;
   const userId = req.cookies.userId;

   // Skapa nytt Post-objekt med userId och innehåll
   const post = new Post({
      user: userId,
      content: postContent
   });
   console.log(post);

   // Spara inlägget i databasen
   await post.save();

   // Skicka tillbaka till index-sidan
   res.redirect("/index.html");
   console.log("post added");
});

// GET /post/:postId - visa en specifik post med kommentarer
server.get(`/post/:postId`, async function (req, res) {
   const postId = req.params.postId;

   // Hämta inlägget och användaren som skapat det
   const post = await Post.findOne({ _id: postId });
   const user = await User.findOne({ _id: post.user });

   let commentHtml; // Variabel för att lagra kommentarernas HTML

   // Loopa igenom alla kommentarer till inlägget
   for (let i = 0; i < post.commentsId.length; i++) {
      let comment = await Comment.findOne({ _id: post.commentsId[i] });
      const commentUser = await User.findOne({ _id: comment.user });

      // Lägg till varje kommentar som HTML-block
      commentHtml += `
      <div class="feed-post-container">
         <h4>${commentUser.username}</h4>
         <p>${comment.content}</p>
      </div>`;
   }

   // Skapa hela HTML-sidan för inlägget och kommentarerna
   let htmlContent = `
       <!DOCTYPE html>
       <html lang="en">
       <head>
           <meta charset="UTF-8">
           <meta name="viewport" content="width=device-width, initial-scale=1.0">
           <title>${user.username}'s Post</title>
       </head>
       <body>
           <main>
               <div class="flex-container">
                   <div class="comment-container">
                       <div class="feed-post-container">
                           <h3>${user.username}</h3>
                           <p>${post.content}</p>
                       </div>
                       
                       <div>
                           <form action="/comment" method="post">
                               <h4>Kommentera</h4>
                               <textarea id="comment" name="commentInput" placeholder="Kommentera på inlägget... (max 1000 karaktärer)" maxlength="1000"></textarea>
                               <input type="hidden" name="postInfo" value="${postId}">
                               <button type="submit">Skicka</button>
                           </form>
                       </div>
                       
                       <div id="comment-section">
                           ${commentHtml}
                       </div>
                   </div>
               </div>
           </main>
       </body>
       </html>
   `;

   // Skicka den färdiga HTML-sidan som svar
   res.send(htmlContent);
});


// Lägg till kommentar på ett inlägg (färdig med MongoDB)
server.post("/comment", async function (req, res) {
   const commentInput = req.body.commentInput; // Kommentarsinnehåll från formulär
   const ogPostId = req.body.postInfo;         // ID på originalinlägget

   const userId = req.cookies.userId;          // Hämtar användarens ID från cookie

   // Hitta användaren som kommenterar i databasen
   const commenterUser = await User.findOne({ _id: userId });
   console.log(ogPostId);

   // Skapa ett nytt kommentarobjekt med koppling till inlägget och användaren
   const newComment = new Comment({
      ogPost: ogPostId,
      user: commenterUser,
      content: commentInput
   });

   // Spara kommentaren i databasen
   await newComment.save();

   // Hämta originalinlägget och lägg till kommentaren i dess lista
   const ogPost = await Post.findOne({ _id: ogPostId });
   ogPost.commentsId.push(newComment._id);
   await ogPost.save();

   // Om användaren finns, redirecta tillbaka till index, annars 404
   if (commenterUser) {
      res.redirect("/index.html");
   } else {
      res.status(404).send("Post not found.");
   }
});

// Funktion för att hämta alla inlägg med kommentarer och användarinfo
async function getPosts() {
   // Hämta alla inlägg, populera kommentarerna och användarnamn i kommentarerna
   const posts = await Post.find()
      .populate({
         path: "commentsId",
         select: "-ogPost",
         populate: { path: "user", select: "username" }
      });

   const formatedPosts = [];
   for (let i = 0; i < posts.length; i++) {
      // Hämta användaren som skapat inlägget
      const user = await User.findOne({ _id: posts[i].user });

      // Skapa ett objekt med relevant data att skicka till klienten
      const userObj = {
         postId: posts[i]._id,
         username: user.username,
         profilePicture: user.profilePicture,
         content: posts[i].content,
         date: posts[i].date,
         comments: posts[i].commentsId
      };
      formatedPosts.push(userObj);
   }

   return formatedPosts;
}

// Skicka alla inlägg till klienten som JSON
server.get("/posts", async function (req, res) {
   try {
      const formatedPosts = await getPosts();
      res.json(formatedPosts);
   } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).send("Internal Server Error");
   }
});

// Skicka vänners inlägg till klienten som JSON
server.get("/friends", async function (req, res) {
   const userId = req.cookies.userId;
   const user = await User.findOne({ _id: userId });

   let userFriends = [];

   for (let i = 0; i < user.friends.length; i++) {
      // Hämta vännen (notera att find() ger array, kanske borde vara findOne())
      const friendUser = await User.find({ _id: user.friends[i] });

      // Hämta inlägg som vännen gjort med kommentarer och användarnamn i kommentarerna
      const friendPosts = await Post.find({ user: friendUser }).populate({
         path: "commentsId",
         select: "-ogPost",
         populate: { path: "user", select: "username" }
      });

      let userPosts = [];

      for (let j = 0; j < friendPosts.length; j++) {
         // Skapa objekt med vännens inlägg och dess data
         userPosts.push({
            postId: friendPosts[j]._id,
            content: friendPosts[j].content,
            date: friendPosts[j].date,
            commnets: friendPosts[j].commentsId
         });
      }
      userFriends.push({
         username: friendUser[i].username,
         posts: userPosts
      });
   }

   if (user) {
      res.json(userFriends);
   } else {
      res.status(404).send("User not found.");
   }
});

// Skicka användarens användarnamn till klienten
server.get("/accountInformation", async function (req, res) {
   const userId = req.cookies.userId;
   const user = await User.findOne({ _id: userId });

   if (user) {
      res.json(user.username);
   } else {
      res.status(404).send("User not found.");
   }
});

// Skicka användarens profilbild till klienten
server.get("/sendProfilePicture", async function (req, res) {
   const userId = req.cookies.userId;
   const user = await User.findOne({ _id: userId });

   if (user) {
      res.json({ profilePicture: user.profilePicture });
   } else {
      res.status(404).send("User not found.");
   }
});

// Uppdatera profilinställningar och spara eventuell profilbild
server.post("/saveFile", upload.single("profilePicture"), async function (req, res, next) {
   let newUsername = req.body.newUsername;
   let oldPassword = req.body.oldPassword;
   let newPassword = req.body.newPassword;
   let cookies = req.body.cookies;

   // Sökväg till uppladdad fil om det finns någon
   let filePath = req.file ? req.file.path : null;

   const userId = req.cookies.userId;
   const user = await User.findOne({ _id: userId });

   if (!user) {
      return res.status(404).send("User not found.");
   }

   // Uppdatera användarnamn om nytt angivits
   if (newUsername) {
      user.username = newUsername;
   }

   // Kontrollera gammalt lösenord och uppdatera lösenord om korrekt
   const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
   if ((newPassword !== undefined || oldPassword !== undefined) && isPasswordCorrect) {
      // Hasha och uppdatera lösenordet
      user.password = await bcrypt.hash(newPassword, 10);
   }

   // Uppdatera profilbild om fil finns
   if (filePath !== null) {
      user.profilePicture = filePath;
   }

   // Spara "remember me"-status baserat på formulärdata
   remember = (cookies === "remember");

   await user.save();

   // Skicka tillbaka till inställningssidan
   res.redirect("/settings.html");
});
