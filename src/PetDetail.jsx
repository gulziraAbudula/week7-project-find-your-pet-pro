// PetDetail.jsx
import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const API_KEY = import.meta.env.VITE_APP_PETFINDER_API_KEY;
const API_SECRET = import.meta.env.VITE_APP_PETFINDER_API_SECRET;

function PetDetail() {
  const { id } = useParams();
  const [pet, setPet] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPet = async () => {
      try {
        const tokenRes = await fetch("https://api.petfinder.com/v2/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=client_credentials&client_id=${API_KEY}&client_secret=${API_SECRET}`,
        });

        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        const res = await fetch(`https://api.petfinder.com/v2/animals/${id}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        const data = await res.json();
        setPet(data.animal);
      } catch (err) {
        console.error(err);
        setError("Failed to load pet details");
      }
    };

    fetchPet();
  }, [id]);

  if (error) return <p>{error}</p>;
  if (!pet) return <p>Loading...</p>;

  return (
    <div className="App p-6 max-w-3xl mx-auto">
      <Link to="/">← Back to Dashboard</Link>
      <h1 className="text-2xl font-bold">{pet.name}</h1>
      <p><strong>Type:</strong> {pet.type}</p>
      <p><strong>Breed:</strong> {pet.breeds?.primary}</p>
      <p><strong>Age:</strong> {pet.age}</p>
      <p><strong>Gender:</strong> {pet.gender}</p>
      <p><strong>Status:</strong> {pet.status}</p>
      <p><strong>Description:</strong> {pet.description || "No description provided."}</p>
      {pet.photos[0]?.medium && (
        <img src={pet.photos[0].medium} alt={pet.name} className="mt-4 w-64 rounded" />
      )}
    </div>
  );
}

export default PetDetail;
