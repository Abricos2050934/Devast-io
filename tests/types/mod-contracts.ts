declare const typedMod: ModRuntime;
declare const typedModel: BallisticAim;
declare const typedEnvironment: AimEnvironment;
declare const typedPrediction: Prediction;

typedMod.setSetting('JitterEnabled', true);
typedMod.setSetting('JitterSpeed', 360);
typedMod.onMove(5);
typedModel.track('p:1', 10, 20, true, {weapon: 5});
typedEnvironment.send([6, 45], {kind: 'aim'});
if (typedPrediction.valid) {
 const angle: number = typedPrediction.angle;
}

// @ts-expect-error Boolean settings reject numeric values.
typedMod.setSetting('JitterEnabled', 42);
// @ts-expect-error Numeric settings reject strings.
typedMod.setSetting('JitterSpeed', 'fast');
// @ts-expect-error Movement masks are numeric.
typedMod.onMove('up');
// @ts-expect-error Model identities are explicit string keys.
typedModel.track(1, 10, 20, true);
// @ts-expect-error Native command fields cannot contain strings.
typedEnvironment.send([6, '45'], {kind: 'aim'});
if (!typedPrediction.valid) {
 // @ts-expect-error A failed prediction has no usable shot angle.
 const angle: number = typedPrediction.angle;
}
