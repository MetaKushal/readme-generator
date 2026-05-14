/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            "colors": {
                "on-primary-container": "#5c5c7e",
                "primary": "#5c5b7e",
                "on-secondary": "#ffffff",
                "tertiary-fixed": "#e0e3e5",
                "on-secondary-fixed": "#002112",
                "primary-fixed-dim": "#c4c3eb",
                "secondary": "#426651",
                "secondary-container": "#c3ecd2",
                "surface-tint": "#5c5b7e",
                "on-surface": "#0d1c2e",
                "tertiary-fixed-dim": "#c4c7c9",
                "outline": "#78767e",
                "background": "#f8f9ff",
                "tertiary-container": "#d8dadc",
                "on-tertiary-fixed-variant": "#444749",
                "secondary-fixed-dim": "#a8d0b6",
                "on-tertiary-container": "#5c5f61",
                "surface-container-low": "#eff4ff",
                "on-secondary-container": "#486c57",
                "on-primary-fixed-variant": "#444465",
                "primary-container": "#d8d6ff",
                "on-primary-fixed": "#181837",
                "on-surface-variant": "#47464d",
                "surface-container-high": "#dce9ff",
                "inverse-on-surface": "#eaf1ff",
                "tertiary": "#5c5f61",
                "on-background": "#0d1c2e",
                "surface-container-lowest": "#ffffff",
                "surface-container-highest": "#d5e3fc",
                "error-container": "#ffdad6",
                "on-error-container": "#93000a",
                "secondary-fixed": "#c3ecd2",
                "on-tertiary-fixed": "#191c1e",
                "surface-dim": "#ccdbf3",
                "outline-variant": "#c8c5ce",
                "surface-variant": "#d5e3fc",
                "on-primary": "#ffffff",
                "surface-container": "#e6eeff",
                "on-error": "#ffffff",
                "inverse-surface": "#233144",
                "inverse-primary": "#c4c3eb",
                "surface": "#f8f9ff",
                "error": "#ba1a1a",
                "on-tertiary": "#ffffff",
                "primary-fixed": "#e2dfff",
                "on-secondary-fixed-variant": "#2a4e3a",
                "surface-bright": "#f8f9ff"
            },
            "borderRadius": {
                "DEFAULT": "1rem",
                "lg": "2rem",
                "xl": "3rem",
                "full": "9999px"
            },
            "spacing": {
                "container-padding": "2rem",
                "gutter": "1.5rem",
                "unit": "4px",
                "section-gap": "4rem"
            },
            "fontFamily": {
                "label-sm": ["Plus Jakarta Sans", "sans-serif"],
                "headline-lg": ["Plus Jakarta Sans", "sans-serif"],
                "headline-md": ["Plus Jakarta Sans", "sans-serif"],
                "body-md": ["Plus Jakarta Sans", "sans-serif"]
            },
            "fontSize": {
                "label-sm": ["13px", {"lineHeight": "1", "letterSpacing": "0.05em", "fontWeight": "600"}],
                "headline-lg": ["36px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                "headline-md": ["24px", {"lineHeight": "1.3", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                "body-md": ["16px", {"lineHeight": "1.6", "letterSpacing": "0", "fontWeight": "400"}]
            }
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}