export const environment = {
  production: true,

  endpointUrlApiCs: 'https://backend-api-cs-6038.onrender.com/api/v1',

  exampleEndpoint400: 'https://httpbin.org/status/400',
  exampleEndpoint404: 'https://httpbin.org/status/404',
  exampleEndpoint401: 'https://httpbin.org/status/401',
  exampleEndpoint403: 'https://httpbin.org/status/403',
  exampleEndpoint500: 'https://httpbin.org/status/500',
  exampleEndpoint502: 'https://httpbin.org/status/502',
  exampleEndpointDelay: 'https://httpbin.org/delay/5',

  endpointApiCities: 'https://api.countrystatecity.in/v1',
  apiKeysCities: [
    process.env['NG_APP_KEY_CITIES_1'],
    process.env['NG_APP_KEY_CITIES_2'],
    process.env['NG_APP_KEY_CITIES_3'],
    process.env['NG_APP_KEY_CITIES_4'],
    process.env['NG_APP_KEY_CITIES_5'],
    process.env['NG_APP_KEY_CITIES_6'],
  ],
  apiKeyCarto: process.env['NG_APP_KEY_CARTO'],

  endpointBaseCountryMap: 'https://raw.githubusercontent.com',
  endpointNaturalEarthAdmin1: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson',
};
