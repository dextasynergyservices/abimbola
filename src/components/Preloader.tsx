import { useEffect, useState } from "react";
import heroPortrait from "@/assets/ABIMBOLA PIX (1).png";

// The heaviest images that need to load before we reveal the site
const IMAGES_TO_PRELOAD = [
  heroPortrait,
  "https://res.cloudinary.com/dxoorukfj/image/upload/v1782301942/mobile-bg_yzdcxu.png",
  "https://res.cloudinary.com/dxoorukfj/image/upload/v1782301518/ChatGPT_Image_Jun_24_2026_12_43_57_PM_lnebly.png"
];

const Preloader = () => {
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Prevent scrolling while loading
    document.body.style.overflow = "hidden";
    
    let isMounted = true;

    const preloadImages = async () => {
      // 1. Create promises for all images
      const imagePromises = IMAGES_TO_PRELOAD.map((src) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = src;
          // Resolve on both load and error so one broken image doesn't hang the app
          img.onload = resolve;
          img.onerror = resolve;
        });
      });

      // 2. We want to show the loader for at least 800ms so it doesn't flash abruptly,
      // but if the network is really slow, we fallback at 6 seconds to avoid an infinite loading screen.
      const minDelay = new Promise((resolve) => setTimeout(resolve, 800));
      const maxDelay = new Promise((resolve) => setTimeout(resolve, 6000));

      // Wait for either (all images + minimum delay) OR (maximum delay)
      await Promise.race([
        Promise.all([Promise.all(imagePromises), minDelay]),
        maxDelay
      ]);

      if (isMounted) {
        setLoading(false);
        document.body.classList.add('app-loaded');
        document.body.style.overflow = "";
        setTimeout(() => setVisible(false), 800);
      }
    };

    preloadImages();

    return () => {
      isMounted = false;
      document.body.style.overflow = "";
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white transition-opacity duration-700 ease-in-out ${
        loading ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="flex flex-col items-center">
        <img
          src="https://res.cloudinary.com/dxoorukfj/image/upload/v1782312802/Abimbola_LOGO_3_ms0jyd.png"
          alt="Abimbola Lawuyi"
          className="h-20 md:h-28 w-auto mb-8 animate-pulse"
        />
        <div className="flex gap-2">
          <div className="w-2 h-2 rounded-full bg-[#c9963f] animate-bounce" style={{ animationDelay: "0ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-[#c9963f] animate-bounce" style={{ animationDelay: "150ms" }}></div>
          <div className="w-2 h-2 rounded-full bg-[#c9963f] animate-bounce" style={{ animationDelay: "300ms" }}></div>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
