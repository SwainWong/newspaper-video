/** One camera on one source image: source coordinates remain stable throughout. */
export type Crop={x:number;y:number;width:number;height:number};
export function evidenceCamera(imageWidth:number,imageHeight:number,crop:Crop,progress:number){
 if(imageWidth<=0||imageHeight<=0||crop.width<=0||crop.height<=0||crop.x<0||crop.y<0||crop.x+crop.width>imageWidth||crop.y+crop.height>imageHeight)throw Error('Evidence crop outside source');
 const t=Math.max(0,Math.min(1,progress));const p=t*t*(3-2*t);
 const start=Math.min(900/imageWidth,760/imageHeight),end=Math.min(900/crop.width,600/crop.height);
 const scale=start+(end-start)*p;
 const x=(900-imageWidth*start)/2*(1-p)+((900-crop.width*end)/2-crop.x*end)*p;
 const y=(760-imageHeight*start)/2*(1-p)+((600-crop.height*end)/2-crop.y*end)*p;
 return {x,y,scale,height:760-160*p,progress:p};
}
