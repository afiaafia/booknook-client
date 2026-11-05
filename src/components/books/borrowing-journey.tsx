import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Discover",
    description: "Explore the library and find stories that interest you.",
    action: "Explore books",
    href: "/books",
    icon: "discover",
  },
  {
    number: "02",
    title: "Choose",
    description: "Find a book you love and check its details.",
    action: "Choose a book",
    href: "/books",
    icon: "choose",
  },
  {
    number: "03",
    title: "Borrow",
    description: "Borrow an available book and make it yours for a while.",
    action: "Borrow a book",
    href: "/books",
    icon: "borrow",
  },
  {
    number: "04",
    title: "Read",
    description: "Enjoy your story and keep track of your borrowed books.",
    action: "My borrows",
    href: "/my-borrows",
    icon: "read",
  },
  {
    number: "05",
    title: "Return",
    description: "Follow your borrowing details to complete the journey.",
    action: "Manage borrows",
    href: "/my-borrows",
    icon: "return",
  },
];

function StepIcon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[19px] w-[19px]"
      aria-hidden="true"
      {...common}
    >
      {name === "discover" && (
        <>
          <circle cx="10.8" cy="10.8" r="6.8" />
          <path d="m16 16 4.2 4.2M10.8 7.5l1.1 2.2 2.2 1.1-2.2 1.1-1.1 2.2-1.1-2.2-2.2-1.1 2.2-1.1 1.1-2.2Z" />
        </>
      )}

      {name === "choose" && (
        <>
          <path d="M4 5.5c3.2-.9 5.7-.3 8 1.5 2.3-1.8 4.8-2.4 8-1.5v13c-3.2-.9-5.7-.3-8 1.5-2.3-1.8-4.8-2.4-8-1.5v-13Z" />
          <path d="M12 7v13" />
        </>
      )}

      {name === "borrow" && (
        <>
          <path d="M5 4.5h10l4 4v11H5z" />
          <path d="M15 4.5v4h4M12 11v6m-3-3 3 3 3-3" />
        </>
      )}

      {name === "read" && (
        <>
          <path d="M4 5.5c3.2-.9 5.7-.3 8 1.5 2.3-1.8 4.8-2.4 8-1.5v13c-3.2-.9-5.7-.3-8 1.5-2.3-1.8-4.8-2.4-8-1.5v-13Z" />
          <path d="M12 7v13" />
          <path d="m8 10 1.5 1.5L11 10" />
        </>
      )}

      {name === "return" && (
        <>
          <path d="M5 8V4m0 4h4" />
          <path d="M5.5 8a8 8 0 1 1-1 7" />
          <path d="m9 12 2 2 4-4" />
        </>
      )}
    </svg>
  );
}

export default function BorrowingJourney() {
  return (
    <section
      aria-labelledby="borrowing-journey-title"
      className="relative overflow-hidden py-9 sm:py-11"
    >
      <div className="pointer-events-none absolute left-1/2 top-10 h-48 w-80 -translate-x-1/2 rounded-full bg-[#c6a46c]/[0.07] blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        {/* Compact heading */}
        <div className="mb-8 text-center sm:mb-10">
          <span className="inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-[#a1814e] sm:text-[10px]">
            <span className="h-1 w-1 rounded-full bg-[#b18a4b]" />
            Your reading journey
            <span className="h-1 w-1 rounded-full bg-[#b18a4b]" />
          </span>

          <h2
            id="borrowing-journey-title"
            className="mt-2 font-serif text-2xl font-medium tracking-tight text-[#29251f] sm:text-3xl"
          >
            From shelf to story.
          </h2>

          <p className="mx-auto mt-2 max-w-md text-xs leading-6 text-[#82796d] sm:text-sm">
            One book. Five simple steps. Your next story starts here.
          </p>
        </div>

        {/* One connected timeline */}
        <div className="relative mx-auto max-w-6xl">
          {/* Desktop horizontal connector */}
          <div className="absolute left-[10%] right-[10%] top-[21px] hidden h-px bg-gradient-to-r from-transparent via-[#c5a36d] to-transparent md:block" />

          {/* Mobile vertical connector */}
          <div className="absolute bottom-8 left-[20px] top-8 w-px bg-gradient-to-b from-[#c5a36d]/20 via-[#b18a4b] to-[#c5a36d]/20 md:hidden" />

          <div className="grid grid-cols-1 gap-5 md:grid-cols-5 md:gap-3">
            {steps.map((step, index) => (
              <article
                key={step.number}
                className="group relative flex gap-4 md:flex-col md:items-center md:gap-3 md:px-2 md:text-center"
              >
                {/* Number and icon */}
                <div className="relative z-10 flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-[#b18a4b]/40 bg-[#f8f4eb] text-[#987542] shadow-[0_3px_12px_rgba(100,75,35,0.08)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-[#a88755] group-hover:bg-[#ead8b5] group-hover:shadow-[0_7px_18px_rgba(100,75,35,0.15)]">
                  <StepIcon name={step.icon} />
                  <span className="absolute -right-1 -top-1 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#a88755] px-1 text-[8px] font-semibold text-white">
                    {index + 1}
                  </span>
                </div>

                {/* Step information */}
                <div className="min-w-0 flex-1 pb-1 md:flex md:flex-col md:items-center">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.17em] text-[#a88755]">
                    STEP {step.number}
                  </span>

                  <h3 className="mt-1 font-serif text-lg font-medium text-[#302a22] transition-colors duration-200 group-hover:text-[#987542]">
                    {step.title}
                  </h3>

                  <p className="mt-1 max-w-[210px] text-xs leading-5 text-[#82796d]">
                    {step.description}
                  </p>

                  <Link
                    href={step.href}
                    className="mt-2.5 inline-flex min-h-8 items-center gap-2 rounded-full border border-[#b18a4b]/35 bg-[#b18a4b]/[0.06] px-3.5 py-1.5 text-[10px] font-semibold tracking-wide text-[#87683c] transition-all duration-300 hover:border-[#a88755] hover:bg-[#b18a4b] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b18a4b] focus-visible:ring-offset-2"
                  >
                    {step.action}
                    <svg
                      viewBox="0 0 20 20"
                      fill="none"
                      className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 10h12m-5-5 5 5-5 5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Small closing line */}
        <div className="mt-7 flex items-center justify-center gap-3">
          <span className="h-px w-8 bg-[#b18a4b]/35" />
          <span className="text-[9px] italic tracking-wide text-[#9a8c78]">
            Every great read begins with a first step.
          </span>
          <span className="h-px w-8 bg-[#b18a4b]/35" />
        </div>
      </div>
    </section>
  );
}
