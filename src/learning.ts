import { dailyVisibility, horizon } from "./geometry.ts";
import type { Scenario } from "./problem.ts";
import { blankDraft, parseDraft } from "./problem.ts";
import { deriveScene } from "./scene.ts";

export const exercises = [
  {
    id: "EX-01",
    title: "Star altitude and azimuth",
    lat: "30",
    dec: "20",
    hour: "45",
    template: "T1",
    goal: "Construct P–Z–S and check the azimuth quadrant.",
  },
  {
    id: "EX-02",
    title: "Meridian culmination",
    lat: "40",
    dec: "-10",
    hour: "0",
    template: "T2",
    goal: "Relate zenith distance to latitude and declination.",
  },
  {
    id: "EX-03",
    title: "Equatorial observer",
    lat: "0",
    dec: "0",
    hour: "90",
    template: "T1",
    goal: "Compare the east and west horizon by changing H to −90°.",
  },
  {
    id: "EX-04",
    title: "Circumpolar star",
    lat: "60",
    dec: "60",
    hour: "0",
    template: "T3",
    goal: "Classify daily visibility and find the altitude range.",
  },
  {
    id: "EX-05",
    title: "Observer at the pole",
    lat: "90",
    dec: "20",
    hour: "45",
    template: "T1",
    goal: "Explain why P and Z coincide and azimuth needs an orientation convention.",
  },
] as const;
export function exerciseScenario(ex: (typeof exercises)[number]): Scenario {
  return parseDraft({
    ...blankDraft,
    latitude: ex.lat,
    declination: ex.dec,
    hour: ex.hour,
    template: ex.template,
    question: ex.goal,
  }).scenario!;
}
export function hints(s: Scenario): string[] {
  if (Math.abs(s.latitudeDeg) === 90)
    return [
      "Locate the celestial pole relative to the observer’s vertical.",
      "Compare the positions of P and Z.",
      "At the north pole P = Z, h = δ. Geographic north supplies no unique azimuth reference.",
    ];
  if (s.template === "T3")
    return [
      "Consider the highest and lowest points on the star’s daily path.",
      "Evaluate the altitude at H = 0° and H = 180°.",
      "Compare both extrema with 0°. A positive minimum means the star never sets; a zero extremum means tangency.",
    ];
  return [
    "Which great-circle distance connects the star to the point overhead?",
    "Connect P, Z and S. The polar distances are 90° − φ and 90° − δ.",
    "Apply the spherical cosine rule to obtain sin h = sin φ sin δ + cos φ cos δ cos H. Use both north and east components for the azimuth quadrant.",
  ];
}
export function checkAngle(
  raw: string,
  expected: number | null,
  units: string,
  circular = false,
) {
  if (expected === null)
    return raw.trim().toLowerCase() === "undefined"
      ? "Correct."
      : "This bearing is undefined. Enter undefined.";
  if (!raw.trim() || !Number.isFinite(Number(raw)))
    return "Enter a finite number.";
  const value = Number(raw) * (units === "radians" ? 180 / Math.PI : 1);
  const delta = circular
    ? Math.abs(((((value - expected) % 360) + 540) % 360) - 180)
    : Math.abs(value - expected);
  if (delta <= 0.01) return "Correct within 0.01°.";
  return circular
    ? "Check the quadrant. Azimuth increases from north through east; use atan2(E, N)."
    : "Check zenith distance, its complement, and your units.";
}
export function solution(s: Scenario) {
  const result = horizon(s),
    day = dailyVisibility(s.latitudeDeg, s.declinationDeg);
  const steps = [
    "Identify P (north celestial pole), Z (zenith) and S (star).",
    "PZ = 90° − φ; PS = 90° − δ; ZS = 90° − h. The interior angle at P is the principal |H|.",
    "Choose the spherical cosine rule for sides: cos ZS = cos PZ cos PS + sin PZ sin PS cos H.",
    "Thus sin h = sin φ sin δ + cos φ cos δ cos H.",
    "E = −cos δ sin H; N = cos φ sin δ − sin φ cos δ cos H. Compute A = atan2(E,N), wrapped to 0°–360°.",
    "h = " +
      result.altitudeDeg.toFixed(5) +
      "°; A = " +
      (result.azimuthDeg === null
        ? "undefined"
        : result.azimuthDeg.toFixed(5) + "°") +
      ".",
  ];
  if (s.template === "T3")
    steps.push(
      "Daily altitude range " +
        day.minAltitudeDeg +
        "° to " +
        day.maxAltitudeDeg +
        "°. Classification: " +
        day.kind +
        ". Tangency touches the horizon without crossing it.",
    );
  const issue = deriveScene(s).degeneracy;
  if (issue)
    steps.unshift(
      issue +
        " Use coordinate vectors to retain a valid altitude; the collapsed triangle has no ordinary interior-angle solution.",
    );
  return steps;
}
