"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { featuredProjectsContent } from "./featured-projects-content";

import "./FeaturedProjects.css";

gsap.registerPlugin(ScrollTrigger);

export default function FeaturedProjects() {
  const containerRef = useRef(null);
  const titleRef = useRef(null);
  const projectsRef = useRef([]);

  useGSAP(() => {
    if (!containerRef.current || !titleRef.current) return;

    // Title animation
    gsap.fromTo(
      titleRef.current,
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: titleRef.current,
          start: "top 80%",
          end: "bottom 20%",
          toggleActions: "play none none reverse",
        },
      }
    );

    // Projects animation
    projectsRef.current.forEach((project, index) => {
      if (!project) return;

      gsap.fromTo(
        project,
        {
          opacity: 0,
          y: 100,
        },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: project,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });
  }, []);

  const addToRefs = (el) => {
    if (el && !projectsRef.current.includes(el)) {
      projectsRef.current.push(el);
    }
  };

  return (
    <section className="featured-projects" ref={containerRef}>
      <div className="featured-projects__container">
        <h2 className="featured-projects__title" ref={titleRef}>
          Featured Projects
        </h2>

        <div className="featured-projects__grid">
          {featuredProjectsContent.map((project, index) => (
            <div
              key={project.id}
              className="featured-projects__project"
              ref={addToRefs}
            >
              <div className="featured-projects__project-image">
                <img
                  src={project.image}
                  alt={project.title}
                  loading="lazy"
                />
              </div>

              <div className="featured-projects__project-content">
                <h3 className="featured-projects__project-title">
                  {project.title}
                </h3>
                <p className="featured-projects__project-description">
                  {project.description}
                </p>
                <div className="featured-projects__project-tags">
                  {project.tags.map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="featured-projects__project-tag"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


