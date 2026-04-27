import { useEffect, useState } from 'react';

export default function App() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Cannot connect to backend');
        }
        return res.json();
      })
      .then((data) => setHealth(data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main className="container">
      <h1>AI Content Detection App</h1>
      <p>Spring Boot + React project initialized successfully.</p>

      <section className="status-card">
        <h2>Backend Status</h2>
        {!health && !error && <p>Checking backend...</p>}
        {health && <pre>{JSON.stringify(health, null, 2)}</pre>}
        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}
