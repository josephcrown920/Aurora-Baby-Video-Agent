export type ProductionAgentRole="director"|"vision"|"character"|"world"|"storyboard"|"workflow"|"editor"|"audio"|"qa";
export type ProductionAgent={role:ProductionAgentRole;model:string;objective:string;dependsOn:ProductionAgentRole[]};
export const PRODUCTION_AGENTS:ProductionAgent[]=[
{role:"director",model:"dola-seed-2-1-turbo-260628",objective:"Understand brief, constraints and acceptance criteria.",dependsOn:[]},
{role:"vision",model:"deepseek-v4-1-flash-260910",objective:"Analyze image/video evidence and identify edit/generation opportunities.",dependsOn:["director"]},
{role:"character",model:"glm-5-3-flash-260828",objective:"Lock identity, wardrobe, blocking, gaze and interactions for every character.",dependsOn:["vision"]},
{role:"world",model:"glm-5-3-flash-260828",objective:"Lock location, props, lighting, time and camera continuity.",dependsOn:["vision"]},
{role:"storyboard",model:"dola-seed-2-1-turbo-260628",objective:"Convert intent into shot-level generation and transition plans.",dependsOn:["character","world"]},
{role:"workflow",model:"dola-seed-2-1-turbo-260628",objective:"Select or parameterize a saved ComfyUI workflow for generation, compositing or repair.",dependsOn:["storyboard"]},
{role:"editor",model:"dola-seed-2-1-turbo-260628",objective:"Map approved plans into reversible multi-layer timeline operations.",dependsOn:["storyboard","workflow"]},
{role:"audio",model:"glm-5-3-flash-260828",objective:"Build dialogue, music and SFX track instructions and sync points.",dependsOn:["storyboard","editor"]},
{role:"qa",model:"deepseek-v4-1-flash-260910",objective:"Inspect visual continuity and request targeted repairs only.",dependsOn:["editor","audio"]},
];
export function productionGraph(){return PRODUCTION_AGENTS.map(a=>({...a}));}