export const APP_CONFIG = {
  name: "QEVIA",
  tagline: "Clareza para sua vida financeira.",
  description: "Gestão financeira pessoal com clareza, tecnologia e simplicidade.",
  version: "0.1.0",
  currency: "BRL",
  locale: "pt-BR",
  themeColor: "#0F172A",
} as const;

export const ROUTES = {
  home: "/",
  app: "/app",
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/recuperar-senha",
    completeProfile: "/completar-cadastro",
  },
  settings: "/configuracoes",
} as const;
