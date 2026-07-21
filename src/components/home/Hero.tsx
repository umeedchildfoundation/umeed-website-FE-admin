import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Heart, Users, BookOpen } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "../../components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import { useSiteContent } from "../../contexts/SiteContentContext";

export function Hero() {
  const { getContent } = useSiteContent();

  // Get dynamic content with fallbacks
  const tagline = getContent('hero', 'tagline', 'Every Sunday, We Light Up Futures');
  const title = getContent('hero', 'title', 'Turning Hope into');
  const titleHighlight = getContent('hero', 'title_highlight', 'Opportunity');
  const description = getContent('hero', 'description',
    'UMEED Children Foundation empowers underprivileged children through free education every Sunday. Join our community of volunteers making a difference, one child at a time.'
  );

  // Stats
  const studentsCount = getContent('stats', 'students_count', '200+');
  const studentsLabel = getContent('stats', 'students_label', 'Students Taught');
  const volunteersCount = getContent('stats', 'volunteers_count', '50+');
  const volunteersLabel = getContent('stats', 'volunteers_label', 'Volunteers');
  const sessionsCount = getContent('stats', 'sessions_count', '100+');
  const sessionsLabel = getContent('stats', 'sessions_label', 'Sunday Sessions');

  // Hero images
  const heroImages = [
    { src: getContent('hero', 'image_1', '/hero1.jpg'), alt: 'Umeed team photo 1' },
    { src: getContent('hero', 'image_2', '/hero2.jpg'), alt: 'Umeed team photo 2' },
    { src: getContent('hero', 'image_3', '/hero3.jpg'), alt: 'Umeed team photo 3' },
  ].filter(img => img.src); // Filter out empty images

  return (
    <section className="relative w-full min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Carousel */}
      <div className="absolute inset-0 z-0">
        <Carousel
          className="w-full h-full"
          plugins={[
            Autoplay({
              delay: 6000,
            }),
            Fade(),
          ]}
        >
          <CarouselContent className="h-full ml-0">
            {heroImages.map((image, index) => (
              <CarouselItem key={index} className="h-full pl-0 relative">
                <div className="absolute inset-0 bg-black/40 z-10" />
                <div className="w-full h-full overflow-hidden">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="w-full h-full object-cover object-[50%_85%] transform scale-105"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Gradient Overlay for "Blending" with scroll */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-20 pt-20 md:pt-0">
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-full text-xs md:text-sm font-medium mb-4 md:mb-6 animate-pulse border border-white/20">
              <Heart className="w-3 h-3 md:w-4 md:h-4 text-red-400 fill-red-400" />
              {tagline}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="font-fredoka text-3xl md:text-6xl lg:text-7xl font-bold leading-tight mb-4 md:mb-6 drop-shadow-lg tracking-tight"
          >
            {title}{" "}
            <span className="text-umeed-yellow">{titleHighlight}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-base md:text-xl text-gray-100 max-w-2xl mx-auto mb-8 md:mb-10 leading-relaxed drop-shadow-md px-2 md:px-0"
          >
            {description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 md:mb-16"
          >
            <Button size="lg" className="text-base px-8 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] bg-umeed-sky/60 backdrop-blur-md border border-white/20 hover:bg-umeed-sky/80 text-white transition-all duration-300 hover:scale-105" asChild>
              <Link to="/volunteer#application-form">
                Become a Volunteer
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>

          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-8"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl mb-3 shadow-lg">
                <Users className="w-6 h-6 text-umeed-sky" />
              </div>
              <div className="font-display text-3xl md:text-4xl font-bold text-white drop-shadow-md">
                {studentsCount}
              </div>
              <div className="text-sm text-white drop-shadow-md">{studentsLabel}</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl mb-3 shadow-lg">
                <Heart className="w-6 h-6 text-red-400" />
              </div>
              <div className="font-display text-3xl md:text-4xl font-bold text-white drop-shadow-md">
                {volunteersCount}
              </div>
              <div className="text-sm text-white drop-shadow-md">{volunteersLabel}</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl mb-3 shadow-lg">
                <BookOpen className="w-6 h-6 text-umeed-sage" />
              </div>
              <div className="font-display text-3xl md:text-4xl font-bold text-white drop-shadow-md">
                {sessionsCount}
              </div>
              <div className="text-sm text-white drop-shadow-md">{sessionsLabel}</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
