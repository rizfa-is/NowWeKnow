// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-01',
  devtools: { enabled: true },
  modules: [
    '@nuxt/content',
    '@vueuse/nuxt',
    'motion-v/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'NowWeKnow — Coding worksheets that listen back',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width,initial-scale=1,maximum-scale=5' },
        { name: 'description', content: 'Voice-first digital coding worksheets for PAUD/TK and SD students. Designed for Interactive Flat Panels.' },
        { name: 'theme-color', content: '#0a1428' },
        { property: 'og:title', content: 'NowWeKnow — Coding worksheets that listen back' },
        { property: 'og:type', content: 'website' },
        { property: 'og:description', content: 'Voice-first digital coding worksheets for young learners.' },
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
