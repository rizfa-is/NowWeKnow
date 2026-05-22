// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',
  devtools: { enabled: true },
  modules: [
    '@nuxt/content',
    '@vueuse/nuxt',
    'motion-v/nuxt',
  ],
  css: ['~/assets/css/main.css', '~/assets/css/prose.css'],
  app: {
    head: {
      title: 'NowWeKnow — Why is the sky blue?',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width,initial-scale=1,maximum-scale=5' },
        { name: 'description', content: 'An immersive scrollytelling explainer of Rayleigh scattering — and why our sky looks blue.' },
        { name: 'theme-color', content: '#0a1428' },
        { property: 'og:title', content: 'NowWeKnow — Why is the sky blue?' },
        { property: 'og:type', content: 'website' },
        { property: 'og:description', content: 'An immersive scrollytelling explainer of Rayleigh scattering.' },
      ],
      htmlAttrs: { lang: 'en' },
    },
  },
  content: {
    build: {
      markdown: {
        toc: { depth: 3, searchDepth: 3 },
      },
    },
  },
  features: {
    inlineStyles: false,
  },
  experimental: {
    payloadExtraction: true,
  },
})
