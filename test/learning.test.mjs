import test from "node:test";
import assert from "node:assert/strict";
import {checkAngle,exercises,exerciseScenario,solution} from "../src/learning.ts";
test("answer checks handle wraparound, radians and undefined bearings",()=>{
 assert.match(checkAngle("360",0,"degrees",true),/Correct/);
 assert.match(checkAngle(String(Math.PI/2),90,"radians"),/Correct/);
 assert.match(checkAngle("undefined",null,"degrees",true),/Correct/);
 assert.match(checkAngle("180",0,"degrees",true),/quadrant/);
 assert.match(checkAngle("",12,"degrees"),/finite/);
});
test("curated exercises define reproducible solutions including degeneracy",()=>{
 assert.equal(exercises.length,5);
 for(const ex of exercises)assert.ok(solution(exerciseScenario(ex)).length>=6);
 assert.match(solution(exerciseScenario(exercises[4]))[0],/coincident/);
});
