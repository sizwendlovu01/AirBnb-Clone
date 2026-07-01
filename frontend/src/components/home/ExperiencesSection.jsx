import { Link } from 'react-router-dom';

const experiences = [
  { title: 'Online Experiences', desc: 'Join unique interactive activities led by one-of-a-kind hosts, all without leaving home.' },
  { title: 'Cooking classes', desc: 'Learn family recipes from local chefs around the world.' },
  { title: 'Photography walks', desc: 'See a city through the lens of a professional photographer.' },
];

// There's no separate "book an experience" feature in this app — every card
// leads to the same real destination (browsing all stays) rather than a
// dead-end placeholder.
export default function ExperiencesSection() {
  return (
    <section className="home-section home-section--muted">
      <div className="container">
        <h2 className="home-section__title">Discover Airbnb Experiences</h2>
        <div className="experience-grid">
          {experiences.map((exp) => (
            <Link key={exp.title} to="/locations/anywhere" className="experience-card">
              <h3>{exp.title}</h3>
              <p>{exp.desc}</p>
              <span className="experience-card__cta">Explore stays →</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
