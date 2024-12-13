import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation, useScroll, useTransform } from 'framer-motion';
import { Menu, X, ChevronRight, Calendar, FileText, Users, Shield, Phone, Mail, MapPin, ChevronLeft } from 'lucide-react';
import { useInView } from 'react-intersection-observer';
import a1 from "../assets/images/a1.jpg"
import a2 from "../assets/images/a4.jpg"
import a3 from "../assets/images/a3.jpg"
import a4 from "../assets/images/a5.jpg"
import a5 from "../assets/images/a8.jpg"
import a6 from "../assets/images/a9.jpg"
import a7 from "../assets/images/a10.jpg"
import a8 from "../assets/images/b1.jpg"
import a9 from "../assets/images/b8.jpg"
import b1 from "../assets/images/b5.jpg"
import b2 from "../assets/images/b2.jpg"
import b3 from "../assets/images/b3.jpg"
import { Link } from 'react-router-dom';


const Button = ({ children, primary, className }) => (
  <button
    className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
      primary
        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
        : 'bg-white text-purple-600 hover:bg-purple-50'
    } ${className}`}
  >
    {children}
  </button>
);

const FeatureCard = ({ icon: Icon, title, description }) => (
  <motion.div
    className="flex items-start space-x-4 p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
    whileHover={{ scale: 1.03 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <div className="flex-shrink-0">
      <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full">
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  </motion.div>
);

const CountUp = ({ end, duration }) => {
  const [count, setCount] = useState(0);
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.5,
  });

  useEffect(() => {
    if (inView) {
      controls.start({
        count: end,
        transition: { duration },
      });
    }
  }, [controls, end, inView, duration]);

  useEffect(() => {
    controls.start({
      count,
      transition: { duration: 0.1 },
    });
  }, [count, controls]);

  return (
    <motion.span
      ref={ref}
      animate={controls}
      onUpdate={({ count }) => setCount(Math.floor(count))}
    >
      {count}
    </motion.span>
  );
};

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { scrollYProgress } = useScroll();
  const yPosAnim = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const heroContent = [
    {
      title: "Find Hope in Healing",
      description: "Your journey to mental wellness starts here. We're here to support you every step of the way.",
      image: a1
    },
    {
      title: "Connect with Understanding Professionals",
      description: "Our experienced therapists are ready to listen and help you navigate through challenging times.",
      image: a2
    },
    {
      title: "Embrace a Brighter Tomorrow",
      description: "With the right tools and support, you can overcome depression and rediscover joy in life.",
      image: a3
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % heroContent.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide + 1) % heroContent.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide - 1 + heroContent.length) % heroContent.length);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      
      

      
      <section className="relative h-screen overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentSlide}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url(${heroContent[currentSlide].image})`,
                y: yPosAnim,
              }}
            />
            <div className="absolute inset-0 bg-black opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-4">
                <motion.h1
                  className="text-5xl md:text-7xl font-bold mb-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {heroContent[currentSlide].title}
                </motion.h1>
                <motion.p
                  className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  {heroContent[currentSlide].description}
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <Button primary className="mr-4">Get Started</Button>
                  <Button>Learn More</Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <button
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 p-2 rounded-full"
          onClick={prevSlide}
        >
          <ChevronLeft className="w-6 h-6 text-gray-800" />
        </button>
        <button
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-50 p-2 rounded-full"
          onClick={nextSlide}
        >
          <ChevronRight className="w-6 h-6 text-gray-800" />
        </button>
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroContent.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full ${
                index === currentSlide ? 'bg-white' : 'bg-gray-400'
              }`}
              onClick={() => setCurrentSlide(index)}
            />
          ))}
        </div>
      </section>

      
      <section id="about" className="py-20 bg-white text-gray-800">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <motion.div
                className="relative w-full h-[400px]"
                initial={{ rotateY: 0 }}
                animate={{ rotateY: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-lg transform rotate-6" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-300 to-indigo-300 rounded-lg transform -rotate-6" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-indigo-400 rounded-lg" />
                <img
                  src={a4}
                  alt="About Us"
                  className="absolute inset-0 w-full h-full object-cover rounded-lg shadow-2xl"
                />
              </motion.div>
            </div>
            <div className="md:w-1/2 md:pl-10">
              <h2 className="text-4xl font-bold mb-6">About Uplift</h2>
              <p className="text-gray-600 mb-6">
                At Uplift, we believe in the power of compassionate care and professional support to help individuals overcome depression and rediscover their inner strength. Our platform connects you with experienced therapists, valuable resources, and a supportive community, all dedicated to guiding you towards a brighter, healthier future.
              </p>
              <Button primary>Learn More <ChevronRight className="inline ml-2" /></Button>
            </div>
          </div>
        </div>
      </section>


      <section id="features" className="py-20 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">Our Features</h2>
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <img
                src={a5}
                alt="Features"
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="md:w-1/2 md:pl-10 grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeatureCard
                icon={Calendar}
                title="Book Appointments"
                description="Schedule sessions with our experienced therapists at your convenience."
              />
              <FeatureCard
                icon={FileText}
                title="Insightful Articles"
                description="Access a wealth of articles from both users and mental health professionals."
              />
              <FeatureCard
                icon={Users}
                title="Group Sessions"
                description="Join supportive group sessions led by specialized doctors."
              />
              <FeatureCard
                icon={Shield}
                title="Data Privacy"
                description="Your personal information and session details are kept strictly confidential."
              />
            </div>
          </div>
        </div>
      </section>

      
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 text-center">
            {[
              { end: 10000, label: "Users Helped" },
              { end: 500, label: "Certified Therapists" },
              { end: 1000, label: "Support Groups" },
              { end: 50000, label: "Articles Published" }
            ].map((item, index) => (
              <div key={index}>
                <motion.div
                  className="text-5xl font-bold mb-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                >
                  <CountUp end={item.end} duration={2.5} />+
                </motion.div>
                <div className="text-xl">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      
      <section id="appointments" className="py-20 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-800">Ready to Take the First Step?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Book an appointment with one of our compassionate therapists and begin your journey to healing.
          </p>
          <Link to="/doctors">
          <Button primary>Book an Appointment</Button>
          </Link>
        </div>
      </section>


      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Attend Specialized Sessions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Cognitive Behavioral Therapy", image:b1 },
              { title: "Mindfulness Meditation", image: b2 },
              { title: "Group Support Meetings", image: b3}
            ].map((session, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-lg shadow-xl overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img src={session.image} alt={session.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{session.title}</h3>
                  <p className="text-gray-600 mb-4">Join our expert-led sessions designed to provide you with effective coping strategies and support.</p>
                  <Button>Learn More</Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      
      <section id="articles" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">Explore Our Articles</h2>
          <div className="max-w-md mx-auto mb-10">
            <div className="relative">
              <input
                type="text"
                placeholder="Search articles..."
                className="w-full py-3 px-4 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600 text-gray-800"
              />
              <button className="absolute right-3 top-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Understanding Depression: Causes and Symptoms", image: a6},
              { title: "Effective Coping Strategies for Anxiety", image: a7 },
              { title: "The Power of Positive Thinking in Mental Health", image: a8}
            ].map((article, index) => (
              <motion.div
                key={index}
                className="bg-white rounded-lg shadow-xl overflow-hidden"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img src={article.image} alt={article.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">{article.title}</h3>
                  <p className="text-gray-600 mb-4">Explore insights and practical advice from our mental health experts and community members.</p>
                  <Button>Read More</Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      
      <section id="contact" className="py-20 bg-gray-100">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <img
                src={a9}
                alt="Contact Us"
                className="rounded-lg shadow-xl"
              />
            </div>
            <div className="md:w-1/2 md:pl-10">
              <h2 className="text-4xl font-bold mb-6 text-gray-800">Get in Touch</h2>
              <p className="text-gray-600 mb-6">
                We're here to listen and help. Reach out to us for any questions, concerns, or support you need.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Phone className="w-6 h-6 text-purple-600 mr-4" />
                  <span className="text-gray-700">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-6 h-6 text-purple-600 mr-4" />
                  <span className="text-gray-700">support@Uplift.com</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-6 h-6 text-purple-600 mr-4" />
                  <span className="text-gray-700">123 Healing Street, Wellness City, WC 12345</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

