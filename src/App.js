import "./App.css";
import "./querys.css";
import { useEffect, useState } from "react";
import StarRating from "./StarComponent";
const KEY = import.meta.env.KEY;

const average = (arr) =>
  arr.reduce((acc, cur, _, arr) => acc + cur / arr.length, 0);

/* ------------------------------------------------------------- */
/* ---------------------------App------------------------------- */
/* ------------------------------------------------------------- */

export default function App() {
  const storedMovies = JSON.parse(localStorage.getItem("movies"));

  const [movieList, setMovieList] = useState([]);
  const [watchedMovies, setWatchedMovies] = useState(storedMovies);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  localStorage.setItem("movies", JSON.stringify(watchedMovies));

  function deleteMovie(id) {
    const newWatched = watchedMovies.filter((obj) => obj.imdbID !== id);
    setWatchedMovies(newWatched);
  }

  function handleAddWatched(newMovie) {
    setWatchedMovies((movies) => [...movies, newMovie]);
  }

  function handleCloseMovieDetails() {
    setSelectedId(null);
  }

  function handleSelectMovie(id) {
    setSelectedId((curId) => (id === curId ? null : id));
  }

  useEffect(
    function () {
      const controller = new AbortController();

      async function getMoviesFromSearch() {
        try {
          setIsLoading(true);
          setError(false);

          const response = await fetch(
            `http://www.omdbapi.com/?apikey=${KEY}&s=${query}`,
            { signal: controller.signal }
          );
          if (!response.ok) throw new Error("Could not find movie");

          const data = await response.json();

          if (data.Response === "False") throw new Error("Movie not found");

          setMovieList(data.Search);
          setError("");
          handleCloseMovieDetails();
        } catch (err) {
          if (err.name !== "AbortError") {
            setError(err.message);
          }
        } finally {
          setIsLoading(false);
        }
      }

      if (query.length < 3) {
        setMovieList([]);
        setError("");
        return;
      }

      getMoviesFromSearch();

      return function () {
        controller.abort();
      };
    },
    [query]
  );

  return (
    <div className="App">
      <Header>
        <SearchBar setQuery={setQuery} query={query} />
        <Results movieList={movieList} />
      </Header>
      <Main>
        <Box>
          {isLoading && <Loader />}
          {error && <ErrorMessage msg={error} />}
          {!isLoading &&
            !error &&
            movieList.map((movie, i) => (
              <Movie
                movie={movie}
                handleSelectMovie={handleSelectMovie}
                key={movie.imdbID}
              />
            ))}
        </Box>
        <Box>
          {!selectedId ? (
            <>
              <Summary watchedMovies={watchedMovies} />
              <WatchedMovieList
                watchedMovies={watchedMovies}
                deleteMovie={deleteMovie}
              />
            </>
          ) : (
            <MovieDetails
              selectedId={selectedId}
              onHandleCloseMovieDetails={handleCloseMovieDetails}
              handleAddWatched={handleAddWatched}
              watchedMovies={watchedMovies}
            />
          )}
        </Box>
      </Main>
      <Footer />
    </div>
  );
}

/* ------------------------------------------------------------- */
/* ---------------------------Navbar---------------------------- */
/* ------------------------------------------------------------- */

function Header({ children }) {
  return (
    <nav className="navbar-container">
      <p className="navbar-title">
        <img src="apple-touch-icon.png" className="logo" alt="logo" />
        <span>Cinemania</span>
      </p>
      {children}
    </nav>
  );
}

function SearchBar({ query, setQuery }) {
  return (
    <input
      className="navbar-searchbar"
      placeholder="Search movies..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
}

function Results({ movieList }) {
  return <p className="navbar-results">Found {movieList.length} results</p>;
}

/* ------------------------------------------------------------- */
/* ----------------------------Main----------------------------- */
/* ------------------------------------------------------------- */

function Main({ children }) {
  return <main className="main-container">{children}</main>;
}

function Box({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="box-container">
      <button className="btn-toggle" onClick={() => setIsOpen((open) => !open)}>
        {isOpen ? "−" : "+"}
      </button>
      <ul className="list-movies">{isOpen && children}</ul>
    </div>
  );
}

function Movie({ handleSelectMovie, movie }) {
  return (
    <li
      className="movie-container"
      onClick={() => handleSelectMovie(movie.imdbID)}
    >
      <img src={movie.Poster} className="movie-poster" alt="poster" />
      <div className="movie-information-container">
        <p className="movie-title">{movie.Title}</p>
        <p className="movie-year">
          <span>📅</span>
          {movie.Year}
        </p>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------- */
/* --------------------------Right-Box-------------------------- */
/* ------------------------------------------------------------- */

function Summary({ watchedMovies }) {
  const averageRating = average(watchedMovies.map((obj) => obj.imdbRating));
  const averageUserRating = average(watchedMovies.map((obj) => obj.userRating));
  const averageTime = average(watchedMovies.map((obj) => obj.runtime));

  return (
    <div className="summary-container">
      <h2>
        <em>MOVIES YOU WATCHED</em>
      </h2>
      <div className="sumamry-information-container">
        <p>
          <span>🔢</span>
          <span>{watchedMovies.length} movies</span>
        </p>

        <p>
          <span>⭐</span>
          <span>{averageRating.toFixed(1)}</span>
        </p>

        <p>
          <span>🌟</span>
          <span>{averageUserRating.toFixed(1)}</span>
        </p>

        <p>
          <span>⏳</span>
          <span>{averageTime.toFixed(1)}</span>
        </p>
      </div>
    </div>
  );
}

function MovieDetails({
  onHandleCloseMovieDetails,
  selectedId,
  handleAddWatched,
  watchedMovies,
}) {
  const [userRating, setUserRating] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSelectedMovieInfo, currentSetSelectedMovieInfo] = useState({});
  const isWatched = watchedMovies
    .map((movie) => movie.imdbID)
    .includes(selectedId);

  const {
    Title: title,
    Poster: poster,
    Runtime: runtime,
    imdbRating,
    Plot: plot,
    Released: released,
    Actors: actors,
    Director: director,
    Genre: genre,
  } = currentSelectedMovieInfo;

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ").at(0)),
      userRating,
    };
    handleAddWatched(newWatchedMovie);
    onHandleCloseMovieDetails();
  }

  useEffect(
    function () {
      try {
        async function getMovieDetails() {
          setIsLoading(true);
          setUserRating("");

          const res = await fetch(
            `http://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`
          );

          setIsLoading(false);
          const data = await res.json();

          if (data.Response === "False") return;
          currentSetSelectedMovieInfo(data);
        }
        getMovieDetails();
      } catch (err) {
        if (err.name !== "AbortError") {
          console.log(err.message);
        }
      }
    },
    [selectedId, currentSetSelectedMovieInfo]
  );

  return (
    <>
      {isLoading && <Loader />}
      {!isLoading && (
        <>
          <div className="movie-details-container">
            <img src={poster} alt="movie" />
            <div>
              <h3>{title}</h3>
              <p>
                {released} - {runtime}
              </p>
              <p>{genre}</p>
              <p>⭐ {imdbRating} IMDb rating</p>
            </div>
            <button className="btn-back" onClick={onHandleCloseMovieDetails}>
              &larr;
            </button>
          </div>
          <div className="starrating-container">
            {!isWatched ? (
              <>
                {" "}
                <StarRating
                  maxRating={10}
                  size={26}
                  onSetRating={setUserRating}
                />
                {userRating && (
                  <button className="btn-add" onClick={() => handleAdd()}>
                    Add to list
                  </button>
                )}
              </>
            ) : (
              <p>
                You have already rated this movie {userRating}
                <span>🌟</span>
              </p>
            )}
          </div>
          <div className="movie-details-specifics-container">
            <em>
              <p>{plot}</p>
            </em>
            <em>
              <p>Starring {actors}</p>
            </em>
            <em>
              <p>Directed by {director}</p>
            </em>
          </div>
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------- */
/* ----------------------Watched-Movie-List----------------------*/
/* ------------------------------------------------------------- */

function WatchedMovieList({ watchedMovies, deleteMovie }) {
  return (
    <ul className="watched-movie-list-container">
      {watchedMovies.map((movies, i) => (
        <WatchedMovie key={i} movie={movies} deleteMovie={deleteMovie} />
      ))}
    </ul>
  );
}

function WatchedMovie({ movie, deleteMovie }) {
  return (
    <li className="rated-movie">
      <img src={movie.poster} alt="profile" />
      <div className="rated-movie-info">
        <h3>{movie.Title}</h3>
        <div className="rating-container">
          <p>⭐ {movie.imdbRating}</p>
          <p>🌟 {movie.userRating}</p>
          <p>⌛ {movie.runtime} min</p>
        </div>
      </div>
      <button className="btn-delete" onClick={() => deleteMovie(movie.imdbID)}>
        X
      </button>
    </li>
  );
}

/* ------------------------------------------------------------- */
/* ---------------------------Footer---------------------------- */
/* ------------------------------------------------------------- */

function Footer() {
  return (
    <footer className="footer-container">
      <p>Copyright &copy; 2024 Viktor Abrahamsson</p>
    </footer>
  );
}
/* ------------------------------------------------------------- */
/* ---------------------Visual-Messages------------------------- */
/* ------------------------------------------------------------- */

function Loader() {
  return <p className="helper-message">Loading...</p>;
}

function ErrorMessage({ msg }) {
  return <p className="helper-message">❌ {msg}</p>;
}
