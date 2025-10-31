"use client";

import "./Footer.css";

import { useViewTransition } from "../../hooks/useViewTransition";

import Copy from "../Copy/Copy";

const Footer = () => {

  const { navigateWithTransition } = useViewTransition();

  return (

    <div className="footer">

      <div className="footer-meta">

      </div>

      <div className="footer-outro">

        <div className="container">

          <div className="footer-header">

            <img src="/logos/enigma_gradient_logo.svg" alt="Enigma Logo" />

          </div>

          <div className="footer-copyright">

            <p>

              Developed by — <a href="https://x.com/Abhinavstwt" target="_blank" rel="noopener noreferrer">@Abhinav</a> & <a href="https://x.com/shubh_exists" target="_blank" rel="noopener noreferrer">@Shubh</a>

            </p>

            <p>This website is using cookies.</p>

            <p>All rights reserved &copy; 2025</p>

          </div>

        </div>

      </div>

    </div>

  );

};

export default Footer;