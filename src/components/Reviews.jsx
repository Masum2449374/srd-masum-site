import { useMemo, useState } from "react";
import { Star, ChatCircleText } from "@phosphor-icons/react";
import Reveal from "./Reveal.jsx";

const REVIEWS_KEY = "srd-reviews";
const NAME_MAX = 40;
const MESSAGE_MAX = 300;

// Sample reviews shown until real fan reviews are added. Replace or delete freely.
const SEED_REVIEWS = [
  { id: "seed-1", name: "Nabil H.", rating: 5, message: "Laal Dupatta cover is on repeat every single night. Proper late-drive music." },
  { id: "seed-2", name: "Sadia R.", rating: 5, message: "গানগুলো শুনলে মন ভালো হয়ে যায়। আরো গান আসুক!" },
  { id: "seed-3", name: "Tanvir K.", rating: 4, message: "Clean vocals and the videos look great. Would love a full album one day." },
  { id: "seed-4", name: "Mim J.", rating: 5, message: "Found this page through a friend and now I follow every release. Keep going!" },
  { id: "seed-5", name: "Priya S.", rating: 5, message: "The new release countdown is a fun touch. Cannot wait for the next single." },
];

function loadReviews() {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    if (raw === null) return SEED_REVIEWS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED_REVIEWS;
  } catch {
    return SEED_REVIEWS;
  }
}

function saveReviews(list) {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: review stays on screen for this visit only */
  }
}

function StarRow({ value }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="sr-only">{value} out of 5 stars</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={16}
          weight={n <= value ? "fill" : "regular"}
          className={n <= value ? "text-accent" : "text-faint"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function ReviewCard({ review }) {
  return (
    <li className="beat-glow flex w-[260px] shrink-0 flex-col gap-4 rounded-2xl bg-raised p-6 ring-1 ring-hairline sm:w-[320px]">
      <StarRow value={review.rating} />
      <p className="text-ink leading-relaxed">“{review.message}”</p>
      <p className="mt-auto font-mono text-xs uppercase tracking-[0.15em] text-accent">{review.name}</p>
    </li>
  );
}

// Continuous loop: the list is repeated so the track is always wider than the screen.
// The second copy is hidden from assistive tech and the loop resets seamlessly at -50%.
function ReviewMarquee({ reviews }) {
  const items = useMemo(() => {
    if (!reviews.length) return [];
    const copies = Math.max(1, Math.ceil(6 / reviews.length));
    const out = [];
    for (let i = 0; i < copies; i += 1) out.push(...reviews);
    return out;
  }, [reviews]);

  const duration = Math.max(20, items.length * 4);
  return (
    <div
      className="reviews-wrap relative overflow-hidden"
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-canvas to-transparent sm:w-24" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-canvas to-transparent sm:w-24" aria-hidden="true" />
      <div
        className="review-track flex w-max py-2"
        style={{ animationDuration: `${duration}s` }}
      >
        {[0, 1].map((copy) => (
          <ul key={copy} aria-hidden={copy === 1 ? "true" : undefined} className="flex shrink-0 gap-5 pr-5">
            {items.map((r, i) => (
              <ReviewCard key={`${r.id}-${copy}-${i}`} review={r} />
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({ onAdd }) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!name.trim()) next.name = "Please add your name.";
    if (!rating) next.rating = "Pick a star rating.";
    if (!message.trim()) next.message = "Please write a review.";
    setErrors(next);
    setSent(false);
    if (Object.keys(next).length) return;
    onAdd({
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim().slice(0, NAME_MAX),
      rating,
      message: message.trim().slice(0, MESSAGE_MAX),
    });
    setName("");
    setRating(0);
    setMessage("");
    setSent(true);
  };

  const inputClass =
    "mt-2 w-full rounded-xl border border-hairline bg-sunk px-4 py-3 text-ink placeholder:text-faint focus:border-accent focus:outline-none";

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5 rounded-2xl bg-raised p-6 ring-1 ring-hairline sm:p-10">
      <label className="flex flex-col text-sm font-medium text-muted">
        Your name
        <input
          type="text"
          value={name}
          maxLength={NAME_MAX}
          onChange={(e) => setName(e.target.value)}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "review-name-error" : undefined}
          className={inputClass}
          placeholder="Jane"
        />
        {errors.name && <span id="review-name-error" className="mt-2 text-xs text-accent">{errors.name}</span>}
      </label>

      <fieldset className="flex flex-col text-sm font-medium text-muted">
        <legend>Your rating</legend>
        <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full transition-transform duration-150 hover:scale-110 active:scale-95"
            >
              <Star size={28} weight={n <= rating ? "fill" : "regular"} className={n <= rating ? "text-accent" : "text-faint"} aria-hidden="true" />
            </button>
          ))}
        </div>
        {errors.rating && <span className="mt-2 text-xs text-accent">{errors.rating}</span>}
      </fieldset>

      <label className="flex flex-col text-sm font-medium text-muted">
        Your review
        <textarea
          rows={4}
          value={message}
          maxLength={MESSAGE_MAX}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "review-message-error" : undefined}
          className={`${inputClass} resize-y`}
          placeholder="What did you think of the music?"
        />
        <span className="mt-1 self-end text-xs text-faint">{message.length}/{MESSAGE_MAX}</span>
        {errors.message && <span id="review-message-error" className="mt-2 text-xs text-accent">{errors.message}</span>}
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          className="glow-hover beat-pop inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-on-accent transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
        >
          <ChatCircleText size={18} aria-hidden="true" />
          Post review
        </button>
        <p role="status" className="text-sm text-muted">{sent ? "Thanks! Your review is on the train." : ""}</p>
      </div>
    </form>
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState(loadReviews);

  const addReview = (review) => {
    const next = [...reviews, review];
    setReviews(next);
    saveReviews(next);
  };

  return (
    <section id="reviews" className="scroll-mt-20 border-t border-hairline px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-8 sm:mb-10">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Fan reviews</p>
            <h2 className="mt-3 font-display text-3xl tracking-display sm:text-5xl">Reviews</h2>
            <p className="mt-4 max-w-xl text-muted">What fans are saying. Hover the train on desktop to pause it.</p>
          </div>
        </Reveal>
        <Reveal delay={0.08}>
          <ReviewMarquee reviews={reviews} />
        </Reveal>
        <Reveal delay={0.12} className="mt-12 sm:mt-16">
          <div className="mb-6 flex items-center gap-2 text-sm text-muted">
            <span>Leave a review</span>
          </div>
          <div className="max-w-2xl">
            <ReviewForm onAdd={addReview} />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
