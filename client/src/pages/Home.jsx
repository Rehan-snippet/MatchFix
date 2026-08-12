import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="hero">
      <h1>
        Book a turf. Buy your gear.
        <br />
        All in one place.
      </h1>
      <p className="hero-sub">
        MatchFix connects local football organizers, gear sellers, and players who just want to play.
      </p>
      <div className="hero-actions">
        <Link to="/turfs" className="btn btn-primary">
          Find a turf
        </Link>
        <Link to="/marketplace" className="btn btn-outline">
          Shop gear
        </Link>
      </div>

      <div className="hero-grid">
        <div className="hero-card">
          <h3>Organizers</h3>
          <p>List your turfs and fields, set pricing rules per day/time, and manage bookings.</p>
        </div>
        <div className="hero-card">
          <h3>Sellers</h3>
          <p>List football gear, manage stock, and fulfil orders from one dashboard.</p>
        </div>
        <div className="hero-card">
          <h3>Players</h3>
          <p>One account for booking pitches and ordering gear — rate turfs and products after use.</p>
        </div>
      </div>
    </div>
  );
}
