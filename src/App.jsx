import { useState, useEffect } from "react";
import "./App.css";
import { Link } from "react-router-dom";
import { BarChart, Bar, PieChart, Pie, Tooltip, Cell, XAxis, YAxis, Legend, ResponsiveContainer } from 'recharts';


const API_KEY = import.meta.env.VITE_APP_PETFINDER_API_KEY;
const API_SECRET = import.meta.env.VITE_APP_PETFINDER_API_SECRET;

function App() {
  const [pets, setPets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [stats, setStats] = useState({ total: 0, avgAge: 0, typeCounts: {}, mostCommonType: {}, oldestPet: {}, youngestPet: {} });
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tokenRes = await fetch("https://api.petfinder.com/v2/oauth2/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=client_credentials&client_id=${API_KEY}&client_secret=${API_SECRET}`,
        });

        if (!tokenRes.ok) throw new Error("Failed to fetch token");
        const tokenData = await tokenRes.json();
        const accessToken = tokenData.access_token;

        const petRes = await fetch("https://api.petfinder.com/v2/animals?limit=50", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!petRes.ok) throw new Error("Failed to fetch pets");
        const petData = await petRes.json();

        const pets = petData.animals || [];

        // Age mapping for pets
        const ageMapping = {
          Baby: 0.5,
          Young: 1,
          Adult: 5,
          Senior: 10,
        };

        // Calculate statistics
        const total = pets.length;

        const avgAge = pets.reduce((sum, pet) => {
          const age = ageMapping[pet.age] || 0; // Default to 0 if age is not in the mapping
          return sum + age;
        }, 0) / (total || 1); // Avoid division by zero

        const typeCounts = pets.reduce((counts, pet) => {
          counts[pet.type] = (counts[pet.type] || 0) + 1;
          return counts;
        }, {});

        const mostCommonType = Object.entries(typeCounts).reduce(
          (max, [type, count]) => (count > max.count ? { type, count } : max),
          { type: null, count: 0 }
        );

        const oldestPet = pets.reduce((oldest, pet) => {
          const age = parseInt(pet.age, 10);
          return age > oldest.age ? { name: pet.name, age } : oldest;
        }, { name: null, age: 0 });

        const youngestPet = pets.reduce((youngest, pet) => {
          const age = parseInt(pet.age, 10);
          return age < youngest.age || youngest.age === 0 ? { name: pet.name, age } : youngest;
        }, { name: null, age: 0 });

        setPets(pets);
        setStats({
          total,
          avgAge: isNaN(avgAge) ? 0 : avgAge.toFixed(2),
          typeCounts,
          mostCommonType,
          oldestPet,
          youngestPet,
        });
      } catch (err) {
        console.error("Error fetching data:", err.message);
        setError(err.message);
      }
    };

    fetchData();
  }, []);

  const filteredPets = pets.filter(pet => {
    const matchesSearch = pet.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !typeFilter || pet.type === typeFilter;
    return matchesSearch && matchesType;
  });

  console.log("Filtered Pets:", filteredPets);

  return (
    <div className="App p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Pet Finder Dashboard</h1>

      {error && <p className="text-red-500">Error: {error}</p>}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name..."
          className="border p-2 mr-2"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />

        <select className="border p-2" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          <option value="Dog">Dog</option>
          <option value="Cat">Cat</option>
          <option value="Bird">Bird</option>
          <option value="Rabbit">Rabbit</option>
          <option value="Small & Furry">Small & Furry</option>
        </select>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold">Summary Statistics</h2>
        <p>Total Pets: {stats.total}</p>
        <p>Average Age (if numeric): {stats.avgAge}</p>
        <p>Type Distribution: {Object.entries(stats.typeCounts).map(([type, count]) => `${type}: ${count}`).join(", ")}</p>
        {stats.mostCommonType && (
          <p>Most Common Type: {stats.mostCommonType.type} ({stats.mostCommonType.count})</p>
        )}
        {stats.oldestPet && stats.oldestPet.name && (
          <p>Oldest Pet: {stats.oldestPet.name} ({stats.oldestPet.age} years old)</p>
        )}
        {stats.youngestPet && stats.youngestPet.name && (
          <p>Youngest Pet: {stats.youngestPet.name} ({stats.youngestPet.age} years old)</p>
        )}
      </div>

      {/* Visual Insights Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Visual Insights</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Type Distribution */}
          <div>
            <h3 className="text-lg font-bold mb-2">Pets by Type</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={Object.entries(stats.typeCounts).map(([type, count]) => ({ name: type, value: count }))}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {Object.keys(stats.typeCounts).map((_, index) => (
                    <Cell key={`cell-${index}`} fill={["#8884d8", "#82ca9d", "#ffc658", "#ff7f50", "#a29bfe"][index % 5]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Age Groups */}
          <div>
            <h3 className="text-lg font-bold mb-2">Pets by Age Group</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={["Baby", "Young", "Adult", "Senior"].map(age => ({
                  age,
                  count: pets.filter(pet => pet.age === age).length,
                }))}
              >
                <XAxis dataKey="age" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#4fc3f7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <ul className="grid grid-cols-1 gap-4">
        {filteredPets.slice(0, 10).map(pet => (
          <li key={pet.id} className="border rounded p-4">
            <Link to={`/pet/${pet.id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <h3 className="text-lg font-bold">{pet.name}</h3>
              <p>Type: {pet.type}</p>
              <p>Breed: {pet.breeds?.primary}</p>
              {pet.photos[0]?.medium && <img src={pet.photos[0].medium} alt={pet.name} className="mt-2 w-48" />}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;

