// The same landmarks describe the visible circuit and the race timeline.
export const TRACK_POINTS = [
  [-14,.38,9],[-5,.38,9],[7,.38,9],[14,.38,8],[17,.38,4],[15,.38,0],
  [10,.38,-1],[5,.38,-1],[2,.38,-5],[5,.38,-9],[0,.38,-11],[-8,.38,-10],
  [-12,.38,-6],[-17,.38,-6],[-19,.38,-2],[-18,.38,4],
];
export const TRACK_ZONES = [
  {from:0,to:.22,name:'Start / finish straight',label:'POWER ZONE',kind:'straight',pace:.68},
  {from:.22,to:.36,name:'T1 · Sunset hairpin',label:'BRAKE → TURN',kind:'corner',pace:1.42},
  {from:.36,to:.49,name:'Back straight',label:'ACCELERATE',kind:'straight',pace:.75},
  {from:.49,to:.62,name:'T2–3 · The switchback',label:'CHANGE DIRECTION',kind:'corner',pace:1.5},
  {from:.62,to:.76,name:'North sweep',label:'HOLD THE LINE',kind:'sweep',pace:1.0},
  {from:.76,to:.91,name:'T4 · Technical corner',label:'BRAKE → TURN',kind:'corner',pace:1.32},
  {from:.91,to:1,name:'Final acceleration',label:'POWER DOWN',kind:'straight',pace:.72},
];
export function trackZone(distance){const progress=((distance%1)+1)%1;return TRACK_ZONES.find(zone=>progress>=zone.from&&progress<zone.to)||TRACK_ZONES[0];}
export const TRACK_LANDMARKS=[{at:.27,name:'T1',label:'SUNSET HAIRPIN'},{at:.54,name:'T2–3',label:'SWITCHBACK'},{at:.82,name:'T4',label:'TECHNICAL CORNER'},{at:.08,name:'START',label:'POWER STRAIGHT'}];
