import Image from "next/image";
import { Star } from "lucide-react";

const previewReviews = [
  {
    id: 1,
    reader: "Emma Bennett",
    initials: "R1",
    photo: "/images/reviewers/reader-01.jpg",
    book: "The Art of Reading",
    category: "FICTION",
    quote:
      "Some books stay with you long after the final page. This one made every quiet evening feel a little more meaningful.",
    cover:
      "linear-gradient(145deg, #8b6650 0%, #4c342c 100%)",
    accent: "#e8c99b",
  },
  {
    id: 2,
    reader: "James Carter",
    initials: "R2",
    photo: "/images/reviewers/reader-02.jpg",
    book: "Beyond the Pages",
    category: "LITERATURE",
    quote:
      "A beautiful reminder of why I fell in love with reading. I found myself slowing down just to enjoy every chapter.",
    cover:
      "linear-gradient(145deg, #7d8170 0%, #3d493d 100%)",
    accent: "#d9dfbd",
  },
  {
    id: 3,
    reader: "Sofia Mitchell",
    initials: "R3",
    photo: "/images/reviewers/reader-03.jpg",
    book: "A Journey Through Stories",
    category: "ADVENTURE",
    quote:
      "The kind of reading experience that makes you want to discover another book as soon as you turn the last page.",
    cover:
      "linear-gradient(145deg, #b58a57 0%, #72502e 100%)",
    accent: "#f1d6a9",
  },
];

export default function ReaderReviews() {
  return (
    <section
      id="reader-reviews"
      aria-labelledby="reader-reviews-heading"
      className="relative mx-auto my-7 max-w-7xl overflow-hidden rounded-[2rem] border border-[#e8dfd2] bg-[#f8f5ef] px-5 py-7 text-[#35291f] shadow-[0_20px_65px_rgba(74,54,35,0.07)] sm:my-9 sm:px-8 sm:py-9 lg:px-12 lg:py-10"
    >
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#d9bd8b]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#a77b52]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mx-auto mb-5 max-w-2xl text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-[#b28a5b]/25 bg-white/60 px-4 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#a77b52]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#8b6949]">
              The Reading Community
            </span>
          </div>

          <h2
            id="reader-reviews-heading"
            className="font-serif text-3xl font-medium leading-tight tracking-tight text-[#35291f] sm:text-4xl lg:text-5xl"
          >
            Stories Worth{" "}
            <span className="italic text-[#a77b52]">Sharing.</span>
          </h2>

          <p className="mx-auto mt-2 max-w-xl text-sm leading-7 text-[#817367] sm:text-base">
            Every book leaves a different impression. Explore the kind of
            reading moments our community celebrates.
          </p>
        </div>

        {/* Preview label */}
        <div className="mb-3 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-[#c8ad86]/60" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#a18462]">
            Review Cards · Design Preview
          </span>
          <span className="h-px w-8 bg-[#c8ad86]/60" />
        </div>

        {/* Review cards */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 lg:gap-4">
          {previewReviews.map((review) => (
            <article
              key={review.id}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[#e8dfd2] bg-white/75 p-4 shadow-[0_8px_30px_rgba(74,54,35,0.035)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#c7a77b]/60 hover:shadow-[0_18px_45px_rgba(74,54,35,0.09)] sm:p-5"
            >
              {/* Top row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-[#d9c5a8] bg-[#f3ede3] shadow-sm">
                    <Image
                      src={review.photo}
                      alt="Illustrative reader portrait"
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#45372b]">
                      {review.reader}
                    </p>
                    <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-[#a39789]">
                      Community preview
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-0.5 text-[#bd955e]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className="h-3 w-3 fill-current"
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
              </div>

              {/* Quote */}
              <div className="relative mt-3 flex-1">
                <blockquote className="font-serif text-lg leading-8 text-[#514235] sm:text-xl">
                  “{review.quote}”
                </blockquote>
              </div>

              {/* Book reference */}
              <div className="mt-3 flex items-center gap-3 border-t border-[#eee7dd] pt-3">
                <div
                  className="relative flex h-[76px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-r-md shadow-[3px_4px_9px_rgba(48,35,24,0.2)]"
                  style={{ background: review.cover }}
                >
                  <div className="absolute inset-y-0 left-1.5 w-px bg-white/20" />
                  <div className="px-1 text-center">
                    <span
                      className="block font-serif text-[8px] leading-3 text-white/90"
                      style={{ color: review.accent }}
                    >
                      {review.book}
                    </span>
                    <span className="mt-2 block text-[5px] tracking-[0.2em] text-white/60">
                      BOOKNOOK
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a18462]">
                    {review.category}
                  </p>
                  <p className="font-serif text-base text-[#45372b]">
                    {review.book}
                  </p>
                  <p className="mt-1 text-[10px] text-[#a39789]">
                    Featured book preview
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Preview disclaimer */}
        <p className="mt-3 text-center text-[10px] leading-5 text-[#a39789]">
          These cards contain illustrative preview content, not submitted
          reader reviews.
        </p>
      </div>
    </section>
  );
}
