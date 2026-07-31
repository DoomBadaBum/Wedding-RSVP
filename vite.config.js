import { defineConfig } from 'vite';

// GitHub Pages project site: https://<user>.github.io/Wedding-RSVP/
const isGitHubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  base: isGitHubPages ? '/Wedding-RSVP/' : '/',
});
