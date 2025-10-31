"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SplitText from "split-type";
import { clientReviewsContent } from "./client-reviews-content";

import "./ClientReviews.css";

gsap.registerPlugin(ScrollTrigger);

export default function ClientReviews() {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const reviewsRef = useRef([]);
  const [currentReview, setCurrentReview] = useState(0);

  useGSAP(() => {
    if (!containerRef.current || !titleRef.current) return;

    // Title animation with SplitText
    const titleSplit = new SplitText(titleRef.current, {
      type: "lines,words",
    });

    gsap.fromTo(
      titleSplit.lines,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        stagger: 0.1,
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
      }
    );

    // Reviews animation
    reviewsRef.current.forEach((review, index) => {
      if (!review) return;

      gsap.fromTo(
        review,
        {
          opacity: 0,
          x: index % 2 === 0 ? -100 : 100,
        },
        {
          opacity: 1,
          x: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: review,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
  }, []);

  const addToRefs = (el) => {
    if (el && !reviewsRef.current.includes(el)) {
      reviewsRef.current.push(el);
    }
  };

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % clientReviewsContent.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) =>
      prev === 0 ? clientReviewsContent.length - 1 : prev - 1
    );
  };

  return (
    <section className="client-reviews" ref={containerRef}>
      <div className="client-reviews__container">
        <h2 className="client-reviews__title" ref={titleRef}>
          What Our Clients Say
        </h2>

        <div className="client-reviews__carousel">
          <button
            className="client-reviews__nav-btn client-reviews__nav-btn--prev"
            onClick={prevReview}
            aria-label="Previous review"
          >
            ‹
          </button>

          <div className="client-reviews__review" ref={addToRefs}>
            <div className="client-reviews__review-content">
              <blockquote className="client-reviews__quote">
                "{clientReviewsContent[currentReview].quote}"
              </blockquote>
              <div className="client-reviews__author">
                <div className="client-reviews__author-info">
                  <h4 className="client-reviews__author-name">
                    {clientReviewsContent[currentReview].name}
                  </h4>
                  <p className="client-reviews__author-role">
                    {clientReviewsContent[currentReview].role}
                  </p>
                </div>
                <div className="client-reviews__author-image">
                  <img
                    src={clientReviewsContent[currentReview].image}
                    alt={clientReviewsContent[currentReview].name}
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            className="client-reviews__nav-btn client-reviews__nav-btn--next"
            onClick={nextReview}
            aria-label="Next review"
          >
            ›
          </button>
        </div>

        <div className="client-reviews__indicators">
          {clientReviewsContent.map((_, index) => (
            <button
              key={index}
              className={`client-reviews__indicator ${
                index === currentReview ? "client-reviews__indicator--active" : ""
              }`}
              onClick={() => setCurrentReview(index)}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}


