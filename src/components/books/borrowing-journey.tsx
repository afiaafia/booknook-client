'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  Check,
  Compass,
  RotateCcw,
  Search,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Discover',
    description: 'Explore the shelves and find your next favorite.',
    icon: Compass,
  },
  {
    number: '02',
    title: 'Choose',
    description: 'Discover book details and check availability.',
    icon: Search,
  },
  {
    number: '03',
    title: 'Borrow',
    description: 'Sign in and choose your return date.',
    icon: BookOpen,
  },
  {
    number: '04',
    title: 'Read',
    description: 'Enjoy your book and track your reading time.',
    icon: CalendarDays,
  },
  {
    number: '05',
    title: 'Return',
    description: 'Return your book and share the story again.',
    icon: RotateCcw,
  },
];

export default function BorrowingJourney() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (media.matches) return;

    const interval = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % steps.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      aria-labelledby="borrowing-journey-title"
      className="borrowing-journey-section reading-room-reveal px-5 py-8 sm:px-8 sm:py-10"
    >
      <div className="borrowing-journey-shell mx-auto max-w-7xl">
        <div className="borrowing-journey-content">
          <div className="borrowing-journey-intro">
            <span className="borrowing-journey-eyebrow">
              <span className="borrowing-journey-eyebrow-dot" />
              THE ART OF BORROWING
            </span>

            <h2 id="borrowing-journey-title">
              A journey
              <br />
              <span>worth reading.</span>
            </h2>

            <p>
              From discovering a new story to passing it on,
              your next reading experience begins here.
            </p>

            <div className="borrowing-journey-caption">
              <BookOpen size={15} />
              <span>Five simple steps. Endless stories.</span>
            </div>
          </div>

          <div className="borrowing-journey-stage">
            <div className="borrowing-journey-orbit borrowing-journey-orbit-one" />
            <div className="borrowing-journey-orbit borrowing-journey-orbit-two" />

            <div className="borrowing-journey-book" aria-hidden="true">
              <div className="borrowing-journey-book-cover">
                <BookOpen size={43} strokeWidth={1.1} />
                <span>BOOKNOOK</span>
              </div>
              <div className="borrowing-journey-book-glow" />
            </div>

            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;
              const isComplete = index < activeStep;

              return (
                <div
                  key={step.number}
                  className={`borrowing-journey-step borrowing-journey-step-${index + 1}${
                    isActive ? ' is-active' : ''
                  }${isComplete ? ' is-complete' : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="borrowing-journey-step-icon">
                    {isComplete ? (
                      <Check size={15} />
                    ) : (
                      <Icon size={16} strokeWidth={1.7} />
                    )}
                  </span>

                  <span className="borrowing-journey-step-copy">
                    <span className="borrowing-journey-step-number">
                      {step.number}
                    </span>
                    <span className="borrowing-journey-step-title">
                      {step.title}
                    </span>
                    <span className="borrowing-journey-step-description">
                      {step.description}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="borrowing-journey-footer">
          <span>YOUR READING JOURNEY</span>

          <div className="borrowing-journey-progress">
            {steps.map((step, index) => (
              <span
                key={step.number}
                className={index <= activeStep ? 'is-filled' : ''}
              />
            ))}
          </div>

          <span className="borrowing-journey-counter">
            {steps[activeStep].number}
            <span> / 05</span>
          </span>
        </div>
      </div>
    </section>
  );
}
