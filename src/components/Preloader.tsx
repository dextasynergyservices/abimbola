import { useEffect, useState } from "react";

const Preloader = () => {
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Prevent scrolling while loading
    document.body.style.overflow = "hidden";
    
    const timer = setTimeout(() => {
      setLoading(false);
      document.body.classList.add('app-loaded');
      document.body.style.overflow = "";
      setTimeout(() => setVisible(false), 800);
    }, 1800);

    return () => {
      clearTimeout(timer);
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
