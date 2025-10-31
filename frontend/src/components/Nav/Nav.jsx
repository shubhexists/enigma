"use client";

import "./Nav.css";



import {

  useEffect,

  useState,

  useCallback,

  useRef,

  useLayoutEffect,

} from "react";

import { useRouter } from "next/navigation";



import gsap from "gsap";

import CustomEase from "gsap/CustomEase";

import SplitText from "gsap/SplitText";

import { useLenis } from "lenis/react";




import { useViewTransition } from "../../hooks/useViewTransition";



gsap.registerPlugin(SplitText);



const Nav = () => {

  const [isAnimating, setIsAnimating] = useState(false);


  const [isNavigating, setIsNavigating] = useState(false);

  const isInitializedRef = useRef(false);

  const router = useRouter();

  const lenis = useLenis();



  const { navigateWithTransition } = useViewTransition();






  useLayoutEffect(() => {

    gsap.registerPlugin(CustomEase);

    CustomEase.create(

      "hop",

      "M0,0 C0.354,0 0.464,0.133 0.498,0.502 0.532,0.872 0.651,1 1,1"

    );

  }, []);















  const handleLinkClick = useCallback(

    (e, href) => {

      e.preventDefault();



      const currentPath = window.location.pathname;

      if (currentPath === href) {

        return;

      }



      if (isNavigating) return;



      setIsNavigating(true);

      navigateWithTransition(href);

    },

    [isNavigating, navigateWithTransition]

  );



  const splitTextIntoSpans = (text) => {

    return text

      .split("")

      .map((char, index) =>

        char === " " ? (

          <span key={index}>&nbsp;&nbsp;</span>

        ) : (

          <span key={index}>{char}</span>

        )

      );

  };



  return (

    <div>


    </div>

  );

};



export default Nav;
