// SLIDER

let images = [

"images/banner1.jpg",
"images/banner2.jpg",
"images/banner3.jpg"

]

let index = 0

function slider(){

document.getElementById("slideImage").src = images[index]

index++

if(index >= images.length){

index = 0

}

}

setInterval(slider,3000)



// SEARCH FUNCTION

function searchProduct(){

let input = document.getElementById("searchInput").value.toLowerCase()

let products = document.querySelectorAll(".product")

products.forEach(function(product){

let title = product.querySelector(".product-title").innerText.toLowerCase()

if(title.includes(input)){

product.style.display="block"

}

else{

product.style.display="none"

}

})

}