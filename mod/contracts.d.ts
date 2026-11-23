/** Opaque fields belonging to the native game or the recovered dat.GUI API. */
type NativeValue = any;
type NativeFunction = (this: NativeValue, ...args: NativeValue[]) => NativeValue;
interface NativeDictionary { [key: string]: NativeValue; [key: symbol]: NativeValue }
type SettingValue = boolean | number | string;
interface Point { x: number; y: number }
interface View extends Point { scale: number; ctx: CanvasRenderingContext2D }
type WirePacket = number[];
type AimPhase = 'aim' | 'anti';
type KeyCode = string;

interface AimSettings {
 AimBotEnabled:boolean; AimbotSpearEnabled:boolean; spearSpeed:number; spearMaxRange:number;
 spearHandFwd:number; spearHandSide:number; spearStabDeg:number; spearAutoThrow:boolean;
 hideAimbotAngle:boolean; hidePlayerAngle:boolean; target:'players'|'ghouls'|'all';
 TargetTeammate:boolean; resolverType:'linear'|1; mouseFovEnable:boolean; mouseFov:number;
 distanceCoefficient:number; offsetCoefficient:number; aimStick:number; aimSmooth:number;
 aimMaxRange:number; aimHoldMs:number; leadCap:number; visualizeResolving:boolean;
 visualizeResolvingColor:string; autoFire:boolean; lockId:number; AntiAimbot:boolean;
 antiAimCoefficient:number; ShowRealAngles:'never'|'always'|'withAim';
 AimbotKey:KeyCode; AntiAimbotKey:KeyCode; JitterKey:KeyCode; HideAngleKey:KeyCode; ModMenuKey:KeyCode;
}
interface ModSettings extends AimSettings {
 [key:string]:SettingValue;
 [key:symbol]:NativeValue;
 SAutoLootEnabled:boolean; FAutoLootEnabled:boolean; LootDataEnabled:boolean; AutoTakeEnabled:boolean;
 AutoBuiledEnabled:boolean; AntiKickEnabled:boolean; AdaptiveAimEnabled:boolean;
 predictionAutoSpeed:boolean; predictionLatencyMs:number; bulletSpeedCoefficient:number;
 VideoAimEnabled:boolean; VideoAimHudEnabled:boolean; videoPingMs:number; videoPingSteps:number; videoAimSteps:number;
 videoDelayMs:number; videoDelaySendMs:number;
 HidePlayerLabels:boolean; OpenEverythingByClick:boolean; RightClickDoors:boolean;
 ShowBuildingOwner:boolean; AutoBuiledKey:KeyCode; SAutoLootKey:KeyCode; FAutoLootKey:KeyCode;
 AutoTakeKey:KeyCode; ShowMines:boolean; ShowWires:boolean; ShowPlayerHitbox:boolean;
 XrayBuildings:boolean; Xraytransparency:number; XrayKey:KeyCode; PlayersListKey:KeyCode;
 PlayersListEnabled:boolean; SpamChatEnabled:boolean; SpamChatText:string; PlayerId:string;
 hit:boolean; ShowPosition:boolean; ShowNamesOnMap:boolean; KarmaAboveHead:boolean;
 TeamClanColor:string; EnemyClanColor:string; NicknameColor:string; AutoOpenSlotsInv:boolean;
 token:string; userId:number; tokenId:number; Token:string; zoomFactor:number; showFunctionList:boolean;
 JitterEnabled:boolean; JitterSpeed:number;
}
interface AimConstraints { limits:Record<string,[number,number]>; choices:Record<string,readonly SettingValue[]> }

interface MotionSample extends Point { at:number }
interface MotionMeta { generation?:number; weapon?:number }
interface CircleMotion { cx:number; cy:number; radius:number; omega:number; angle:number; at:number; streak?:number }
interface StrafeMotion { name:'strafe'|'drifting-strafe'; speed:number; vx:number; vy:number; offset(time:number):Point }
interface MotionTrack { samples:MotionSample[]; weapon:number; generation?:number; observationAt?:number; curve?:CircleMotion|null; strafe?:StrafeMotion|null; timedSamples?:MotionSample[] }
interface MotionState extends Point { vx:number; vy:number; age:number; weapon:number; samples:number; curve:CircleMotion|null; strafe?:StrafeMotion|null }
interface WeaponProfile { speed?:number; range?:number; muzzle?:number; forward?:number; side?:number }
interface SpeedModel { speed:number; source:string; samples:number }
interface PredictionFailure { valid:false; status:'stale-position'|'unreachable'|'no-target'|'session-ended'; distance?:number; speed?:number; source?:string; samples?:number }
interface PredictionSuccess extends SpeedModel { valid:true; status:'tracking'; angle:number; x:number; y:number; ox:number; oy:number; distance:number; flight:number; motionModel:'linear'|'circle'|'strafe'|'drifting-strafe'; selfVelocity:Point; targetVelocity:Point; video?:VideoAimTiming&{iterations:number;exactFallback:boolean} }
interface VideoAimTiming { enabled:boolean; avgPing:number; currentPing:number|null; deltaPing:number|null; samples:number; source:'configured'|'measured'; leadMs:number; totalDelayMs:number; aimSteps:number }
type Prediction = PredictionFailure|PredictionSuccess;
interface BallisticAim {
 track(key:string,x:number,y:number,active:boolean,meta?:MotionMeta):void;
 motion(key:string,at?:number):MotionState|null;
 projectile(key:string,weapon:number,speed:number,nominal?:number):void;
 speedFor(weapon:number,profile?:WeaponProfile):SpeedModel;
 resolve(selfKey:string,targetKey:string,profile?:WeaponProfile):Prediction;
 intercept(rx:number,ry:number,vx:number,vy:number,speed:number,muzzle?:number,side?:number):number|null;
 sampleRtt(milliseconds:number):boolean; timingInfo():VideoAimTiming; resetTiming():void;
 reset():void;
}

interface AimTarget extends Point {
 id:number; active:boolean; weapon:number; gear:number; weaponIdx?:number;
 prevX:number[]; prevY:number[]; movedAt?:number; prevMovedAt?:number; prevMovedAt2?:number;
 update(x:number,y:number,weapon:number):void; setInactive():void;
}
interface AimLine { x1:number; y1:number; x2:number; y2:number; alpha:number; width:number; color:string; outOfRange:boolean; reset(x1?:number,y1?:number,x2?:number,y2?:number):void; set(x1:number,y1:number,x2:number,y2:number,outOfRange?:boolean|number):void }
interface AimTargets {
 players:AimTarget[]; ghouls:AimTarget[]; lines:AimLine[]; obstacles:NativeValue[];
 mousePosition:Point; mouseMapCords:Point; shifting:boolean; menuActive:boolean;
 menuX:number; menuY:number; menuWidth:number; menuHeight:number; lastId:number; myLastMoveDirection:number;
 selfPosition:Point; selfFromPacket?:number; selfWeapon?:number; cameraCenter?:Point;
 getPlayerById(id:number):AimTarget|undefined; getGhoulByUid(id:number):AimTarget|undefined;
 resetLines():void; resetAll():void;
}
interface AimState {
 lastAngle:number; targetPlayer:AimTarget|null; currentTarget?:AimTarget|null; _heldTarget?:AimTarget|null;
 _heldUntil?:number; _smoothAngle?:number; selfId:number; dead:boolean; mouseDown:boolean; refreshing:boolean;
 _refreshTimer:number|null; prediction?:Prediction;
 resolve():number; spearResolve():number; aimSmooth(angle:number):number;
 findNearestPlayerTo(point:Point|undefined,range:number):AimTarget|null;
 isPlayerCandidate(target:AimTarget|undefined|null):boolean;
 targetVelocity(target:AimTarget):Point; aimPoint(self:Point|undefined,target:AimTarget|null,coefficient:number):Point;
 myId():number; send(packet:WirePacket):void; isDead():boolean; onDeath():void;
 scheduleRefresh():void; refresh():void; packetAngle(fallback:number):number;
 hasTarget():boolean; getSelf():Point; findTarget(from:Point,range:number):AimTarget|null;
}
interface AimModule {
 targets:AimTargets; aim:AimState; Target:new(id:number)=>AimTarget; waitingForKey?:boolean;
 start():void; installMenu(gui:Gui):{folders:Gui[];controllers:GuiController[]};
 render(ctx:CanvasRenderingContext2D,view:View,pixelScale?:number):void;
 tick():unknown; refreshTargets():unknown; position(kind:'players'|'ghouls',id:number,x:number,y:number,weapon:number,packed?:number):unknown;
 afterFire():unknown; afterRelease():void; onMove(mask:number):boolean; antiTick():unknown;
 onHandshake():void; onOtherDie(id:number):void; sync():void; ensure(id:number):void; dispose():void;
}
interface CorePlayerInfo { εᴎ༩:number; і٥ࠂ?:number }
interface CoreClanInfo { ᴎ०︁?:number }
interface DynamicArray<T> extends Array<T> { [key:string]:NativeValue; [key:symbol]:NativeValue }
interface CoreWorld { PLAYER:Point&{id:number;εᴎ༩:number}; players:DynamicArray<CorePlayerInfo|undefined>; ⲣ８ߌ:DynamicArray<CoreClanInfo|undefined> }
interface AimWindow {
 Math:Math; JSON:JSON;
 setInterval(fn:()=>void,delay:number):number|null; setTimeout(fn:()=>void,delay:number):number|null;
 clearInterval(id:number|null):void; clearTimeout(id:number|null):void;
 addEventListener(type:string,fn:NativeFunction,options?:boolean|AddEventListenerOptions):void;
 Aimbot?:AimState; GetAllTargets?:AimTargets; AimbotRefresh?:()=>void;
}
interface AimEnvironment {
 window:Window; document:Document; rotationTick():void;
 beginCycle(kind:AimPhase):void; endCycle():void;
 send(packet:WirePacket,source:{kind:AimPhase}):boolean;
 persist():void; setKey(key:string,value:string):void;
 selfId():number; selfPosition():Point;
 playerInfo(id:number):{exists:boolean;team:number;membership?:number};
 clanInfo(id:number):{exists:boolean;membership?:number};
}
interface AimCoreEnvironment extends AimEnvironment { world:CoreWorld }

interface GuiController<T=NativeValue> {
 property:string; domElement:HTMLElement; __onFinishChange?:NativeFunction;
 name(label:string):this; onChange(fn:(value:T)=>void):this; onFinishChange(fn:(value:T)=>void):this;
 updateDisplay():this; setValue(value:T):this; getValue():T; listen():this;
}
interface Gui {
 __controllers:GuiController[]; __folders:Record<string,Gui>; domElement:HTMLElement;
 add<T extends object,K extends keyof T&string>(object:T,key:K,...range:NativeValue[]):GuiController<T[K]>;
 addColor<T extends object,K extends keyof T&string>(object:T,key:K):GuiController<T[K]>;
 addFolder(name:string):Gui; open():void; updateDisplay():void; destroy():void;
}
interface GuiConstructor { new(options?:{width?:number}):Gui; _keydownHandler:EventListener }

interface NativeEntity extends Point,NativeDictionary { id:number; е̝ހ:number; Іࡈ５:number; ᴘ४１:number; state:number; αބ̞:number; ᴀܛ٤:number }
interface NativePlayer extends NativeEntity { ᴘϲ๓:number[][]; ᅠܓ̃:number }
interface NativeMetadata extends NativeDictionary { ο̏︇:string; а༤̘:number; ᴌ̗ⲟ?:number; ᴑᴄ̉:number }
interface NativeClan extends NativeDictionary { ոᚄރ:number; name?:string }
interface NativeDescriptor extends NativeDictionary { detail?:{name:string}; width?:number[]; height?:number[]; ࡀ︂̄:number }
interface NativeWorld extends NativeDictionary { ᅠᏧ‍:NativePlayer; ᴎ︃ᄉ:NativeMetadata[]; ﾠࡅ‍:NativeClan[] }
type ServerRow = [NativeValue,NativeValue,NativeValue,NativeValue,NativeValue,NativeValue,NativeValue,NativeValue,NativeValue];
interface NativeSender extends NativeFunction { __devastAimTransport?:(packet:WirePacket)=>void }
interface NativeNetwork extends NativeDictionary {
 state:number; ᴎᚂρ:NativeSender; ѕ᠋༢:NativeFunction; ρ٨٨:NativeFunction;
 ԁᴄࡃ?:ServerRow; ոߒ४:ServerRow[]; ⲅ︊ᄃ:(url:string,success:NativeFunction,failure?:NativeFunction)=>void;
 іߐ̸:(text:string)=>number|undefined;
}
interface NativeEntities extends NativeDictionary { border:{border:number;ⲣᴑᴏ:number[]}[]; ᴎ̂２:NativeEntity[][] }
interface NativeBridge {
 world:NativeWorld; network:NativeNetwork; input?:NativeDictionary&{angle:number};
 entities:NativeEntities; types?:NativeDictionary[]; items:NativeDescriptor[]; graphics:NativeDictionary;
 renderer?:NativeDictionary; karma:NativeValue[]; categories:{player:number;loot:number;projectile?:number};
 synchronizedRender?:boolean; nativePlayerLabels?:boolean; aimSend?:(packet:WirePacket)=>void;
 loginKey?:string; restoreFailureKey?:string; preflightKey?:string; errorKey?:string; pendingKey?:string;
 integrity?:()=>number; integrityPatched?:()=>boolean; health?:()=>number|undefined;
 isManualDoor?:(descriptor:NativeDescriptor)=>boolean; adWaiting?:()=>boolean; returnToMenu?:()=>void;
 homeControlsVisible?:()=>boolean; canShowHome?:()=>boolean; reconnect?:()=>void;
 view:()=>View; chatActive?:()=>boolean;
}
interface EntityRecord { type:number; e:NativeEntity }
interface LootItem { acquire:boolean; id:number }
interface KeyCapture { key:string; previous:SettingValue; control:GuiController; element:HTMLInputElement }
interface RequestOwnership { settled:boolean }
interface BuildIdentity { fingerprint:string; nativeSha256:string }
interface ModRuntime extends NativeDictionary {
 settings:ModSettings; targets:AimTargets; aim:AimState; aimModule:AimModule;
 setSetting<K extends keyof ModSettings&string>(key:K,value:ModSettings[K]):void; dispose():void; beforeFire():boolean;
 onMove(move:number):boolean; nativePacketAngle(angle:number):number;
 sampleAimRtt(milliseconds:number):boolean; aimTiming():VideoAimTiming;
}
interface RemoteLoader { state:'loading'|'loaded'|'failed'; url:string; error?:string }
interface Window { __devastMod?:ModRuntime; __devastClientLoaded?:boolean; __devastRemoteLoader?:RemoteLoader; dat?:{GUI:GuiConstructor}; Widget?:NativeDictionary }
interface Document { getElementById(id:'can'):HTMLCanvasElement|null; getElementById(id:'chatInput'|'nicknameInput'):HTMLInputElement|null }
interface WireBucket { at:number; socket:number|null; packets:number; bytes:number }
interface TrafficBucket { at:number; socket:number|null; commands:number; byOpcode:Record<number,number> }
interface CombatCommands { angle:number; attack:number; release:number }
interface BrowserFailures { exceptions:number; unhandledRejections:number; resourceErrors:number }
interface SocketTraffic { id:number; openForMs:number|null; receiveGapMs:number|null; sentMessages:number; sentBytes:number; sendGapMs:number|null; receivedMessages:number; localCloseSource:string|null }
interface SocketTrace { id:number; openedAt:number|null; lastReceiveAt:number|null; receivedMessages:number; lastSendAt:number|null; sentMessages:number; sentBytes:number; localCloseSource:string|null }
interface PickupRequest { at:number; socket:number|null; id:number|null; itemType:number|null; distance:number|null; nativeInteraction:number|null; nativeSelectedId:number|null; repeatGapMs:number|null }
interface ConnectionEvent {
 type:string; at:number; state:number; transport:SocketTraffic|null; commandsInLast2s:CombatCommands; browserFailures:BrowserFailures;
 pickupRequestsBeforeEnd?:PickupRequest[]; failureCode?:number; deathOpcode?:number; deathPacketLength?:number; deathPrefixHex?:string;
 [key:string]:unknown;
}
interface PlayerListRow { row:HTMLDivElement; number:HTMLSpanElement; nick:HTMLButtonElement; clan:HTMLSpanElement; name?:string; tag?:string; nickColor?:string; clanColor?:string }
interface PendingDoor { type:number; id:number; owner:number; wasOpen:boolean; at:number }
interface AdGate { widget:NativeDictionary; done:boolean; failed:boolean; deadline:number; callback?:NativeFunction; wrapped?:NativeFunction }
interface ReconnectState { status:string; attempts:number; refreshFailures:number; armed:boolean; next:number; pending:boolean; generation:number; phase:string; freshRequired:boolean; freshUsed:boolean; autoBlocked:boolean; lastFailureCode:number; gatewayRecoveries:number; sessionEnded:boolean; awaitingPlay:boolean; initialHomeRecoveries:number; deadline?:number }
interface JitterState { angle:number; updatedAt:number|null; lastSentAt:number; fireUntil:number; spinning:boolean; deferredDirections:number }
type SafeLookupWeakMap<K extends object,V> = Omit<WeakMap<K,V>,'get'> & {get(key:K|undefined|null):V|undefined};
type PositionStyle = Pick<CSSStyleDeclaration,'left'|'top'|'width'|'height'>;
type SocketObserverHandlers = {[K in keyof WebSocketEventMap]:(event:WebSocketEventMap[K])=>void};
type ModDomEvent<K extends keyof WindowEventMap> = WindowEventMap[K] & {readonly target:(EventTarget&{nodeType?:number;closest?:Element['closest']})|null};
