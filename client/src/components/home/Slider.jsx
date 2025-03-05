import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const images = [
  "https://bc.imgix.net/banner/f6afa840f7.png?_v=4&auto=format&dpr=1&w=480",
  "https://bc.imgix.net/banner/a0f4001852.png?_v=4&auto=format&dpr=1&w=480",
  "https://bc.imgix.net/banner/25e2513bf0.png?_v=4&auto=format&dpr=1&w=480",
  "https://bc.imgix.net/banner/f49454be41.png?_v=4&auto=format&dpr=1&w=480",
  "https://bc.imgix.net/banner/b98211b5b1.png?_v=4&auto=format&dpr=1&w=480",
  "https://bc.imgix.net/banner/9d593c061e.png?_v=4&auto=format&dpr=1&w=480",
  "https://bc.imgix.net/banner/fe1f9f6d73.png?_v=4&auto=format&dpr=1&w=480",
  "https://bc.imgix.net/banner/d8c339f7d0.png?_v=4&auto=format&dpr=1&w=480",
  "https://bc.imgix.net/banner/c579a042eb.png?_v=4&auto=format&dpr=1&w=480"
];

const Slider = () => {
  const [current, setCurrent] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(1);

  useEffect(() => {
    const updateSlidesPerView = () => {
      setSlidesPerView(window.innerWidth < 768 ? 1 : 3);
    };
    updateSlidesPerView();
    window.addEventListener("resize", updateSlidesPerView);
    return () => window.removeEventListener("resize", updateSlidesPerView);
  }, []);

  const totalSlides = Math.ceil(images.length / slidesPerView);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % totalSlides);
    }, 4000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  return (
    <div className="relative w-full overflow-hidden">
      <div
        className="flex transition-transform duration-500"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {images.map((image, index) => (
          <motion.div
            key={index}
            className={`flex-shrink-0 px-2`} 
            style={{ width: `${100 / slidesPerView}%` }}
          >
            <img
              src={image}
              className="w-full h-[200px] md:h-[250px] rounded-lg"
              alt="slider"
            />
          </motion.div>
        ))}
      </div>
      <div className="flex justify-center space-x-2 mt-2">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-2 rounded-full transition-all duration-300 ${
              current === index ? "bg-bg5 w-6" : "bg-gray-200"
            }`}
          ></button>
        ))}
      </div>
    </div>
  );
};

export default Slider;
