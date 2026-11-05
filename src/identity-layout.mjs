import {makeIdentityAnchor,alignIdentityPage,mapIdentityRegions} from './identity-alignment.mjs';
import {identityFields} from './identity-regions.mjs';
export async function prepareIdentityAnchors(source,group,regions,signal){
 const anchors={};for(const page of new Set(identityFields.flatMap(([f])=>(regions?.[f]||[]).map(a=>a.page)))){signal?.throwIfAborted();if(group.start+page-1>group.end)continue;const c=await source.render(group.start+page-1);try{anchors[page]=makeIdentityAnchor(c,regions,page)}finally{c.width=c.height=0}}return anchors;
}
export async function alignIdentityGroup(source,group,regions,anchors,signal){
 const matches={};for(const [page,anchor] of Object.entries(anchors)){signal?.throwIfAborted();if(!anchor||group.start+Number(page)-1>group.end)continue;const c=await source.render(group.start+Number(page)-1);try{matches[page]=alignIdentityPage(c,anchor)}finally{c.width=c.height=0}}signal?.throwIfAborted();return{regions:mapIdentityRegions(regions,matches),matches};
}
