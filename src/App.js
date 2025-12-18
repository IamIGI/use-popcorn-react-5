import { useEffect, useReducer, useRef, useState } from 'react';
import NavBar from './NavBar';
import Main from './Main';
import StarRating from './components/StarRating';

const API_KEY = '5fc49b40';

export default function App() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [watched, setWatched] = useState(() => {
    const storedValue = localStorage.getItem('watched');
    if (storedValue) return JSON.parse(storedValue);
    return [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);

  // useEffect(() => console.log('After render, cuz no dependencies array is provided'));
  // console.log('During render');

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
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelectMovie(id) {
    setSelectedId((selectedId) => (selectedId === id ? null : id));
  }

  function handleCloseMovie() {
    setSelectedId(null);
  }

  function handleAddWatched(movie) {
    setWatched((watched) => {
      const isIncluded = watched.find((watchedMovie) => watchedMovie.imdbID === movie.imdbID);
      // console.log('t1- handleAddWatched: ', watched);
      const newWatchedValue = isIncluded ? watched : [...watched, movie];
      // localStorage.setItem('watched', JSON.stringify(newWatchedValue));

      return newWatchedValue;
    });
  }

  function handleDeleteWatched(id) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id));
  }

  useEffect(() => {
    localStorage.setItem('watched', JSON.stringify(watched));
  }, [watched]);

  useEffect(() => {
    if (!query.length) {
      setMovies([]);
      setError('');
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      handleCloseMovie();
      fetchMovies(query, controller);
    }, 500); // 0.5s

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    }; //cancel previous timeout if query changes
  }, [query]);

  return (
    <>
      <NavBar>
        <Search query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {!isLoading && !error && <MovieList movies={movies} onSelectMovie={handleSelectMovie} />}
          {error && <ErrorMessage msg={error} />}
        </Box>
        <Box>
          {selectedId ? (
            <MovieDetails selectedId={selectedId} onCloseMovie={handleCloseMovie} onAddWatched={handleAddWatched} />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMovieList watched={watched} onDeleteWatched={handleDeleteWatched} />
            </>
          )}
        </Box>
        {/* <WatchedBox /> */}
      </Main>
    </>
  );
}

function Loader() {
  return <p className="loader">Loading...</p>;
}

function ErrorMessage({ msg }) {
  return (
    <p className="error">
      <span>
        🙈 Error:
        <br /> {msg}
      </span>
    </p>
  );
}

function MovieList({ movies, onSelectMovie }) {
  return (
    <ul className="list list-movies ">
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  );
}

function Movie({ movie, onSelectMovie }) {
  return (
    <li onClick={() => onSelectMovie(movie.imdbID)}>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>🗓</span>
          <span>{movie.Year}</span>
        </p>
      </div>
    </li>
  );
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? '–' : '+'}
      </button>
      {isOpen && children}
    </div>
  );
}

// function WatchedBox() {

//   const [isOpen2, setIsOpen2] = useState(true);

//   return (
//     <div className="box">
//       <button className="btn-toggle" onClick={() => setIsOpen2((open) => !open)}>
//         {isOpen2 ? '–' : '+'}
//       </button>
//       {isOpen2 && (
//         <>
//           <WatchedSummary watched={watched} />
//           <WatchedMovieList watched={watched} />
//         </>
//       )}
//     </div>
//   );
// }

const average = (arr) => arr.reduce((acc, cur, i, arr) => acc + cur / arr.length, 0);

function WatchedSummary({ watched }) {
  const avgImdbRating = average(watched.map((movie) => movie.imdbRating)).toFixed(2);
  const avgUserRating = average(watched.map((movie) => movie.userRating)).toFixed(2);
  const avgRuntime = average(watched.map((movie) => movie.runtime));

  return (
    <div className="summary">
      <h2>Movies you watched</h2>
      <div>
        <p>
          <span>#️⃣</span>
          <span>{watched.length} movies</span>
        </p>
        <p>
          <span>⭐️</span>
          <span>{avgImdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{avgUserRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{avgRuntime} min</span>
        </p>
      </div>
    </div>
  );
}

function WatchedMovieList({ watched, onDeleteWatched }) {
  return (
    <ul className="list">
      {watched.map((movie) => (
        <WatchedMovie movie={movie} key={movie.imdbID} onDeleteWatched={onDeleteWatched} />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, onDeleteWatched }) {
  return (
    <li>
      <img src={movie.Poster} alt={`${movie.Title} poster`} />
      <h3>{movie.Title}</h3>
      <div>
        <p>
          <span>⭐️</span>
          <span>{movie.imdbRating}</span>
        </p>
        <p>
          <span>🌟</span>
          <span>{movie.userRating}</span>
        </p>
        <p>
          <span>⏳</span>
          <span>{movie.runtime} min</span>
        </p>
        <button className="btn-delete" onClick={() => onDeleteWatched(movie.imdbID)}>
          X
        </button>
      </div>
    </li>
  );
}

function Search({ query, setQuery }) {
  const inputEl = useRef(null);

  useEffect(() => {
    function handleEnterKey(e) {
      if (document.activeElement === inputEl) return;

      if (e.code === 'Enter') {
        inputEl.current.focus();
        setQuery('');
      }
    }
    //Focus on input when component mounts
    inputEl.current.focus();
    document.addEventListener('keydown', (e) => handleEnterKey(e));

    return () => document.removeEventListener('keydown', (e) => handleEnterKey(e));
  }, [setQuery]);

  return (
    <input
      className="search"
      type="text"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      ref={inputEl}
    />
  );
}

function NumResults({ movies }) {
  return (
    <p className="num-results">
      Found <strong>{movies.length}</strong> results
    </p>
  );
}

function MovieDetails({ selectedId, onCloseMovie, onAddWatched }) {
  const [movie, setMovie] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [userRating, setUserRating] = useState('');

  const countRef = useRef(0);

  useEffect(() => {
    if (userRating) countRef.current++;
  }, [userRating]);

  async function getMovieDetails(id) {
    setIsLoading(true);
    await fetch(`http://www.omdbapi.com/?&apikey=${API_KEY}&i=${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Something went wrong with fetching movieId: ', id);
        return await res.json();
      })
      .then((data) => {
        console.log(data);
        if (data.Response === 'False') throw new Error('Movie not found');
        setMovie(data);
        setIsLoading(false);
      });
  }

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      Title: movie.Title,
      year: movie.Year,
      Poster: movie.Poster,
      imdbRating: Number(movie.imdbRating),
      Runtime: Number(movie.Runtime.split(' ').at(0)),
      userRating,
      countRatingDecisions: countRef.current,
    };

    onAddWatched(newWatchedMovie);
    onCloseMovie();
  }

  useEffect(() => {
    getMovieDetails(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (!movie.Title) return;
    document.title = `Movie | ${movie.Title}`;

    return () => (document.title = 'usePopcorn');
  }, [movie]);

  useEffect(() => {
    function handleEscKey(e) {
      if (e.code === 'Escape') {
        onCloseMovie();
        console.log('CLOSING');
      }
    }

    document.addEventListener('keydown', (e) => handleEscKey(e));

    return () => document.removeEventListener('keydown', (e) => handleEscKey(e));
  }, [onCloseMovie]);

  return (
    <div className="details">
      {isLoading ? (
        <Loader />
      ) : (
        <>
          <header>
            <button className="btn-back" onClick={onCloseMovie}>
              ❌
            </button>
            <img src={movie.Poster} alt={`Poster of ${movie} movie`} />
            <div className="details-overview">
              <h2>{movie.Title}</h2>
              <p>
                {movie.Release} &bull; {movie.Runtime}
              </p>
              <p>{movie.Genre} </p>
              <p>✭{movie.imdbRating} IMDb rating</p>
            </div>
          </header>
          <section>
            <div className="rating">
              <StarRating maxRating={10} size={24} onSetRating={setUserRating} />
              {userRating > 0 && (
                <button className="btn-add" onClick={handleAdd}>
                  Add to list
                </button>
              )}
            </div>
            <p>
              <em>{movie.Plot}</em>
            </p>
            <p>Starring {movie.Actors}</p>
            <p>Directed by {movie.Director}</p>
          </section>
        </>
      )}
    </div>
  );
}
