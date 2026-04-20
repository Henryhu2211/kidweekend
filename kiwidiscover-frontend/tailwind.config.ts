import type { Config } from 'tailwindcss'

export default <Config>{
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#FF6B35',
          50: '#FFF4EE',
          100: '#FFE4D6',
          600: '#E55A25',
          700: '#CC4A18',
        },
        teal: {
          DEFAULT: '#4ECDC4',
          50: '#EDF9F8',
          100: '#D5F4F1',
          600: '#3AB5AD',
        },
        yellow: {
          DEFAULT: '#FFE66D',
          50: '#FFFBEB',
          100: '#FFF6CC',
        },
      },
      fontFamily: {
        sans: ['Nunito Sans', 'Source Han Sans CN', 'PingFang SC', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      spacing: {
        // 8px 网格
        '18': '4.5rem',
        '22': '5.5rem',
      },
      screens: {
        // 移动端优先断点
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
      },
    },
  },
}
