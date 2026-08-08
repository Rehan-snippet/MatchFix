import "./App.css";

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="logo">MATCH<span>FIX</span></div>

        <div className="nav-links">
          <a href="#">Home</a>
          <a href="#">Matches</a>
          <a href="#">Teams</a>
          <a href="#">Predictions</a>
        </div>

        <button className="login-btn">Sign In</button>
      </nav>

      <main>
        <section className="hero">
          <div className="hero-text">
            <p className="tag">THE HOME OF FOOTBALL</p>
            <h1>
              Where football
              <br />
              <span>meets passion.</span>
            </h1>

            <p className="subtitle">
              Follow matches, discover teams, make predictions
              and never miss a moment of the beautiful game.
            </p>

            <div className="hero-buttons">
              <button className="primary-btn">Explore Matches →</button>
              <button className="secondary-btn">Make a Prediction</button>
            </div>
          </div>

          <div className="football">
            ⚽
          </div>
        </section>

        <section className="matches">
          <div className="section-heading">
            <div>
              <p className="small-title">LIVE & UPCOMING</p>
              <h2>Featured Matches</h2>
            </div>
            <button className="view-btn">View all →</button>
          </div>

          <div className="match-grid">
            <div className="match-card">
              <div className="league">PREMIER LEAGUE</div>
              <div className="teams">
                <div>
                  <div className="team-icon">🔴</div>
                  <strong>Arsenal</strong>
                </div>

                <span className="vs">VS</span>

                <div>
                  <div className="team-icon">🔵</div>
                  <strong>Chelsea</strong>
                </div>
              </div>

              <div className="match-time">Today · 10:30 PM</div>
              <button className="predict-btn">Predict Match</button>
            </div>

            <div className="match-card">
              <div className="league">LA LIGA</div>
              <div className="teams">
                <div>
                  <div className="team-icon">⚪</div>
                  <strong>Real Madrid</strong>
                </div>

                <span className="vs">VS</span>

                <div>
                  <div className="team-icon">🔵</div>
                  <strong>Barcelona</strong>
                </div>
              </div>

              <div className="match-time">Tomorrow · 1:00 AM</div>
              <button className="predict-btn">Predict Match</button>
            </div>

            <div className="match-card">
              <div className="league">SERIE A</div>
              <div className="teams">
                <div>
                  <div className="team-icon">⚫</div>
                  <strong>Inter</strong>
                </div>

                <span className="vs">VS</span>

                <div>
                  <div className="team-icon">🔴</div>
                  <strong>Milan</strong>
                </div>
              </div>

              <div className="match-time">Tomorrow · 9:00 PM</div>
              <button className="predict-btn">Predict Match</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
export default App;
