//Toggle button toggle action JS****************************
var sub=document.querySelector(".submenu");
var x=document.querySelector(".toggle").onclick=function(){
  this.classList.toggle("active");
  sub.classList.toggle("active");
}
//Toggle button toggle action JS******************************

// Not working Carousel JS but learn from it******************
// const carouselSlide = document.querySelector(".carousel-slide");
// const carouselImages = document.querySelectorAll(".carousel-slide img");
// const prevBtn = document.querySelector(".prev");
// const nextBtn = document.querySelector(".next");
// let counter=1;
// const size=carouselImages[0].clientWidth;
// nextBtn.addEventListener("click", ()=>{
// });
// Not working Carousel ends here********************************

// Below is Working Carousel JS**********************************
const buttons=document.querySelectorAll("[data-carousel-button]")
buttons.forEach(button =>{
  button.addEventListener("click", () => {
    const offset = button.dataset.carouselButton === "next"? 1 : -1
    const slides = button
    .closest("[data-carousel]")
    .querySelector("[data-slides]")
  const activeSlide = slides.querySelector("[data-active]")
  let newIndex = [...slides.children].indexOf(activeSlide) + offset
  if(newIndex < 0) newIndex=slides.children.length - 1
  if(newIndex >= slides.children.length) newIndex = 0

  slides.children[newIndex].dataset.active = true
  delete activeSlide.dataset.active
  })
})
//Working JS Carousel Ends here***********************************

// All related to the timeline js*********************************

"use strict";

function qs(selector, all = false) {
  return all ? document.querySelectorAll(selector) : document.querySelector(selector);
}

const sections = qs('.section', true);
const timeline = qs('.timeline');
const line = qs('.line');
line.style.bottom = `calc(100% - 20px)`;
let prevScrollY = window.scrollY;
let up, down;
let full = false;
let set = 0;
const targetY = window.innerHeight * .8;

function scrollHandler(e) {
  const {
    scrollY
  } = window;
  up = scrollY < prevScrollY;
  down = !up;
  const timelineRect = timeline.getBoundingClientRect();
  const lineRect = line.getBoundingClientRect(); // const lineHeight = lineRect.bottom - lineRect.top;

  const dist = targetY - timelineRect.top;
  console.log(dist);

  if (down && !full) {
    set = Math.max(set, dist);
    line.style.bottom = `calc(100% - ${set}px)`;
  }

  if (dist > timeline.offsetHeight + 50 && !full) {
    full = true;
    line.style.bottom = `-50px`;
  }

  sections.forEach(item => {
    // console.log(item);
    const rect = item.getBoundingClientRect(); //     console.log(rect);

    if (rect.top + item.offsetHeight / 5 < targetY) {
      item.classList.add('show-me');
    }
  }); // console.log(up, down);

  prevScrollY = window.scrollY;
}

scrollHandler();
line.style.display = 'block';
window.addEventListener('scroll', scrollHandler);


// Timeline js ENDS here!!!*********************************************