import { Link } from 'react-router-dom';
import { imageForSeed } from '../../data/destinations';

export default function ThingsToDoSection({ title, buttonText, seed }) {
  return (
    <section
      className="things-todo"
      style={{ backgroundImage: `url(${imageForSeed(seed, 9)})` }}
    >
      <div className="things-todo__overlay">
        <h2>{title}</h2>
        <Link to="/locations/anywhere" className="btn btn-outline things-todo__btn">
          {buttonText}
        </Link>
      </div>
    </section>
  );
}
