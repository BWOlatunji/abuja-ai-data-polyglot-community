import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import netlify from "@astrojs/netlify";

export default defineConfig({
  site: "https://abuja-ai-data-polyglot.netlify.app",
  output: "server",
  adapter: netlify(),
  integrations: [tailwind({ applyBaseStyles: false })],
  server: {
    port: 4321,
  },
});
