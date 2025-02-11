export default {
  config: {
    head: {
      favicon: './extensions/favicon.ico',
    },
    locales: [ 'es' ],
    /*auth:{ logo: './extensions/logoauth.png' },
    menu:{ logo: './extensions/logo.png' },*/
    theme: {
      colors: {
        primary100: '#f6ecfc',
        primary200: '#e0c1f4',
        primary500: '#ac73e6',
        primary600: '#9736e8',
        primary700: '#8312d1',
        danger700: '#b72b1a'
      },
    },
    tutorials: false,
    notifications: {
      release: false
    },
    translations: {
      es: {
        'app.components.LeftMenu.navbrand.title': 'JacquardTex',
        'app.components.LeftMenu.navbrand.workplace': 'Administrador',
        'Auth.form.welcome.title': 'Bienvenido!',
        'Auth.form.welcome.subtitle': 'JacquardTex',
      },
    },
  },
  bootstrap(app) {
    console.log(app);
  },
};
