const s=require('sharp');(async()=>{
const W=4800,H=3600;
const ai=await s('/root/sr/alamance_x4.png').resize(W,H,{kernel:'lanczos3'}).toBuffer();
const plain=await s('/root/sr/alamance.jpg').resize(W,H,{kernel:'lanczos3'}).toBuffer();
// crop around the Alamance portico / flag area (approx 2/5 width, 55% height)
const box={left:Math.round(W*0.02),top:Math.round(H*0.62),width:640,height:480};
const a=await s(ai).extract(box).toBuffer(), p=await s(plain).extract(box).toBuffer();
const box2={left:Math.round(W*0.66),top:Math.round(H*0.28),width:640,height:480};
const a2=await s(ai).extract(box2).toBuffer(), p2=await s(plain).extract(box2).toBuffer();
await s({create:{width:1290,height:970,channels:3,background:'#000'}}).composite([{input:p,left:0,top:0},{input:a,left:650,top:0},{input:p2,left:0,top:490},{input:a2,left:650,top:490}]).resize(1000).jpeg({quality:55}).toFile('/root/shot/cmp.jpg');
})();
