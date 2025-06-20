import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  base: '/dane-county-schools/',
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'geodata/*.pbf', // only .pbf files
          dest: 'geodata'
        }
      ]
    })
  ]
});
