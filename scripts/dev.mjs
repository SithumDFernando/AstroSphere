import "./build.mjs";
import { context } from "esbuild";
import { fileURLToPath } from "node:url";

const server = await context({});
try {
  const { port } = await server.serve({
    servedir: fileURLToPath(new URL("../dist/", import.meta.url)),
    host: "127.0.0.1",
    port: 5173,
  });
  console.log(`AstroSphere Studio: http://127.0.0.1:${port}/`);
  console.log("Source changes rebuild the studio. Refresh your browser to see them.");
} catch (error) {
  await server.dispose();
  throw error;
}
