import assert from "node:assert/strict";
import test from "node:test";
const formulas = [];
globalThis.Roll = class {
 constructor(formula) { this.formula=formula; this.total=8; this.dice=[{total:8}]; formulas.push(formula); }
 async evaluate() { return this; }
 toMessage() {}
};
globalThis.ChatMessage={getSpeaker:()=>({}), create:()=>{}};
globalThis.CONST={ACTIVE_EFFECT_MODES:{ADD:2}};
globalThis.CONFIG={MGT2:{WEAPONS:{traits:{}},SPACE_MOUNTS:{}}};
globalThis.game={i18n:{localize:x=>x},settings:{get:()=>false},user:{id:"test"}};
globalThis.foundry={applications:{handlebars:{renderTemplate:async()=>""},ux:{TextEditor:{enrichHTML:async x=>x}}}};
const {rollAttack}=await import(process.env.DODGE_ROLL_MODULE || "../mgt2e/module/helpers/dice-rolls.mjs");
const actor={name:"Test",type:"traveller",system:{},getRollData:()=>({}),update:()=>{},getEffect:()=>({getFlag:()=>-2})};
const weapon={name:"Mounted weapon",system:{tl:7,quantity:1,weapon:{range:100,damage:"1D6",scale:"vehicle",skill:"gunner",traits:""}}};
async function attack(options={}) {
 formulas.length=0;
 await rollAttack(actor,weapon,{skillDM:-3,dm:-2,rangeDM:1,...options});
 return formulas.filter(x=>x.startsWith("2D6"));
}
for(const autoOption of ["single","aimed"]) {
 test(autoOption+": target Dodge applied once with other DMs",async()=>{
  const [formula]=await attack({autoOption,dodgeDM:-1,aimingActions:autoOption==="aimed"?1:0});
  assert.ok(formula.includes("- 1[Dodge]"));
  assert.equal(formula.split("[Dodge]").length-1,1);
  assert.ok(formula.includes("- 2[Reaction]"));
  assert.ok(formula.includes("- 2[DM]"));
  assert.ok(formula.includes("+ 1[Range]"));
  if (process.env.DODGE_ROLL_MODULE) {
   assert.equal(formula.includes("+ 1[Aimed]"), autoOption==="aimed");
  }
 });
}
test("numeric string accepted",async()=>assert.ok((await attack({dodgeDM:"-3"}))[0].includes("- 3[Dodge]")));
for(const dodgeDM of [undefined,null,0,"","bad",Infinity,-Infinity,NaN,2]) {
 test("no penalty for "+String(dodgeDM),async()=>assert.ok(!(await attack({dodgeDM}))[0].includes("[Dodge]")));
}
test("repeat does not accumulate target penalty",async()=>{
 const options={dodgeDM:-2,dm:-2};
 assert.equal((await attack(options))[0],(await attack(options))[0]);
 assert.equal(options.dm,-2);
});
test("full auto applies once per attack",async()=>{
 const rolls=await attack({dodgeDM:-1,autoOption:"full",shotsFired:3});
 assert.equal(rolls.length,3);
 for(const formula of rolls) assert.equal(formula.split("[Dodge]").length-1,1);
});

test("parry check does not receive target Dodge",async()=>{
 assert.ok(!(await attack({dodgeDM:-2,isParry:true}))[0].includes("[Dodge]"));
});
test("no-ammunition attack produces no attack roll",async()=>{
 assert.equal((await attack({dodgeDM:-2,autoOption:"noammo"})).length,0);
});
