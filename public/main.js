//index
let overlay = document.getElementById("overlay") // Hämtar elementet för pop-up overlay

function popUpShow() { // Visar pop-up overlay
   if (overlay.style.display === "" || overlay.style.display === "none") {
      overlay.style.display = "block";
   }
}

let settings = document.getElementById("settings") // Hämtar inställningspanelen

function settingsPop() { // Växlar visning av inställningspanelen
   if (settings.style.display === "none" || settings.style.display === "") {
      settings.style.display = "flex";  // Visa panelen
   } else {
      settings.style.display = "none"   // Dölj panelen
   }
}

function popUpDisable() { // Stänger av pop-up overlay
   overlay.style.display = "none";
}

// Körs när sidan är laddad
window.onload = showProfilePicture; // Visar profilbild vid laddning

// Beroende på vilken sida användaren är på körs olika funktioner
if (window.location.pathname.includes("index.html") || window.location.pathname.includes("/login") || (window.location.pathname.includes("/init"))) {
   writePost(); // Skriver ut inlägg på startsidan och login/init-sidorna
} else if (window.location.pathname.includes("friends.html")) {
   showFriends(); // Visar vänner på vänner-sidan
} else if (window.location.pathname.includes("account.html")) {
   showProfile(); // Visar profil på kontosidan
}

// Väntar tills DOM är fullständigt laddad
document.addEventListener("DOMContentLoaded", function () {
   if (window.location.pathname.includes("signin.html")) {
      const button = document.getElementById("GDPR-checkbox");
      GDPRButton(button); // Initierar GDPR-knapp på inloggningssidan
   }
});

// Hämtar kontoinformation från servern
async function getAccountInfo() {
   try {
      response = await fetch('/accountInformation');
      account = await response.json();
      return account;
   }
   catch (error) {
      console.error('Error fetching account:', error);
   };
}

// Hämtar alla inlägg från servern
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

// Hämtar vännernas inlägg från servern
async function getFriends() {
   try {
      response = await fetch('/friends');
      friends = await response.json();
      return friends;
   }
   catch (error) {
      console.error('Error fetching friends:', error);
   };
}

// Hämtar profilbild från servern
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

// Strukturerar inlägg för profilvyn
function profileStructure() {
   getPosts().then(posts => {
      // Går igenom alla inlägg och lägger in i en array
      for (let i = 0; i < posts.length; i++) {
         allPostContents.push({
            postId: posts[i].postId,
            username: posts[i].username,
            postContent: posts[i].content,
            date: posts[i].date,
            comments: posts[i].comments
         })
      }
   });
}

// Skapar och visar inlägg på sidan, kan användas för profil eller vanlig feed
function postStructure(allPostContents, profile = false) {
   shuffleArray(allPostContents); // Blandar ordningen på inläggen slumpmässigt
   let postsContainer;

   if (profile) {
      postsContainer = document.getElementById("profile-posts") // Container för profilens inlägg
   } else {
      postsContainer = document.getElementById('postsContainer'); // Container för feedens inlägg
      postsContainer.innerHTML = ""; // Rensar befintligt innehåll innan utskrift
   }

   // Skapar HTML-element för varje inlägg
   allPostContents.forEach(post => {
      const postElement = document.createElement("div");
      postElement.classList.add("feed-post-container");

      const profileInformation = document.createElement("div")
      postElement.appendChild(profileInformation)
      profileInformation.classList.add("post-profile-information")

      const profilePictureImg = document.createElement("img")
      if (post.profilePicture == "") {
         // Om ingen profilbild finns, sätt en default bild
         profilePictureImg.src = "https://i.ytimg.com/vi/vH8kYVahdrU/hqdefault.jpg"
      } else {
         // Anpassar sökväg till profilbild
         profilePicturePath = post.profilePicture.replace("\public\\", "");
         profilePictureImg.src = profilePicturePath
      }
      profilePictureImg.classList.add("post-img")
      profileInformation.appendChild(profilePictureImg)

      // Lägger till användarnamn
      const usernameHeading = document.createElement("h2");
      usernameHeading.textContent = post.username;
      profileInformation.appendChild(usernameHeading);

      // Lägger till inläggstexten
      const postContent = document.createElement("p");
      postContent.textContent = post.content;
      postElement.appendChild(postContent);

      // Container för interaktioner som likes och kommentarer
      const interactions = document.createElement("div");
      interactions.classList.add("interactions");

      // Lägg till hjärta och kommentars-ikoner
      icons(true, postElement, interactions, post, postsContainer)
      icons(false, postElement, interactions, post, postsContainer)

      const bottomSection = document.createElement("div");

      // Visar datum eller tid för inlägget
      const date = document.createElement("div");
      date.textContent = formatDate(post.date);
      bottomSection.appendChild(date)

      bottomSection.classList.add("bottom-section")
      bottomSection.appendChild(interactions)
      postElement.appendChild(bottomSection)

      postsContainer.appendChild(postElement);
   });
}

// Formaterar datum: visar tid om dagens datum, annars visar datum
function formatDate(date) {
   const dateObj = new Date(date);
   const today = new Date();

   const postDate = dateObj.toISOString().split('T')[0];
   const currentDate = today.toISOString().split('T')[0];

   if (postDate === currentDate) {
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
   } else {
      return dateObj.toLocaleDateString('sv-SE');
   }
}

// Struktur för att visa ett inlägg med kommentarer och kommentarsformulär
function commentStructure(post) {
   console.log(post)
   main = document.getElementById("main");
   main.innerHTML = ""; // Rensar sidan innan visning

   const outerDiv = document.createElement("div")
   const divPost = document.createElement("div");

   const originalComment = document.createElement("div")
   const commentSection = document.createElement("div")
   const commentInput = document.createElement("div")

   // Visar originalinlägget högst upp
   originalComment.innerHTML = `   
   <h3>${post.username}</h3>
   <p>${post.content}</p>`
   divPost.append(originalComment)

   // Formulär för att skicka ny kommentar
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

   // CSS-klasser för layout
   outerDiv.classList.add("flex-container");
   divPost.classList.add("comment-container")
   originalComment.classList.add("feed-post-container")

   // Loopar igenom och visar varje kommentar
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

// Skapar och lägger till ikoner för hjärta (like) eller kommentar till inläggen
function icons(heart, postElement, interactions, post, postsContainer) {
   const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
   svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
   svg.setAttribute("width", "25");
   svg.setAttribute("height", "25");
   svg.setAttribute("fill", "currentColor");
   svg.setAttribute("viewBox", "0 0 20 20");

   if (heart) {
      // Skapar hjärt-ikon för like
      svg.setAttribute("class", "bi bi-heart-fill");
      svg.setAttribute("onClick", "") // Placeholder för klick-event

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("fill-rule", "evenodd");
      path.setAttribute("d", "M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314");

      svg.appendChild(path);
   }
   else {
      // Skapar kommentars-ikon
      svg.setAttribute("class", "bi bi-chat-dots");

      const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path1.setAttribute("d", "M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m3 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2");

      const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path2.setAttribute("d", "m2.165 15.803.02-.004c1.83-.363 2.948-.842 3.468-1.105A9 9 0 0 0 8 15c4.418 0 8-3.134 8-7s-3.582-7-8-7-8 3.134-8 7c0 1.76.743 3.37 1.97 4.6a10.4 10.4 0 0 1-.524 2.318l-.003.011a11 11 0 0 1-.244.637c-.079.186.074.394.273.362a22 22 0 0 0 .693-.125m.8-3.108a1 1 0 0 0-.287-.801C1.618 10.83 1 9.468 1 8c0-3.192 3.004-6 7-6s7 2.808 7 6-3.004 6-7 6a8 8 0 0 1-2.088-.272 1 1 0 0 0-.711.074c-.387.196-1.24.57-2.634.893a11 11 0 0 0 .398-2")

      svg.appendChild(path1);
      svg.appendChild(path2);

      // Klick-event som visar kommentarsstrukturen
      svg.addEventListener("click", function () {
         commentStructure(post);
         //window.location.href = `/post/${post.postId}`;
      });

   }

   interactions.appendChild(svg);
   postElement.appendChild(interactions);
   postsContainer.appendChild(postElement);
}

// Visar vänner som användaren har
function showFriends() {
   getFriends().then(friends => {
      const friendsDiv = document.getElementById('friends-div');
      friendsDiv.innerHTML = ""; // Rensar befintligt innehåll

      // Skapar element för varje vän
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


// visar profilbild
function showProfilePicture() {
   // Hämtar profilbildens sökväg från servern asynkront
   getProfilePicture().then(profilePicturePath => {
      // Hämtar alla element med klassen "profile-img" där bilden ska visas
      const profileParents = document.querySelectorAll(".profile-img");

      // Loopar igenom varje element där profilbild ska visas
      profileParents.forEach(profileParent => {

         // Om det inte finns någon profilbild satt, visa en default-ikon
         if (profilePicturePath === "") {
            noProfilePictureAvailable(profileParent)

         } else {
            // Skapa en img-tagg för profilbilden
            const profilePicture = document.createElement("img");
            profilePicture.classList.add("profile-picture");

            // Lägg till img-taggen i elementet där bilden ska visas
            profileParent.appendChild(profilePicture);

            // Justera sökvägen för profilbilden för att fungera korrekt
            profilePicturePath = profilePicturePath.replace("\public\\", "");
            // Sätt src-attributet till bildens sökväg
            profilePicture.setAttribute("src", profilePicturePath);
         }
      });
   });
}

// Visar en standardikon om användaren saknar profilbild
function noProfilePictureAvailable(profileParent) {
   // Skapar ett SVG-element som representerar en person-ikon
   const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
   svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
   svg.setAttribute("width", "32");
   svg.setAttribute("height", "32");
   svg.setAttribute("fill", "currentColor");
   svg.setAttribute("viewBox", "0 0 16 16");

   svg.setAttribute("class", "bi bi-person-circle");
   svg.setAttribute("onClick", "");

   // Skapar och lägger till första path-elementet i SVG:n (huvud)
   const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
   path1.setAttribute("d", "M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0");

   // Skapar och lägger till andra path-elementet i SVG:n (cirkel runt)
   const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
   path2.setAttribute("d", "M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1");

   svg.appendChild(path1);
   svg.appendChild(path2);

   // Lägg till SVG:n i elementet där profilbilden skulle visas
   profileParent.appendChild(svg);
}

// Visar profilinformation och inlägg på profilsidan
function showProfile() {
   const profileNameH = document.getElementById("profile-name")
   const profilePosts = document.getElementById("profile-posts")

   // Hämtar kontoinformation (användarnamn) asynkront
   getAccountInfo().then(accountName => {
      // Sätter rubriken på profilsidan till användarnamnet
      profileNameH.innerHTML = accountName;

      // Hämtar alla inlägg
      getPosts().then(posts => {
         let userPosts = [];

         // Filtrerar ut endast inlägg från aktuell användare
         for (let i = 0; i < posts.length; i++) {
            if (posts[i].username === accountName) {
               userPosts.push(posts[i])
            }
         }

         // Skriver ut användarens inlägg på profilsidan
         postStructure(userPosts, true)
      })
   })
}

// Samlar in och visar inlägg, antingen alla eller bara från vänner
function writePost(all = true) { //kollar ifall det är det är vänner eller alla som ska skrivas ut

   let allPostContents = [];

   if (all) { // Om alla inlägg ska visas
      getPosts().then(posts => {

         for (let i = 0; i < posts.length; i++) {
            allPostContents.push({
               postId: posts[i].postId,
               username: posts[i].username,
               profilePicture: posts[i].profilePicture,
               content: posts[i].content,
               date: posts[i].date,
               comments: posts[i].comments
            })
         }

         // Visar alla inlägg på sidan
         postStructure(allPostContents)
      });
   } else { // Om endast vännernas inlägg ska visas
      getFriends().then(friends => {
         for (let i = 0; i < friends.length; i++) {
            for (let j = 0; j < friends[i].posts.length; j++) {
               allPostContents.push({
                  postId: friends[i].posts[j].postId,
                  username: friends[i].username,
                  postContent: friends[i].posts[j].content,
                  date: friends[i].posts[j].date,
                  comments: friends[i].posts[j].comments
               })
            }
         }
         // Visar vännernas inlägg på sidan
         postStructure(allPostContents)
      })
   }
}

// Övriga hjälpfunktioner

// Slumpar ordningen på element i en array
function shuffleArray(array) {
   for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
   }
}

// Hanterar aktiveringen av GDPR-relaterad knapp beroende på checkbox
function GDPRButton(checkBox) {

   button = document.getElementById("submit-sign-in")
   if (checkBox.checked) {
      button.disabled = false;
   } else {
      button.disabled = true;
   }
}

// Visar och döljer GDPR-relaterade dokument beroende på vad som klickas
function GDPR(value) {
   privacyPolicy = document.getElementById("privacyPolicy")
   termsOfUse = document.getElementById("termsOfUse")

   if (value.innerHTML === "Terms of Use") {
      if (termsOfUse.style.display === "flex") {
         termsOfUse.style.display = "none"
      } else {
         termsOfUse.style.display = "flex";
      }
   } else if (value.innerHTML === "Privacy Policy") {
      if (privacyPolicy.style.display === "flex") {
         privacyPolicy.style.display = "none"
      } else {
         privacyPolicy.style.display = "flex";
      }
   } else if (value === "X") {
      // Stänger alla GDPR-rutor vid kryss
      privacyPolicy.style.display = "none"
      termsOfUse.style.display = "none"
   }
}
