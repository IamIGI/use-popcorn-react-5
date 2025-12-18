import { useEffect, useState } from 'react';

const API_KEY = '5fc49b40';

export function useMovies(query) {
  const [movies, setMovies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMovies(query, controller) {
      try {
        setIsLoading(true);
        setError('');
        await fetch(`http://www.omdbapi.com/?apikey=${API_KEY}&s=${query}`, { signal: controller.signal })
          .then(async (res) => {
            if (!res.ok) throw new Error('Something went wrong with fetching movies');
            return await res.json();
          })
          .then((data) => {
            console.log(data);
            if (data.Response === 'False') throw new Error('Movie not found');
            setMovies(data.Search);
          });
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    if (!query.length) {
      setMovies([]);
      setError('');
      return;
    }

    fetchMovies(query, controller);

    return () => {
      controller.abort();
    };
  }, [query]);

  return { movies, isLoading, error };
}
