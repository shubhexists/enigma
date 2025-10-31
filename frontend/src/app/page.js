"use client";

import "./index.css";

import "./preloader.css";

import { useRef, useState, useEffect } from "react";



import gsap from "gsap";

import { ScrollTrigger } from "gsap/ScrollTrigger";

import CustomEase from "gsap/CustomEase";

import { useGSAP } from "@gsap/react";

import { useLenis } from "lenis/react";

import { IoMdArrowForward } from "react-icons/io";
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

import Nav from "../components/Nav/Nav";

import ConditionalFooter from "../components/ConditionalFooter/ConditionalFooter";

import AnimatedButton from "../components/AnimatedButton/AnimatedButton";


import Copy from "../components/Copy/Copy";



let isInitialLoad = true;

gsap.registerPlugin(ScrollTrigger, CustomEase);

CustomEase.create("hop", "0.9, 0, 0.1, 1");



export default function Home() {

  const tagsRef = useRef(null);

  const [showPreloader, setShowPreloader] = useState(isInitialLoad);

  const [loaderAnimating, setLoaderAnimating] = useState(false);

  const lenis = useLenis();



  useEffect(() => {

    return () => {

      isInitialLoad = false;

    };

  }, []);



  useEffect(() => {

    if (lenis) {

      if (loaderAnimating) {

        lenis.stop();

      } else {

        lenis.start();

      }

    }

  }, [lenis, loaderAnimating]);



  useGSAP(() => {

    const tl = gsap.timeline({

      delay: 0.3,

      defaults: {

        ease: "hop",

      },

    });



    if (showPreloader) {

      setLoaderAnimating(true);

      const counts = document.querySelectorAll(".count");



      counts.forEach((count, index) => {

        const digits = count.querySelectorAll(".digit h1");



        tl.to(

          digits,

          {

            y: "0%",

            duration: 1,

            stagger: 0.075,

          },

          index * 1

        );



        if (index < counts.length) {

          tl.to(

            digits,

            {

              y: "-100%",

              duration: 1,

              stagger: 0.075,

            },

            index * 1 + 1

          );

        }

      });



      tl.to(".spinner", {

        opacity: 0,

        duration: 0.3,

      });



      tl.to(

        ".word h1",

        {

          y: "0%",

          duration: 1,

        },

        "<"

      );



      tl.to(".divider", {

        scaleY: "100%",

        duration: 1,

        onComplete: () =>

          gsap.to(".divider", { opacity: 0, duration: 0.3, delay: 0.3 }),

      });



      tl.to("#word-1 h1", {

        y: "100%",

        duration: 1,

        delay: 0.3,

      });



      tl.to(

        "#word-2 h1",

        {

          y: "-100%",

          duration: 1,

        },

        "<"

      );



      tl.to(

        ".block",

        {

          clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)",

          duration: 1,

          stagger: 0.1,

          delay: 0.75,

          onStart: () => {

            gsap.to(".hero-img", { scale: 1, duration: 2, ease: "hop" });

          },

          onComplete: () => {

            gsap.set(".loader", { pointerEvents: "none" });

            setLoaderAnimating(false);

          },

        },

        "<"

      );

    }

  }, [showPreloader]);



  useGSAP(

    () => {

      if (!tagsRef.current) return;



      const tags = tagsRef.current.querySelectorAll(".what-we-do-tag");

      gsap.set(tags, { opacity: 0, x: -40 });



      ScrollTrigger.create({

        trigger: tagsRef.current,

        start: "top 90%",

        once: true,

        animation: gsap.to(tags, {

          opacity: 1,

          x: 0,

          duration: 0.8,

          stagger: 0.1,

          ease: "power3.out",

        }),

      });

    },

    { scope: tagsRef }

  );



  return (

    <>

      {showPreloader && (

        <div className="loader">

          <div className="overlay">

            <div className="block"></div>

            <div className="block"></div>

          </div>

          <div className="intro-logo">

            <div className="word" id="word-1" style={{ marginLeft: '-2rem' }}>

              <h1>

                <span>Enigma</span>

              </h1>

            </div>

            <div className="word" id="word-2">

              <h1>Labs</h1>

            </div>

          </div>

          <div className="divider"></div>

          <div className="spinner-container">

            <div className="spinner"></div>

          </div>

          <div className="counter">

            <div className="count">

              <div className="digit">

                <h1>0</h1>

              </div>

              <div className="digit">

                <h1>0</h1>

              </div>

            </div>

            <div className="count">

              <div className="digit">

                <h1>2</h1>

              </div>

              <div className="digit">

                <h1>7</h1>

              </div>

            </div>

            <div className="count">

              <div className="digit">

                <h1>6</h1>

              </div>

              <div className="digit">

                <h1>5</h1>

              </div>

            </div>

            <div className="count">

              <div className="digit">

                <h1>9</h1>

              </div>

              <div className="digit">

                <h1>8</h1>

              </div>

            </div>

            <div className="count">

              <div className="digit">

                <h1>9</h1>

              </div>

              <div className="digit">

                <h1>9</h1>

              </div>

            </div>

          </div>

        </div>

      )}

      <Nav />

      <section className="hero">

        <div className="hero-bg">
          <img src="/engima.webp" alt="Enigma marketplace collage" />
        </div>

        <div className="hero-gradient"></div>

        <div className="container">

          <div className="hero-content">

            <div className="hero-header">

              <Copy animateOnScroll={false} delay={showPreloader ? 10 : 0.85}>

                <h1>Ship APIs faster.</h1>
                <h1>Monetize every request.</h1>

              </Copy>

            </div>

            <div className="hero-tagline">

              <Copy animateOnScroll={false} delay={showPreloader ? 10.15 : 1}>

                <p>

                  Enigma Marketplace connects builders and buyers with per-request pricing, automated metering, and instant payouts over the x402 network.

                </p>

              </Copy>

            </div>

              <SignedIn>
                <AnimatedButton
                  label="Discover More"
                  route="/dashboard"
                  animateOnScroll={false}
                  delay={showPreloader ? 10.3 : 1.15}
                />
              </SignedIn>
              <SignedOut>
                <SignInButton mode="modal">
                  <AnimatedButton
                    label="Discover More"
                    animateOnScroll={false}
                    delay={showPreloader ? 10.3 : 1.15}
                  />
                </SignInButton>
              </SignedOut>

          </div>

        </div>

        <div className="hero-stats">

          <div className="container">

            <div className="stat">

              <div className="stat-count">

                <Copy delay={0.1}>

                  <h2>420+</h2>

                </Copy>

              </div>

              <div className="stat-divider"></div>

              <div className="stat-info">

                <Copy delay={0.15}>

                  <p>Marketplace-ready APIs</p>

                </Copy>

              </div>

            </div>

            <div className="stat">

              <div className="stat-count">

                <Copy delay={0.2}>

                  <h2>1.8M</h2>

                </Copy>

              </div>

              <div className="stat-divider"></div>

              <div className="stat-info">

                <Copy delay={0.25}>

                  <p>Monthly x402-routed requests</p>

                </Copy>

              </div>

            </div>

            <div className="stat">

              <div className="stat-count">

                <Copy delay={0.3}>

                  <h2>68</h2>

                </Copy>

              </div>

              <div className="stat-divider"></div>

              <div className="stat-info">

                <Copy delay={0.35}>

                  <p>Countries with active builders</p>

                </Copy>

              </div>

            </div>

            <div className="stat">

              <div className="stat-count">

                <Copy delay={0.4}>

                  <h2>99.95%</h2>

                </Copy>

              </div>

              <div className="stat-divider"></div>

              <div className="stat-info">

                <Copy delay={0.45}>

                  <p>Marketplace uptime</p>

                </Copy>

              </div>

            </div>

          </div>

        </div>

      </section>

      <section className="what-we-do">

        <div className="container">

          <div className="what-we-do-header">

            <Copy delay={0.1}>

              <h1>

                <span className="spacer">&nbsp;</span>

                Enigma Labs empowers API builders with analytics, per-request billing through x402, and instant reach to a global buyer network.

              </h1>

            </Copy>

          </div>

          <div className="what-we-do-content">

            <div className="what-we-do-col">

              <Copy delay={0.1}>

                <p>How it works</p>

              </Copy>



              <Copy delay={0.15}>

                <p className="lg">

                  Publish your API once, set a per-request price, and Enigma automates auth, metering, receipts, and payouts. Consumers plug in with managed keys, live usage caps, and transparent billing.

                </p>

              </Copy>

            </div>

            <div className="what-we-do-col">

              <div className="what-we-do-tags" ref={tagsRef}>

                <div className="what-we-do-tag">

                  <h3>Per-request billing</h3>

                </div>

                <div className="what-we-do-tag">

                  <h3>x402 payouts</h3>

                </div>

                <div className="what-we-do-tag">

                  <h3>Verified sellers</h3>

                </div>

                <div className="what-we-do-tag">

                  <h3>Usage analytics</h3>

                </div>

                <div className="what-we-do-tag">

                  <h3>Sandbox keys</h3>

                </div>

                <div className="what-we-do-tag">

                  <h3>Developer tooling</h3>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>






      <ConditionalFooter />

    </>

  );

}
