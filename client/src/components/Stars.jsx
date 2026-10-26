// Star rating. Read-only by default; pass onChange to make it an input.
export default function Stars({ value = 0, onChange, size = '1rem' }) {
  return (
    <span className="stars" style={{ fontSize: size }} role={onChange ? 'radiogroup' : undefined}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        return onChange ? (
          <button
            key={n}
            type="button"
            className={`star-btn ${filled ? 'filled' : ''}`}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            aria-checked={n === value}
            role="radio"
            onClick={() => onChange(n)}
          >
            ★
          </button>
        ) : (
          <span key={n} className={filled ? 'filled' : ''}>
            ★
          </span>
        );
      })}
    </span>
  );
}
