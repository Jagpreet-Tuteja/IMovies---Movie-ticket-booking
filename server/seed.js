// Resets the database with sample data. Run: npm run seed
require('dotenv').config();
const crypto = require('crypto');
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

// The admin password comes from ADMIN_PASSWORD. On a public deployment without it, a random password
// is used so the well-known demo password never works there; set ADMIN_PASSWORD to log in.
const ADMIN_EMAIL = 'admin@imovies.com';
const isDeployed = Boolean(process.env.VERCEL) || process.env.NODE_ENV === 'production';
const ADMIN = {
  name: 'IMovies Admin',
  email: ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD || (isDeployed ? crypto.randomBytes(24).toString('hex') : 'admin123'),
};
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
const DAYS_AHEAD = 7;
const BASE_PRICE = [180, 220, 250, 200];

// All sample theatres are in India, so showtimes are planned in IST whatever the server's timezone
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
function istDayStart(daysFromToday) {
  const nowIst = new Date(Date.now() + IST_OFFSET_MS);
  return new Date(
    Date.UTC(nowIst.getUTCFullYear(), nowIst.getUTCMonth(), nowIst.getUTCDate() + daysFromToday) - IST_OFFSET_MS
  );
}

// Schedules shows for every day of the coming week that has none yet. Safe to run repeatedly,
// which keeps a long-running demo bookable.
async function scheduleUpcomingShows() {
  const [allMovies, allTheatres] = await Promise.all([
    Movie.find().sort({ createdAt: 1 }),
    Theatre.find().sort({ createdAt: 1 }),
  ]);
  if (!allMovies.length || !allTheatres.length) return 0;

  const shows = [];
  for (let day = 1; day <= DAYS_AHEAD; day++) {
    const dayStart = istDayStart(day);
    const dayEnd = istDayStart(day + 1);
    if (await Show.exists({ startTime: { $gte: dayStart, $lt: dayEnd } })) continue;

    allTheatres.forEach((theatre, t) => {
      for (let screen = 1; screen <= theatre.screens; screen++) {
        SLOTS.forEach((hour, s) => {
          shows.push({
            movie: allMovies[(day + t + screen + s) % allMovies.length]._id,
            theatre: theatre._id,
            screen,
            startTime: new Date(dayStart.getTime() + hour * 60 * 60 * 1000),
            price: BASE_PRICE[t % BASE_PRICE.length] + (hour >= 17 ? 50 : 0), // evening shows cost more
          });
        });
      }
    });
  }
  if (shows.length) await Show.insertMany(shows);
  return shows.length;
}

// Everything except the admin account
async function createSampleData() {
  const user = await User.create(DEMO_USER);
  const createdMovies = await Movie.insertMany(movies);
  await Theatre.insertMany(theatres);
  const showCount = await scheduleUpcomingShows();

  await Review.insertMany([
    { user: user._id, movie: createdMovies[0]._id, rating: 5, comment: 'Mind-blowing visuals and that soundtrack!' },
    { user: user._id, movie: createdMovies[3]._id, rating: 4, comment: 'Funny and emotional. All izz well!' },
  ]);
  await Promise.all(createdMovies.map((m) => refreshMovieRating(m._id)));
  await Favorite.create({ user: user._id, movie: createdMovies[1]._id });
  return showCount;
}

// Wipes the database and loads fresh sample data (npm run seed)
async function resetDatabase() {
  await Promise.all(
    [Admin, User, Movie, Theatre, Show, Seat, Booking, Payment, Review, Favorite].map((m) => m.deleteMany())
  );
  await Admin.create(ADMIN);
  return createSampleData();
}

// Loads sample data into a brand-new, empty database only. The server calls this on startup,
// so a fresh deployment works without running the seed script by hand.
async function seedIfEmpty() {
  if ((await Admin.exists({})) || (await Movie.exists({}))) return false;
  await Admin.init(); // make sure the unique email index exists
  try {
    // If several server instances start at once, only the first one gets past this line
    await Admin.create(ADMIN);
  } catch (err) {
    if (err.code === 11000) return false;
    throw err;
  }
  await createSampleData();
  console.log('Empty database detected: loaded sample data');
  return true;
}

module.exports = { seedIfEmpty, scheduleUpcomingShows, ADMIN_EMAIL };

if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI || process.env.MONGODB_URI)
    .then(resetDatabase)
    .then(async (showCount) => {
      console.log(`Seeded ${movies.length} movies, ${theatres.length} theatres and ${showCount} shows.`);
      console.log(`Admin login: ${ADMIN.email} / ${ADMIN.password}`);
      console.log(`Demo user:   ${DEMO_USER.email} / ${DEMO_USER.password}`);
      await mongoose.disconnect();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
