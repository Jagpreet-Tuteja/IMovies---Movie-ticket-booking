// Resets the database with sample data. Run: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/adminModel');
const User = require('./models/userModel');
const Movie = require('./models/movieModel');
const Theatre = require('./models/theatreModel');
const Show = require('./models/showModel');
const Seat = require('./models/seatModel');
const Booking = require('./models/bookingModel');
const Payment = require('./models/paymentModel');
const Review = require('./models/reviewModel');
const Favorite = require('./models/favoriteModel');
const { refreshMovieRating } = require('./controllers/reviewController');

const ADMIN = { name: 'IMovies Admin', email: 'admin@imovies.com', password: 'admin123' };
const DEMO_USER = { name: 'Sarah Kapoor', email: 'user@imovies.com', phone: '9876543210', city: 'Mumbai', password: 'user123' };

const movies = [
  {
    title: 'Interstellar',
    genres: ['Sci-Fi', 'Drama'],
    language: 'English',
    durationMins: 169,
    certificate: 'UA',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'],
    description: "A team of explorers travel through a wormhole in space to ensure humanity's survival.",
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    releaseDate: '2014-11-07',
  },
  {
    title: 'Inception',
    genres: ['Sci-Fi', 'Thriller'],
    language: 'English',
    durationMins: 148,
    certificate: 'UA',
    director: 'Christopher Nolan',
    cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
    description: 'A thief who steals secrets through dream-sharing is given a chance at redemption.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    releaseDate: '2010-07-16',
  },
  {
    title: 'The Dark Knight',
    genres: ['Action', 'Crime', 'Drama'],
    language: 'English',
    durationMins: 152,
    certificate: 'UA',
    director: 'Christopher Nolan',
    cast: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'],
    description: 'Batman faces the Joker, a criminal mastermind who wants to plunge Gotham City into anarchy.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    releaseDate: '2008-07-18',
  },
  {
    title: '3 Idiots',
    genres: ['Comedy', 'Drama'],
    language: 'Hindi',
    durationMins: 170,
    certificate: 'U',
    director: 'Rajkumar Hirani',
    cast: ['Aamir Khan', 'R. Madhavan', 'Sharman Joshi', 'Kareena Kapoor'],
    description: 'Two friends search for their long-lost companion and revisit their college days.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/66A9MqXOyVFCssoloscw79z8Tew.jpg',
    releaseDate: '2009-12-25',
  },
  {
    title: 'Spider-Man: Into the Spider-Verse',
    genres: ['Animation', 'Action'],
    language: 'English',
    durationMins: 117,
    certificate: 'U',
    director: 'Bob Persichetti, Peter Ramsey, Rodney Rothman',
    cast: ['Shameik Moore', 'Jake Johnson', 'Hailee Steinfeld'],
    description: 'Teen Miles Morales becomes the Spider-Man of his universe and meets his multiverse counterparts.',
    posterUrl: 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg',
    releaseDate: '2018-12-14',
  },
];

const theatres = [
  { name: 'PVR Phoenix Palladium', city: 'Mumbai', address: 'Lower Parel, Mumbai', screens: 3 },
  { name: 'Cinepolis Andheri', city: 'Mumbai', address: 'Andheri West, Mumbai', screens: 2 },
  { name: 'INOX Nehru Place', city: 'Delhi', address: 'Nehru Place, New Delhi', screens: 2 },
  { name: 'PVR Forum Mall', city: 'Bengaluru', address: 'Koramangala, Bengaluru', screens: 3 },
];

// Four slots 3.5+ hours apart, so the longest movie plus cleaning time never overlaps the next slot
const SLOTS = [10, 13.75, 17.5, 21.25];
const DAYS = 3;
const BASE_PRICE = [180, 220, 250, 200];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all(
    [Admin, User, Movie, Theatre, Show, Seat, Booking, Payment, Review, Favorite].map((m) => m.deleteMany())
  );

  await Admin.create(ADMIN);
  const user = await User.create(DEMO_USER);
  const createdMovies = await Movie.insertMany(movies);
  const createdTheatres = await Theatre.insertMany(theatres);

  const shows = [];
  for (let day = 1; day <= DAYS; day++) {
    createdTheatres.forEach((theatre, t) => {
      for (let screen = 1; screen <= theatre.screens; screen++) {
        SLOTS.forEach((hour, s) => {
          const start = new Date();
          start.setDate(start.getDate() + day);
          start.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
          shows.push({
            movie: createdMovies[(day + t + screen + s) % createdMovies.length]._id,
            theatre: theatre._id,
            screen,
            startTime: start,
            price: BASE_PRICE[t] + (hour >= 17 ? 50 : 0), // evening shows cost more
          });
        });
      }
    });
  }
  await Show.insertMany(shows);

  await Review.insertMany([
    { user: user._id, movie: createdMovies[0]._id, rating: 5, comment: 'Mind-blowing visuals and that soundtrack!' },
    { user: user._id, movie: createdMovies[3]._id, rating: 4, comment: 'Funny and emotional. All izz well!' },
  ]);
  await Promise.all(createdMovies.map((m) => refreshMovieRating(m._id)));
  await Favorite.create({ user: user._id, movie: createdMovies[1]._id });

  console.log(`Seeded ${createdMovies.length} movies, ${createdTheatres.length} theatres and ${shows.length} shows.`);
  console.log(`Admin login: ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`Demo user:   ${DEMO_USER.email} / ${DEMO_USER.password}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
