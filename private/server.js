var express = require("express");
var server = express();
var bodyParser = require("body-parser");
var path = require("path");
var fs = require("fs");
var cookie = require("cookie-parser");
let userId = 0; 
let postId = 0;

server.use(cookie());
server.use(bodyParser.urlencoded({extended:true}))
server.use(express.static(path.join(__dirname, "../public")));


server.listen(3030, function(){
   console.log("The server has started")
   
})


server.get("/init", function(req,res){
   res.sendFile(path.join(__dirname, "../public", "login.html"));
})

server.post("/loginUser", function(req,res){
   let correctInput = false;
   var usernameInput = req.body.usernameInput;
   var passwordInput = req.body.passwordInput;
   var users = fs.readFileSync(path.join(__dirname, 'accounts.json'));
   var usersObject = JSON.parse(users)

   for (let i = 0; i < usersObject.length && correctInput === false; i++) {
      if (usernameInput === "admin" && passwordInput === "admin") {
         res.cookie("username", "admin");
         res.cookie("userId", "0");
         res.sendFile(path.join(__dirname, "../public", "index.html"));
         correctInput = true;
      }else if (usernameInput === usersObject[i].username && passwordInput === usersObject[i].password) {
         res.cookie("username", usersObject[i].username);
         res.cookie("userId", usersObject[i].userId);
         res.sendFile(path.join(__dirname, "../public", "index.html"));
         correctInput = true;
         index = usersObject.length;
      }
   }

   if (!correctInput) {
      res.send("Wrong username");
   }
})


server.post("/signinUser", function (req, res) {
   let alreadyTaken = false;

   newUser = req.body.newUsername;
   newPass = req.body.newPassword;
   info = req.body.information;
   var users = fs.readFileSync(path.join(__dirname, 'accounts.json'));
   var usersObject = JSON.parse(users)

   var hasCapitalLetters = /[A-Z]/.test(newPass)
   var hasNumbers = /[0-9]/.test(newPass)


   if (newUser.length > 0 && newPass.length > 0) {
      for (let i = 0; i < usersObject.length; i++) {
         if (newUser === usersObject[i].username) {
            alreadyTaken = true;
         } else if (!hasCapitalLetters || !hasNumbers || newPass.length < 7) {
            res.send("Lösenordet behöver minst en <strong>stor bokstav</strong>, ett <strong>nummer</strong>, och ett minimun av <strong>8 karaktärer</strong> <a href=signin.html>försök på nytt!!</a>")
         }
      }

      if (!alreadyTaken && hasCapitalLetters && hasNumbers) {
         userId += 1; 
         let newInstance = new User(newUser, newPass, userId) 

         // newLogIn = {
         //    username: newUser,
         //    password: newPass
         // }

         // res.cookie("enteredBefore", true)
         // res.cookie("username", newUser)
         // res.cookie("password", newPass)


         usersObject.push(newInstance)
         let updatedData = JSON.stringify(usersObject)
         fs.writeFileSync(path.join(__dirname, 'accounts.json'), updatedData);

         res.sendFile(path.join(__dirname, "../public", "index.html"));
      }
      else {
         res.send("Detta användarnamn är redan taget, <a href=/s>försök igen!</a>");
      }

   } else {
      res.send("Oanvändabrt användarnamn eller lösenord, <a href=/s>försök igen!</a>")
   }

})



//fungerar inte än
server.post("/post", function(req,res){
   postContent = req.body.textInput;
   username = req.cookies.username;
   const userId = parseInt(req.cookies.userId, 10);

   const newPost = {
      postContent: postContent,
      postId: postId
   };
   postId += 1; 


   user = findUserByUsernameAndId(username, userId);

   if (user) {
      user.posts.push(newPost);

      let users = JSON.parse(fs.readFileSync(path.join(__dirname, 'accounts.json')));

      const userIndex = users.findIndex(u => u.userId === userId);

      if (userIndex !== -1) {
         users[userIndex] = user;

         fs.writeFileSync(path.join(__dirname, 'accounts.json'), JSON.stringify(users, null, 2));

         res.send("Post added successfully!");
      }
   }
   // let updatedData = JSON.stringify(usersObject);
   // fs.writeFileSync(path.join(__dirname, 'accounts.json'), updatedData);

   console.log("post added")
})

function findUserByUsernameAndId(username, userId) {
   var users = JSON.parse(fs.readFileSync(path.join(__dirname, 'accounts.json')));

   for (let i = 0; i < users.length; i++) {
      if (users[i].username === username && parseInt(users[i].userId, 10) === userId) {
         return users[i]
      }
   }

   return console.log("error in findUserByUsernameAndId")

}




server.get("/posts", function (req, res) {
   let users = JSON.parse(fs.readFileSync(path.join(__dirname, 'accounts.json')));

   const username = req.cookies.username;
   const userId = parseInt(req.cookies.userId, 10);

   let user = findUserByUsernameAndId(username, userId);

   if (user) {
      res.json({
         posts: user.posts,
         username: user.username
      });
      } else {
      res.status(404).send("User not found.");
   }
});

server.get("/friends", function(req, res){
   let users = JSON.parse(fs.readFileSync(path.join(__dirname, 'accounts.json')));

   const username = req.cookies.username;
   const userId = parseInt(req.cookies.userId, 10);

   let user = findUserByUsernameAndId(username, userId);

   if (user) {
      res.json(user.friends);
   } else {
      res.status(404).send("User not found.");
   }
})


// class User {

//    constructor(username, password, userId) {
//       this.username = username;
//       this.password = password;
//       this.userId = userId;
//       this.posts = [];
//       this.friends = []
//    };

//    newPost(newPost) {
//       this.posts.push(newPost)
//    };

//    getPosts() {
//       return this.posts;
//    }

//    removePost(index) {
//       if (index >= 0 && index < this.posts.length) {
//          this.posts.splice(index, 1);
//       } else {
//          console.log('Invalid index');
//       }
//    }


//    addFriend(newFriend){
//       this.friends.push(newFriend)
//    }

//    getFriends(){
//       return this.friends
//    }

//    removeFriend(index){
//       if (index >= 0 && index < this.friends.length) {
//          this.friends.splice(index, 1);
//       } else {
//          console.log('Invalid index');
//       }
//    }
// }

