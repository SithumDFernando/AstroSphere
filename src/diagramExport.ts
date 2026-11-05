import { spherePlate } from "./plate.ts";
import { deriveScene } from "./scene.ts";
import { emptyConstruction, triangleFrame, measurement } from "./triangle.ts";
import type { SavedScene } from "./storage.ts";
export type DiagramOptions = {
  triangle: boolean;
  grayscale: boolean;
  transparent: boolean;
  note: boolean;
  labels: boolean;
};
function escape(value: string) {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
}
export function diagramSvg(saved: SavedScene, options: DiagramOptions): string {
  const scene = deriveScene(saved.problem);
  if (options.triangle && scene.degeneracy)
    throw new Error(
      "The triangle is collapsed. Export the full sphere sketch instead.",
    );
  const work =
    saved.mode === "Redraw"
      ? emptyConstruction
      : saved.mode === "Demonstrate"
        ? {
            vertices: ["P", "Z", "S"] as const,
            sides: ["PZ", "PS", "ZS"] as const,
            labels: ["PZ", "PS", "ZS", "P"] as const,
          }
        : saved.construction;
  const frame = options.triangle
    ? triangleFrame(scene)!
    : { ...saved.frame, x: 320, y: 228, radius: 202 };
  const layers = { ...saved.layers, labels: options.labels, opaque: false };
  let svg = spherePlate(scene, {
    practice: true,
    construction: {
      vertices: [...work.vertices],
      sides: [...work.sides],
      labels: [...work.labels],
    },
    frame,
    layers,
    isolated: options.triangle,
    prefix: "export-",
  });
  svg = svg
    .replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ')
    .replace('viewBox="65 0 510 458"', 'viewBox="45 -60 550 600"');
  const ink = options.grayscale ? "#222" : "#994622",
    horizon = options.grayscale ? "#333" : "#397d6b",
    equator = options.grayscale ? "#555" : "#587f97";
  const style =
    "<style>.reference,.side{fill:none;stroke-linecap:round;stroke-linejoin:round}.reference{stroke-width:1.5}.horizon{stroke:" +
    horizon +
    "}.equator{stroke:" +
    equator +
    "}.meridian,.hourCircle{stroke:#666}.side{stroke:" +
    ink +
    ";stroke-width:2.5}.back{stroke-dasharray:4 5}.plane{stroke:none;fill:#ddd;opacity:.15}.dot{fill:" +
    ink +
    ";stroke:white;stroke-width:1}.hit-point,.hit-line{display:none}text{font-family:Georgia,serif;fill:" +
    ink +
    "}.vertex text{font-size:20px}.cardinal text{font-size:12px}.measure{font-size:14px;paint-order:stroke;stroke:white;stroke-width:3px}.far .dot{fill:white;stroke:#555}</style>";
  svg = svg
    .replace(/<stop stop-color="var\([^"]*\)"\/>/g, '<stop stop-color="#fff"/>')
    .replace(/stop-color="var\([^"]*\)"/g, 'stop-color="#eee"');
  const bg = options.transparent
    ? ""
    : '<rect x="45" y="-60" width="550" height="600" fill="white"/>';
  const note = options.note
    ? '<text x="65" y="508" font-size="10" fill="#333">H west-positive · Azimuth north through east · Geometric horizon</text><text x="65" y="524" font-size="10" fill="#333">No refraction · Spherical angles · Fixed-star geometry</text>'
    : "";
  let values = "";
  if (!options.triangle && options.labels && !scene.degeneracy) {
    svg = svg.replace(/<text class="measure"[^>]*>[^<]*<\/text>/g, "");
    values = work.labels
      .map(
        (id, i) =>
          '<text x="' +
          (65 + (i % 2) * 240) +
          '" y="' +
          (474 + Math.floor(i / 2) * 16) +
          '" font-size="12">' +
          (id === "P" ? "∠ZPS" : id) +
          " = " +
          measurement(scene, id)?.toFixed(2) +
          "°</text>",
      )
      .join("");
  }
  const title = (saved.name.match(/.{1,50}/g) || [])
    .map(
      (line, i) =>
        '<text x="65" y="' +
        (-35 + i * 16) +
        '" font-size="14">' +
        escape(line) +
        "</text>",
    )
    .join("");
  return svg
    .replace(/(<svg[^>]*>)/, "$1" + style + bg + title)
    .replace("</svg>", values + note + "</svg>");
}
export async function pngBlob(
  svg: string,
  size: number,
  transparent = false,
): Promise<Blob> {
  if (!Number.isInteger(size) || size < 512 || size > 4096)
    throw new Error("Choose a PNG size between 512 and 4096.");
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d")!;
    if (!transparent) {
      context.fillStyle = "white";
      context.fillRect(0, 0, size, size);
    }
    context.drawImage(image, 0, 0, size, size);
    return await new Promise((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("PNG rendering failed.")),
        "image/png",
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
