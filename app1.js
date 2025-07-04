const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry)=>{
        console.log(entry)
        if(entry.isIntersecting){
            entry.target.classList.add('show');
        }else{
            entry.target.classList.remove('show');
        }
    });
});
const hiddenElements =  document.querySelectorAll('.hidden');
hiddenElements.forEach((el)=>observer.observe(el));
const slides = document.querySelectorAll('.slide');
let currentIndex = 0;

function showSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.remove('active');
        if (i === index) {
            slide.classList.add('active');
        }
    });
}



window.addEventListener('scroll', () => {
    const scrollPosition = window.scrollY;
    const totalHeight = document.body.scrollHeight - window.innerHeight;
    const scrollFraction = scrollPosition / totalHeight;

    // Calculate the index based on scroll fraction
    const newIndex = Math.floor(scrollFraction * slides.length);
    if (newIndex !== currentIndex) {
        currentIndex = newIndex;
        showSlide(currentIndex);
    }
});

// Initialize the first slide
showSlide(currentIndex);