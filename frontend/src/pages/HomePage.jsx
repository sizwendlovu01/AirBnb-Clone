import HeroBanner from '../components/home/HeroBanner.jsx';
import InspirationSection from '../components/home/InspirationSection.jsx';
import ExperiencesSection from '../components/home/ExperiencesSection.jsx';
import ThingsToDoSection from '../components/home/ThingsToDoSection.jsx';
import ShopAirbnbSection from '../components/home/ShopAirbnbSection.jsx';
import FutureGetaways from '../components/home/FutureGetaways.jsx';
import '../components/home/Home.css';

export default function HomePage() {
  return (
    <>
      <HeroBanner />
      <InspirationSection />
      <ExperiencesSection />
      <ThingsToDoSection
        title="Things to do on your trip"
        buttonText="Find things to do"
        seed="trip-things"
      />
      <ThingsToDoSection
        title="Things to do at home"
        buttonText="Explore experiences"
        seed="home-things"
      />
      <ShopAirbnbSection />
      <FutureGetaways />
    </>
  );
}
