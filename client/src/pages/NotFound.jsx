import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page-center">
      <h2>Page not found</h2>
      <Link to="/">Back home</Link>
    </div>
  );
}
