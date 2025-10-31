"use client";

import "./CTAWindow.css";



import Copy from "../Copy/Copy";

import AnimatedButton from "../AnimatedButton/AnimatedButton";



const CTAWindow = ({ img, header, callout, description, buttonLabel, buttonRoute }) => {

  return (

    <section className="cta-window">

      <div className="container">

        <div className="cta-window-img-wrapper">

          <img src={img} alt="" />

        </div>

        <div className="cta-window-img-overlay"></div>

        <div className="cta-window-header">

          <Copy delay={0.1}>

            <h1>{header}</h1>

          </Copy>

        </div>

        <div className="cta-window-footer">

          <div className="cta-window-callout">

            <Copy delay={0.1}>

              <h3>{callout}</h3>

            </Copy>

          </div>

          <div className="cta-window-description">

            <Copy delay={0.1}>

              <p>{description}</p>

            </Copy>

            {buttonLabel && buttonRoute && (
              <div className="cta-window-button">
                <AnimatedButton
                  label={buttonLabel}
                  route={buttonRoute}
                  animateOnScroll={true}
                  delay={0.2}
                />
              </div>
            )}

          </div>

        </div>

      </div>

    </section>

  );

};



export default CTAWindow;
