

//index
let overlay = document.getElementById("overlay")

function popUpShow() { //sätter på popuppen
   if (overlay.style.display === "" || overlay.style.display === "none") {
      overlay.style.display = "block";
   }
}

let settings = document.getElementById("settings")

function settingsPop(){
   if (settings.style.display === "none" || settings.style.display === ""){
      settings.style.display = "flex";
   }else{
      settings.style.display = "none"
   }
}

function popUpDisable() { //stänger av popuppen
   overlay.style.display = "none";
}

//pre set
window.onload = showProfilePicture;

if (window.location.pathname.includes("index.html") || window.location.pathname.includes("/loginUser")) { //skriver ut postsen direkt
   writePost();
}else if (window.location.pathname.includes("friends.html")) {
   showFriends();
}
//från servern
async function getPosts() {
   try {
      response = await fetch('/posts');
      allPosts = await response.json();
      return allPosts;
   }
   catch (error) {
      console.error('Error fetching posts:', error);
   };
}

async function getFriends() {
   try {
      response = await fetch('/friends');
      friends = await response.json();
      return friends;
   }
   catch (error) {
      console.error('Error fetching posts:', error);
   };
}

//strukturer
function postStructure(allPostContents) {

   shuffleArray(allPostContents);

   const postsContainer = document.getElementById('postsContainer');
   postsContainer.innerHTML = "";



   allPostContents.forEach(post => {
      const postElement = document.createElement("div");
      postElement.classList.add("feed-post-container");

      const usernameHeading = document.createElement("h2");
      usernameHeading.textContent = post.username;
      postElement.appendChild(usernameHeading);

      const postContent = document.createElement("p");
      postContent.textContent = post.postContent;
      postElement.appendChild(postContent);

      const interactions = document.createElement("div");
      interactions.classList.add("interactions");

      icons(true, postElement, interactions, post)
      icons(false, postElement, interactions, post)

      postsContainer.appendChild(postElement);
   });
}



function commentStructure(post) {
   main = document.getElementById("main");
   main.innerHTML = "";


   const outerDiv = document.createElement("div")
   const divPost = document.createElement("div");

   const originalComment = document.createElement("div")
   const commentSection = document.createElement("div")
   const commentInput = document.createElement("div")

   originalComment.innerHTML = `   
   <h3>${post.username}</h3>
   <p>${post.postContent}</p>`
   divPost.append(originalComment)

   console.log(post.postId)

   commentInput.innerHTML = `
   <form action="/comment" method="post">
      <h4>Kommentera</h4>
      <textarea id="comment" type="text" placeholder="Kommentera på inlägget... (max 1000 karaktärer)" maxlength="1000"
      name="commentInput"></textarea>

      <!-- Hidden inputs for postUsername and postId -->
      <input type="hidden" name="postInfo" value="${post.postId}">

      <button type="submit">Skicka</button>
   </form>
   <div id="comment-section"><div>
   `;
   divPost.append(commentInput)

   outerDiv.classList.add("flex-container");
   divPost.classList.add("comment-container")
   originalComment.classList.add("feed-post-container")


   for (let i = 0; i < post.comments.length; i++) {
      const commentDiv = document.createElement("div")
      commentDiv.classList.add("feed-post-container")

      const commentUser = document.createElement("h4")
      const comment = document.createElement("p")
      commentUser.innerHTML = post.comments[i].user.username
      comment.innerHTML = post.comments[i].content

      commentDiv.append(commentUser)
      commentDiv.append(comment)
      commentSection.append(commentDiv)
   }

   divPost.append(commentSection)
   outerDiv.append(divPost);
   main.append(outerDiv);
}


function icons(heart, postElement, interactions, post) { //skriver ut icons beroende på ifall det är hjärta eller kommentar

   const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
   svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
   svg.setAttribute("width", "20");
   svg.setAttribute("height", "20");
   svg.setAttribute("fill", "currentColor");
   svg.setAttribute("viewBox", "0 0 16 16");

   if (heart) {
      svg.setAttribute("class", "bi bi-heart-fill");
      svg.setAttribute("onClick", "")

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill-rule", "evenodd");
      path.setAttribute("d", "M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314");

      svg.appendChild(path);
   }
   else {
      svg.setAttribute("class", "bi bi-chat-dots");

      const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path1.setAttribute("d", "M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2");

      const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path2.setAttribute("d", "m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2")

      svg.appendChild(path1);
      svg.appendChild(path2);


      svg.addEventListener("click", function () {
         commentStructure(post);
      });

   }

   interactions.appendChild(svg);
   postElement.appendChild(interactions);
   postsContainer.appendChild(postElement);
}

//visar de vänner användaren har
function showFriends() { //visar vännerna som användaren har

   getFriends().then(friends => {
      const friendsDiv = document.getElementById('friends-div');
      friendsDiv.innerHTML = "";

      friends.forEach(friend => {
         const container = document.createElement("div");
         container.classList.add("friend");

         const usernameHeading = document.createElement("h2");
         usernameHeading.textContent = friend.username;
         container.appendChild(usernameHeading);

         const chatButton = document.createElement("button")
         chatButton.innerHTML = "Chat"
         container.appendChild(chatButton)

         friendsDiv.appendChild(container);

      });
   })
}

//visar profilbild
function showProfilePicture() {
   getProfilePicture().then(profilePicturePath => {
      profileParent = document.getElementById("profile-info")
      if (profilePicturePath === "") { //ifall personen inte har en profilbild

         const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
         svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
         svg.setAttribute("width", "32");
         svg.setAttribute("height", "32");
         svg.setAttribute("fill", "currentColor");
         svg.setAttribute("viewBox", "0 0 16 16");

         svg.setAttribute("class", "bi bi-person-circle");
         svg.setAttribute("onClick", "")


         const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
         path1.setAttribute("d", "M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0");

         const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
         path2.setAttribute("d", "M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1")

         svg.appendChild(path1);
         svg.appendChild(path2);

         profileParent.appendChild(svg);

      } else { //ifall personen har en profilbild

         const profilePicture = document.createElement("img")
         profilePicture.classList.add("profile-picture")

         profileParent.appendChild(profilePicture)
         
         profilePicturePath = profilePicturePath.replace("\public\\", ""); //pga att det ska ut gå från filerna i public
         profilePicture.setAttribute("src", profilePicturePath)

      }
   })
}


//Informations samling
function writePost(all = true) { //kollar ifall det är det är vänner eller alla som ska skrivas ut

   let allPostContents = [];

   if(all){ //ifall det är alla
      getPosts().then(posts => {
         // for (let i = 0; i < allPosts.length; i++) {
         //    allPosts[i].posts.forEach(post => {
         //       allPostContents.push({
         //          username: allPosts[i].username,
         //          postContent: post.postContent,
         //          comments: post.comments
         //       });
         //    });
         // }

         for (let i = 0; i < posts.length; i++) {
            allPostContents.push({
               postId: posts[i].postId,
               username: posts[i].username,
               postContent: posts[i].content,
               date: posts[i].date,
               comments: posts[i].comments
            })
         }


         postStructure(allPostContents) //skriver ut det 
      });
   }else{ //ifall det är vänner
      getFriends().then(friends => {
         for (let i = 0; i < friends.length; i++) {
            friends[i].posts.forEach(post => {
               allPostContents.push({
                  username: friends[i].username,
                  postContent: post.postContent,
                  postId: post.postId,
                  comments: post.comments
               });
            });
         }
         postStructure(allPostContents) //skriver ut det 
      })
   }
}

async function getProfilePicture() {
   try {
      response = await fetch('/sendProfilePicture');
      data = await response.json();
      return data.profilePicture;
   }
   catch (error) {
      console.error('Error fetching posts:', error);  
   };
}


//övrigt
function shuffleArray(array) { //shufflar alla posts till en random order
   for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
   }
}


