import './globals.css';

export const metadata = {
  title: 'Listen to the City — Urban Mobility Intelligence',
  description:
    'AI-powered urban mobility intelligence for Chennai: citizen reports, news RSS and simulated social media analysed, verified and mapped.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <div className="brand">
              <span className="brand-dot" />
              <div>
                <h1>Listen to the City</h1>
                <p>AI-Powered Urban Mobility Intelligence · Chennai</p>
              </div>
            </div>
            <nav className="nav-tabs">
              <a href="#overview">Overview</a>
              <a href="#map">Live Map</a>
              <a href="#social">Social Intel</a>
              <a href="#verification">AI Verification</a>
              <a href="#analytics">Analytics</a>
              <a href="#report">Report</a>
              <a href="#news">News</a>
            </nav>
          </div>
        </header>
        <main className="container">{children}</main>
        <footer className="footer">
          <p>
            Listen to the City · Hackathon prototype. Simulated posts are clearly labelled. AI
            confidence scores are estimates, not official verification.
          </p>
        </footer>
      </body>
    </html>
  );
}
