import React from 'react'
import Search from './components/Search.jsx'
import Spinner from './components/Spinner.jsx'
import { useState, useEffect } from 'react'
import MovieCard from './components/MovieCard.jsx'
import {useDebounce} from 'react-use';
import { updateSearchCount } from './appwrite.js'

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // State to hold movie data
  const [movieList, setMovieList] = useState([]);
  // State to manage loading state
  const [isLoading, setIsLoading] = useState(false);

  // useState to continously update and debounce the search term to prevent making too many API requests
  // updating every 500ms, and dependency as [searchTerm] to update when searchTerm changes
  // We don't have to make our own method, just used something thats already available such as debounce.
  // Don't just say you implemented a search function ->
  // Explain that you built an optimized search solution that improves performance by debouncing the input field.
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm]);

  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try{ //if query is empty, fetch popular movies, otherwise search using base URL, and encode to protect against weird characters
      const endpoint = query ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);
      // Check if the response is ok (status in the range 200-299)
      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      // Parse the JSON response
      const data = await response.json();
      
      if(data.response === 'False') {
        setErrorMessage(data.error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);
      if(query && data.results.length > 0){
        // If a search term is provided and results are found, update the search count
        await updateSearchCount(query, data.results[0]);
      }

    } catch (error) {
      console.error(`Error fetching movies: ${error}'`);
      setErrorMessage('Error fetching movies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  //Install npm i react-use to use a debounce to optimize http requests
  // This will delay the API call until the user stops typing because when starting to type say Dark knight, we don't
  // Want to make a request for each letter typed, like "D", then "Da", etc.
  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  return ( 
    <main>
      <div className='pattern' />

      <div className='wrapper'>
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without the Hassle</h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm}/>
        </header>
       
        <section className='all-movies'>
          <h2 className="mt-[40px]">All Movies</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className='text-red-500'>{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie}/>
              ))}
            </ul>
          )}
        </section>
      </div>
      
    </main> 
  )
}
 
export default App
