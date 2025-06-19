export const environment = {
  keycloak: {
    url: import.meta.env.VITE_KEYCLOAK_URL || 'https://oneid.etp.taskstation-23.com/',
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'oneid',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'react-client',
    clientSecret: import.meta.env.VITE_KEYCLOAK_CLIENT_SECRET || '0CPUu4q1S1uC1to01s7PmP4ri2UzOfqD',
  },
  admin: {
    username: import.meta.env.VITE_KEYCLOAK_ADMIN_USERNAME || 'admin@gmail.com',
    password: import.meta.env.VITE_KEYCLOAK_ADMIN_PASSWORD || 'admin_password',
  }
}; 