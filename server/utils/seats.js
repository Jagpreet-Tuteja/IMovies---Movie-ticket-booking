// Seat labels look like "A1", "C12": a row letter followed by the seat number

const rowLabel = (index) => String.fromCharCode(65 + index);

function allSeats(rows, seatsPerRow) {
  const seats = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 1; c <= seatsPerRow; c++) seats.push(rowLabel(r) + c);
  }
  return seats;
}

// Sorts A2 before A10
function compareSeats(a, b) {
  return a[0] === b[0] ? Number(a.slice(1)) - Number(b.slice(1)) : a.localeCompare(b);
}

module.exports = { allSeats, compareSeats, LOCK_MINUTES: 5, MAX_SEATS_PER_BOOKING: 10 };
