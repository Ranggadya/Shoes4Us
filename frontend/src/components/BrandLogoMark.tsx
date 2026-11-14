import { useId } from "react";

export type BrandLogoId =
  | "adidas"
  | "adidas-originals"
  | "asics"
  | "birkenstock"
  | "converse"
  | "crep-protect"
  | "crocs"
  | "hoka"
  | "jordan"
  | "lacoste"
  | "mizuno"
  | "new-balance"
  | "nike"
  | "on"
  | "onitsuka-tiger"
  | "puma"
  | "reebok"
  | "salomon"
  | "skechers"
  | "under-armour"
  | "vans";

const SANS_STACK = "system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";

/**
 * Monochrome inline SVG brand marks rendered next to each label
 * inside the Brands navigation mega-menu and mobile drawer.
 */
export default function BrandLogoMark({
  id,
  className = "h-7 w-auto max-w-[68px]",
}: {
  id: BrandLogoId;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");

  switch (id) {
    case "adidas":
      return (
        <svg viewBox="0 0 56 36" fill="currentColor" className={className} aria-hidden="true">
          <polygon points="8.5,24 15.5,24 21,33 14,33" />
          <polygon points="15.5,15 22.5,15 33,33 26,33" />
          <polygon points="22.5,6 29.5,6 45,33 38,33" />
        </svg>
      );

    case "adidas-originals": {
      const maskId = `trefoil-${uid}`;
      return (
        <svg viewBox="0 0 64 40" fill="currentColor" className={className} aria-hidden="true">
          <defs>
            <mask id={maskId}>
              <rect width="64" height="40" fill="white" />
              <rect x="6" y="22.5" width="52" height="2.4" fill="black" />
              <rect x="6" y="27" width="52" height="2.4" fill="black" />
              <rect x="6" y="31.5" width="52" height="2.4" fill="black" />
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            {/* Center leaf */}
            <path d="M32 3C26.5 10.5 25.5 22.5 32 35.5C38.5 22.5 37.5 10.5 32 3Z" />
            {/* Left leaf */}
            <path d="M12.5 13C15.5 22 21.5 29.5 32 34.5C27.5 24.5 22.5 16.5 12.5 13Z" />
            {/* Right leaf */}
            <path d="M51.5 13C41.5 16.5 36.5 24.5 32 34.5C42.5 29.5 48.5 22 51.5 13Z" />
          </g>
        </svg>
      );
    }

    case "asics":
      return (
        <svg viewBox="0 0 92 30" fill="currentColor" className={className} aria-hidden="true">
          <path d="M19.5 7.5C13.8 7.5 8 11.7 8 17.8C8 21.6 10.7 23.5 14.3 23.5C18.5 23.5 22.8 19.6 22.8 14.7C22.8 12.1 20.9 10.5 18.2 10.5C15.1 10.5 12.3 13 12.3 16C12.3 17.8 13.5 18.9 15.2 18.9C16.7 18.9 18 17.7 18.5 16.1H20.8C20.1 19 17.8 20.9 14.9 20.9C12.3 20.9 10.3 19.1 10.3 16.2C10.3 12.1 14 9 18.4 9C22.1 9 24.8 11.4 24.8 14.9C24.8 20.5 19.7 25.4 13.8 25.4C9.1 25.4 5.5 22.5 5.5 17.8C5.5 10.7 12.4 5.5 19.5 5.5C23.5 5.5 26.6 7.3 27.9 10.1H25.1C24.1 8.4 22 7.5 19.5 7.5Z" />
          <text
            x="32"
            y="21.5"
            fontFamily={SANS_STACK}
            fontSize="17"
            fontWeight="800"
            fontStyle="italic"
            letterSpacing="-0.5"
          >
            asics
          </text>
        </svg>
      );

    case "birkenstock":
      return (
        <svg viewBox="0 0 116 26" fill="currentColor" className={className} aria-hidden="true">
          <text
            x="58"
            y="18.5"
            textAnchor="middle"
            fontFamily={SANS_STACK}
            fontSize="13.5"
            fontWeight="900"
            letterSpacing="0.6"
          >
            BIRKENSTOCK
          </text>
        </svg>
      );

    case "converse":
      return (
        <svg viewBox="0 0 76 42" fill="currentColor" className={className} aria-hidden="true">
          {/* Chevron + Star */}
          <polygon points="31,14 25.5,17.8 27.6,11.3 22,7.4 28.9,7.4 31,1 33.1,7.4 40,7.4 34.4,11.3 36.5,17.8" />
          <polygon points="37,2 44.5,11 37,20 43.5,20 51,11 43.5,2" />
          <text
            x="38"
            y="36"
            textAnchor="middle"
            fontFamily={SANS_STACK}
            fontSize="11.5"
            fontWeight="900"
            letterSpacing="1"
          >
            CONVERSE
          </text>
        </svg>
      );

    case "crep-protect":
      return (
        <svg viewBox="0 0 74 42" fill="currentColor" className={className} aria-hidden="true">
          <g transform="rotate(-12 37 21)">
            <text
              x="37"
              y="22"
              textAnchor="middle"
              fontFamily={SANS_STACK}
              fontSize="20"
              fontWeight="900"
              fontStyle="italic"
              letterSpacing="-1"
            >
              crep
            </text>
            <text
              x="38"
              y="33"
              textAnchor="middle"
              fontFamily={SANS_STACK}
              fontSize="8.5"
              fontWeight="800"
              letterSpacing="1.2"
            >
              PROTECT
            </text>
          </g>
        </svg>
      );

    case "crocs":
      return (
        <svg viewBox="0 0 88 28" fill="currentColor" className={className} aria-hidden="true">
          <text
            x="44"
            y="21"
            textAnchor="middle"
            fontFamily={SANS_STACK}
            fontSize="21"
            fontWeight="900"
            letterSpacing="-0.8"
          >
            crocs
          </text>
        </svg>
      );

    case "hoka":
      return (
        <svg viewBox="0 0 84 28" fill="currentColor" className={className} aria-hidden="true">
          <text
            x="42"
            y="18"
            textAnchor="middle"
            fontFamily={SANS_STACK}
            fontSize="17"
            fontWeight="900"
            letterSpacing="2.2"
          >
            HOKA
          </text>
          <polygon points="10,22 74,22 70,25 14,25" />
        </svg>
      );

    case "jordan":
      return (
        <svg viewBox="0 0 44 44" fill="currentColor" className={className} aria-hidden="true">
          <circle cx="24" cy="10.5" r="2.2" />
          <circle cx="8" cy="9.5" r="2.6" />
          <path d="M9.5 11.4L19 16.6L22.2 14.5L26 16.5L32.8 18.8L31.9 20.5L25.4 18.8L23.5 23.2L30.2 31.6L34.4 39.2L31.7 40.3L26.8 33.4L20.4 26.8L15.8 33.5L12.1 40.6L9.7 39.5L13.7 31.5L18.7 23.6L19.6 18.4L8.7 13Z" />
        </svg>
      );

    case "lacoste":
      return (
        <svg viewBox="0 0 100 28" fill="currentColor" className={className} aria-hidden="true">
          <text
            x="4"
            y="19"
            fontFamily={SANS_STACK}
            fontSize="12"
            fontWeight="900"
            letterSpacing="1.2"
          >
            LACOSTE
          </text>
          {/* Minimalist crocodile silhouette */}
          <path d="M74 17C76 14.5 81 14 86 14.2L91 12.5L96 14.5L91.5 16L95 17.5L88 18.5H77L72 20L74 17Z" />
        </svg>
      );

    case "mizuno":
      return (
        <svg viewBox="0 0 100 28" fill="currentColor" className={className} aria-hidden="true">
          <path d="M6 19.5C11 11 19 8.5 24 12.2C21.5 14 17.8 16.5 16 19.5H13.5C14.8 16.5 17.5 14 19.2 12.9C15.8 11.8 11.5 14.2 9.2 19.5H6Z" />
          <text
            x="28"
            y="19.5"
            fontFamily={SANS_STACK}
            fontSize="14.5"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="0.6"
          >
            MIZUNO
          </text>
        </svg>
      );

    case "new-balance": {
      const maskId = `nb-${uid}`;
      return (
        <svg viewBox="0 0 76 40" fill="currentColor" className={className} aria-hidden="true">
          <defs>
            <mask id={maskId}>
              <rect width="76" height="40" fill="white" />
              <rect x="6" y="10" width="22" height="1.8" fill="black" />
              <rect x="6" y="14" width="20" height="1.8" fill="black" />
              <rect x="6" y="18" width="18" height="1.8" fill="black" />
              <rect x="6" y="22" width="16" height="1.8" fill="black" />
            </mask>
          </defs>
          <g mask={`url(#${maskId})`}>
            <text
              x="38"
              y="26"
              textAnchor="middle"
              fontFamily={SANS_STACK}
              fontSize="24"
              fontWeight="900"
              fontStyle="italic"
              letterSpacing="-1.5"
            >
              NB
            </text>
          </g>
          <text
            x="38"
            y="36"
            textAnchor="middle"
            fontFamily={SANS_STACK}
            fontSize="8.5"
            fontWeight="800"
            letterSpacing="0.3"
          >
            new balance
          </text>
        </svg>
      );
    }

    case "nike":
      return (
        <svg viewBox="0 0 76 34" fill="currentColor" className={className} aria-hidden="true">
          <text
            x="40"
            y="15"
            textAnchor="middle"
            fontFamily={SANS_STACK}
            fontSize="15"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="0.8"
          >
            NIKE
          </text>
          <path d="M11 19.5C9.5 24.5 14 28.5 21 26.8L68 14L24.5 23C18.5 24.2 15.5 21.8 17 17.5C15.2 18.2 12.2 19 11 19.5Z" />
        </svg>
      );

    case "on":
      return (
        <svg viewBox="0 0 36 42" fill="none" stroke="currentColor" className={className} aria-hidden="true">
          <circle cx="18" cy="11.5" r="7.5" strokeWidth="4.2" />
          <path d="M10.5 38V29C10.5 24.8 13.8 21.5 18 21.5C22.2 21.5 25.5 24.8 25.5 29V38" strokeWidth="4.2" strokeLinecap="butt" />
          <line x1="25.5" y1="21.5" x2="29" y2="21.5" strokeWidth="4.2" />
        </svg>
      );

    case "onitsuka-tiger":
      return (
        <svg viewBox="0 0 96 34" fill="currentColor" className={className} aria-hidden="true">
          <text
            x="48"
            y="15"
            textAnchor="middle"
            fontFamily={SANS_STACK}
            fontSize="12.5"
            fontWeight="800"
            fontStyle="italic"
          >
            Onitsuka
          </text>
          <text
            x="48"
            y="27"
            textAnchor="middle"
            fontFamily={SANS_STACK}
            fontSize="11.5"
            fontWeight="900"
            letterSpacing="1"
          >
            TIGER
          </text>
        </svg>
      );

    case "puma":
      return (
        <svg viewBox="0 0 88 32" fill="currentColor" className={className} aria-hidden="true">
          <text
            x="8"
            y="24"
            fontFamily={SANS_STACK}
            fontSize="18"
            fontWeight="900"
            letterSpacing="0.5"
          >
            PUMA
          </text>
          <path d="M62 12C66.5 8 73.5 7 79 9.5L76.5 12C73 10.5 68.5 11 65.5 13.5L68 15.5L64.5 16L62 12Z" />
        </svg>
      );

    case "reebok":
      return (
        <svg viewBox="0 0 92 32" fill="currentColor" className={className} aria-hidden="true">
          <polygon points="10,16 32,7 36,10 14,19" />
          <polygon points="17,20 35,13 38,15.5 20,22.5" />
          <text
            x="42"
            y="20"
            fontFamily={SANS_STACK}
            fontSize="13.5"
            fontWeight="800"
            fontStyle="italic"
          >
            Reebok
          </text>
        </svg>
      );

    case "salomon":
      return (
        <svg viewBox="0 0 92 28" fill="currentColor" className={className} aria-hidden="true">
          <rect x="4" y="5" width="18" height="18" />
          <text
            x="13"
            y="18.5"
            textAnchor="middle"
            fill="white"
            fontFamily={SANS_STACK}
            fontSize="13"
            fontWeight="900"
          >
            S
          </text>
          <text
            x="27"
            y="18.5"
            fontFamily={SANS_STACK}
            fontSize="13"
            fontWeight="900"
            letterSpacing="0.8"
          >
            SALOMON
          </text>
        </svg>
      );

    case "skechers":
      return (
        <svg viewBox="0 0 96 28" fill="currentColor" className={className} aria-hidden="true">
          <text
            x="48"
            y="18"
            textAnchor="middle"
            fontFamily={SANS_STACK}
            fontSize="14.5"
            fontWeight="900"
            fontStyle="italic"
            letterSpacing="0.4"
          >
            SKECHERS
          </text>
          <polygon points="12,22 84,22 81,24.5 10,24.5" />
        </svg>
      );

    case "under-armour":
      return (
        <svg viewBox="0 0 56 36" fill="none" stroke="currentColor" className={className} aria-hidden="true">
          <path d="M16 7V17C16 22 21.4 25 28 25C34.6 25 40 22 40 17V7" strokeWidth="4" strokeLinecap="round" />
          <path d="M16 29V19C16 14 21.4 11 28 11C34.6 11 40 14 40 19V29" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "vans":
      return (
        <svg viewBox="0 0 78 30" fill="currentColor" className={className} aria-hidden="true">
          <rect x="20" y="5.5" width="46" height="3.8" />
          <text
            x="10"
            y="24"
            fontFamily={SANS_STACK}
            fontSize="21"
            fontWeight="900"
            letterSpacing="-0.5"
          >
            VANS
          </text>
        </svg>
      );
  }
}
