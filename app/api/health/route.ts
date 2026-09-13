export const runtime='edge';
export async function GET(){return Response.json({ok:true,service:'bluo',time:new Date().toISOString()},{headers:{'Cache-Control':'no-store'}})}