/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                nirin: {
                    bg: '#FAFAFA', // Off-white background
                    dark: '#FFFFFF', // White background
                    card: '#F3F4F6', // Light gray for cards
                    orange: '#0046FF', // Nirin Blue
                    text: '#666666', // Nirin Gray for text
                    muted: '#999999', // Lighter Gray muted
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Modern sans-serif
            }
        },
    },
    plugins: [],
}
