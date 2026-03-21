import { Link } from 'react-router-dom';
import { FiCalendar, FiShield, FiClock, FiUsers, FiHeart, FiStar } from 'react-icons/fi';
import { RiStethoscopeLine } from 'react-icons/ri';
import './Home.css';

const Home = () => {
  const features = [
    { icon: <RiStethoscopeLine />, title: 'Find Top Doctors', desc: 'Browse verified specialists across every field of medicine.' },
    { icon: <FiCalendar />, title: 'Easy Booking', desc: 'Book appointments instantly with real-time slot availability.' },
    { icon: <FiShield />, title: 'Secure Records', desc: 'Your medical records are encrypted and safely stored.' },
    { icon: <FiClock />, title: 'Smart Scheduling', desc: 'AI-powered scheduling prevents conflicts and optimizes time.' },
    { icon: <FiUsers />, title: 'Patient Dashboard', desc: 'Track your appointments, prescriptions, and health journey.' },
    { icon: <FiHeart />, title: 'Quality Care', desc: 'Rated doctors ensuring you receive the best healthcare.' }
  ];

  const stats = [
    { value: '500+', label: 'Verified Doctors' },
    { value: '50K+', label: 'Happy Patients' },
    { value: '100K+', label: 'Appointments' },
    { value: '4.9', label: 'Average Rating' }
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
        </div>
        <div className="container hero-content">
          <div className="hero-text animate-fade-in">
            <div className="hero-badge">
              <FiStar /> #1 Healthcare Platform
            </div>
            <h1>Your Health, Our <span className="gradient-text">Priority</span></h1>
            <p className="hero-subtitle">
              Connect with world-class doctors, book appointments effortlessly, 
              and manage your entire health journey — all in one place.
            </p>
            <div className="hero-actions">
              <Link to="/doctors" className="btn btn-primary btn-lg">
                <RiStethoscopeLine /> Find a Doctor
              </Link>
              <Link to="/register" className="btn btn-secondary btn-lg">
                Get Started Free
              </Link>
            </div>
          </div>
          <div className="hero-stats">
            {stats.map((stat, i) => (
              <div key={i} className="stat-card glass" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose DoctorConnect?</h2>
          <p className="section-subtitle">
            Everything you need for a seamless healthcare experience
          </p>
          <div className="features-grid">
            {features.map((feature, i) => (
              <div key={i} className="feature-card card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card glass">
            <h2>Ready to Take Control of Your Health?</h2>
            <p>Join thousands of patients who trust DoctorConnect for their healthcare needs.</p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-accent btn-lg">
                Create Free Account
              </Link>
              <Link to="/doctors" className="btn btn-secondary btn-lg">
                Browse Doctors
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <RiStethoscopeLine className="footer-icon" />
            <span>DoctorConnect</span>
          </div>
          <p className="footer-text">© 2024 DoctorConnect. Built with ❤️ using Microservices Architecture.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
