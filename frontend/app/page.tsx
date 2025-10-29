import Link from "next/link"

export default function HomePage() {
  return (
    <div className="h-screen bg-[#F5F1ED] flex flex-col overflow-hidden">
      {/* Navigation */}
      <nav className="bg-[#F5F1ED]/95 backdrop-blur-sm border-b border-[#E8E3DE]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-serif font-bold text-[#37322F]">RapidAPI</div>
          <div className="hidden md:flex gap-8 items-center">
            <a href="#" className="text-[#37322F] hover:text-[#37322F]/70 text-sm font-medium">
              Products
            </a>
            <a href="#" className="text-[#37322F] hover:text-[#37322F]/70 text-sm font-medium">
              Pricing
            </a>
            <a href="#" className="text-[#37322F] hover:text-[#37322F]/70 text-sm font-medium">
              Docs
            </a>
          </div>
          <Link
            href="/auth/sign-in"
            className="text-[#37322F] hover:text-[#37322F]/70 text-sm font-medium px-4 py-2 rounded-md hover:bg-[#E8E3DE]/50 transition-colors"
          >
            Log in
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col justify-center items-center px-2 sm:px-4 md:px-8 lg:px-0 w-full">
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 z-0 pointer-events-none w-full">
          <svg
            viewBox="0 0 1060 949"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full max-w-[1200px] h-auto opacity-20 sm:opacity-25 md:opacity-30"
          >
            <g opacity="0.25">
              <rect x="227.91" y="572" width="604.178" height="267" rx="130" fill="url(#paint0_linear)" />
            </g>
            <defs>
              <linearGradient
                id="paint0_linear"
                x1="197.366"
                y1="655.859"
                x2="872.057"
                y2="737.244"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FF452C" />
                <stop offset="0.385" stopColor="#FF722C" />
                <stop offset="0.715" stopColor="#FF962C" />
                <stop offset="1" stopColor="#FFB92C" stopOpacity="0.97" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="w-full max-w-[937px] flex flex-col justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-6 relative z-10">
          {/* Headline */}
          <div className="w-full max-w-[748px] text-center flex justify-center flex-col text-[#37322F] text-[28px] xs:text-[32px] sm:text-[44px] md:text-[56px] lg:text-[72px] font-normal leading-[1.1] sm:leading-[1.15] md:leading-[1.2] lg:leading-[1.25] font-serif px-2 sm:px-4 md:px-0">
            Discover and Integrate
            <br />
            Powerful APIs Instantly
          </div>

          {/* Subheading */}
          <div className="w-full max-w-[550px] text-center flex justify-center flex-col text-[rgba(55,50,47,0.75)] text-sm sm:text-base md:text-lg lg:text-lg leading-[1.4] sm:leading-[1.45] md:leading-[1.5] lg:leading-[1.6] font-sans px-2 sm:px-4 md:px-0 font-medium">
            Connect to thousands of APIs with seamless integration. Build faster with RapidAPI's comprehensive
            marketplace and developer tools.
          </div>

          {/* CTA Button */}
          <div className="mt-8 sm:mt-10 md:mt-12 lg:mt-14">
            <Link href="/auth/sign-up">
              <div className="h-10 sm:h-11 md:h-12 px-6 sm:px-8 md:px-10 lg:px-12 py-2 sm:py-[6px] relative bg-[#37322F] shadow-[0px_0px_0px_2.5px_rgba(255,255,255,0.08)_inset] overflow-hidden rounded-full flex justify-center items-center hover:bg-[#37322F]/90 transition-colors cursor-pointer">
                <div className="w-20 sm:w-24 md:w-28 lg:w-44 h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
                <div className="flex flex-col justify-center text-white text-sm sm:text-base md:text-[15px] font-medium leading-5 font-sans relative z-10">
                  Start for free
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
