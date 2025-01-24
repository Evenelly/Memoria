let overlay = document.getElementById("overlay")

function popUpShow() {
   if (overlay.style.display === "" || overlay.style.display === "none") {
      overlay.style.display = "block";
   }
}

function popUpDisable() {
   overlay.style.display = "none";
}

getUserPost()

function getUserPost(){
   fetch('/posts')
      .then(response => response.json())
      .then(object => {
         const postsContainer = document.getElementById('postsContainer');

         for (let i = 0; i < object.posts.length; i++) {
            const postElement = document.createElement("div");
            postElement.classList.add("feed-post-container");

            postElement.innerHTML = `<h3>${object.username} </h3> <p> ${object.posts[i].postContent} </p>`

            postsContainer.appendChild(postElement);

            const interactions = document.createElement("div")
            interactions.classList.add("interactions")
            
            const svg = document.createElement("svg");
            svg.setAttribute("xmlns", "http://www.w3.org/2000/svg")
            svg.setAttribute("width", "20")
            svg.setAttribute("height", "20")
            svg.setAttribute("fill", "currentColor")
            svg.setAttribute("class", "bi bi-heart-fill")
            svg.setAttribute("viewBox", "0 0 16 16")

            const path = document.createElement("path")
            path.setAttribute("fill-rule", "evenodd")
            path.setAttribute("d", "M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314")

            svg.appendChild(path)
            interactions.appendChild(svg)
            postElement.appendChild(interactions)

            console.log("Posts container content:", postsContainer.innerHTML);
            
         }
            
      })
      .catch(error => {
         console.error('Error fetching posts:', error);
      });

}