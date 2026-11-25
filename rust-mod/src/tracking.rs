use super::motion::Point;
use super::*;
use js_sys::Math;
fn field(object: &V, key: &'static str) -> E {
    prop(object.clone(), s(key))
}
fn number(object: &V, key: &'static str) -> Result<f64, Flow> {
    Ok(field(object, key)?.as_f64().unwrap_or(f64::NAN))
}
fn set(object: &V, key: &'static str, value: V) -> E {
    op("set", &[object.clone(), s(key), value])
}
fn length(array: &V) -> Result<usize, Flow> {
    Ok(number(array, "length")? as usize)
}
fn point(value: &V) -> Result<Point, Flow> {
    Ok(Point {
        x: number(value, "x")?,
        y: number(value, "y")?,
        at: number(value, "at")?,
    })
}
fn make_point(x: f64, y: f64, at: f64) -> E {
    let p = op("object", &[])?;
    for (key, value) in [("x", x), ("y", y), ("at", at)] {
        let _ = op(
            "define",
            &[p.clone(), s(key), s("value"), n(value), b(true)],
        )?;
    }
    Ok(p)
}
pub(super) fn track(parent: &V, args: &V) -> Result<Option<V>, V> {
    let result: Result<Option<V>, Flow> = (|| {
        let key = prop(args.clone(), n(0.0))?;
        let active = prop(args.clone(), n(3.0))?;
        let tracks = get(parent, "tracks")?;
        if !truth(&active) {
            let _ = op("call1", &[field(&tracks, "delete")?, tracks, key])?;
            return Ok(Some(u()));
        }
        let (Some(x), Some(y)) = (
            prop(args.clone(), n(1.0))?.as_f64(),
            prop(args.clone(), n(2.0))?.as_f64(),
        ) else {
            return Ok(Some(u()));
        };
        if !x.is_finite() || !y.is_finite() {
            return Ok(Some(u()));
        }
        let at_value = op("call0", &[get(parent, "clock")?, u()])?;
        let Some(at) = at_value.as_f64().filter(|v| v.is_finite()) else {
            return Ok(None);
        };
        let meta = prop(args.clone(), n(4.0))?;
        let meta = if meta.is_undefined() {
            op("object", &[])?
        } else {
            meta
        };
        let generation = field(&meta, "generation")?;
        let weapon = field(&meta, "weapon")?;
        let mut target = op(
            "call1",
            &[field(&tracks, "get")?, tracks.clone(), key.clone()],
        )?;
        let mut samples = if truth(&target) {
            field(&target, "samples")?
        } else {
            u()
        };
        let mut last = if truth(&target) && length(&samples)? > 0 {
            Some(point(&prop(
                samples.clone(),
                n((length(&samples)? - 1) as f64),
            )?)?)
        } else {
            None
        };
        let changed = if !generation.is_undefined() && truth(&target) {
            let old = field(&target, "generation")?;
            !old.is_undefined() && !truth(&op("binary", &[s("==="), generation.clone(), old])?)
        } else {
            false
        };
        if !truth(&target) || last.is_some_and(|p| at < p.at || at - p.at > 500.0) || changed {
            samples = op("array", &[])?;
            target = op("object", &[])?;
            for (k, v) in [
                ("samples", samples.clone()),
                ("weapon", n(-1.0)),
                ("generation", generation.clone()),
            ] {
                let _ = op("define", &[target.clone(), s(k), s("value"), v, b(true)])?;
            }
            let _ = op(
                "call2",
                &[field(&tracks, "set")?, tracks, key, target.clone()],
            )?;
            last = None;
        }
        if let Some(p) = last {
            let distance = Math::hypot(x - p.x, y - p.y);
            if distance > 200.0 || (at - p.at >= 8.0 && distance / (at - p.at) * 1000.0 > 1800.0) {
                samples = op("array", &[])?;
                let _ = set(&target, "samples", samples.clone())?;
                let _ = set(&target, "curve", V::NULL)?;
                last = None;
            }
        }
        if !weapon.is_undefined() {
            let _ = set(&target, "weapon", weapon)?;
        }
        if !generation.is_undefined() {
            let _ = set(&target, "generation", generation)?;
        }
        let new_observation = last.is_none() || at - number(&target, "observationAt")? >= 8.0;
        let p = make_point(x, y, at)?;
        if new_observation {
            let _ = op("push", &[samples.clone(), p])?;
            let _ = set(&target, "observationAt", n(at))?;
        } else {
            let len = length(&samples)?;
            let _ = op("set", &[samples.clone(), n((len - 1) as f64), p])?;
        }
        loop {
            let len = length(&samples)?;
            let expired = if len > 2 {
                at - number(&prop(samples.clone(), n(0.0))?, "at")? > 1250.0 + 1e-6
            } else {
                false
            };
            if len <= 32 && !expired {
                break;
            }
            let _ = op("call0", &[field(&samples, "shift")?, samples.clone()])?;
        }
        let _ = set(&target, "timedSamples", u())?;
        let before = field(&target, "curve")?;
        let len = length(&samples)?;
        let mut window = Vec::with_capacity(8);
        for i in len.saturating_sub(8)..len {
            let p = point(&prop(samples.clone(), n(i as f64))?)?;
            if at - p.at <= 600.0 + 1e-6 {
                window.push(p);
            }
        }
        let _ = set(&target, "strafe", u())?;
        let curve = if let Some(curve) = motion::circle(&window) {
            let compatible = truth(&before)
                && number(&before, "omega")? * curve.omega > 0.0
                && (number(&before, "radius")? - curve.radius).abs() < 0.15 * curve.radius
                && Math::hypot(
                    number(&before, "cx")? - curve.cx,
                    number(&before, "cy")? - curve.cy,
                ) < (0.15 * curve.radius).max(8.0);
            let streak = if compatible {
                number(&before, "streak")? + if new_observation { 1.0 } else { 0.0 }
            } else {
                1.0
            };
            motion::circle_object(curve, streak)?
        } else {
            V::NULL
        };
        let _ = set(&target, "curve", curve)?;
        Ok(Some(u()))
    })();
    result.map_err(|e| match e {
        Flow::Throw(v) => v,
        _ => js_sys::Error::new("Invalid tracking completion").into(),
    })
}
pub(super) fn motion(parent: &V, args: &V) -> Result<Option<V>, V> {
    let result: Result<Option<V>, Flow> = (|| {
        let key = prop(args.clone(), n(0.0))?;
        let at = prop(args.clone(), n(1.0))?;
        let at = if at.is_undefined() {
            op("call0", &[get(parent, "clock")?, u()])?
        } else {
            at
        };
        let Some(at) = at.as_f64() else {
            return Ok(None);
        };
        let tracks = get(parent, "tracks")?;
        let target = op("call1", &[field(&tracks, "get")?, tracks, key])?;
        if !truth(&target) {
            return Ok(Some(V::NULL));
        }
        let raw = field(&target, "samples")?;
        let len = length(&raw)?;
        if len == 0 {
            return Ok(Some(V::NULL));
        }
        let last = point(&prop(raw.clone(), n((len - 1) as f64))?)?;
        if at < last.at || at - last.at > 350.0 {
            return Ok(Some(V::NULL));
        }
        let samples = field(&target, "timedSamples")?;
        let samples = if nullish(&samples) {
            let values = op("call1", &[get(parent, "sampleTimes")?, u(), raw])?;
            let _ = set(&target, "timedSamples", values.clone())?;
            values
        } else {
            samples
        };
        let len = length(&samples)?;
        let mut tail = Vec::with_capacity(4);
        for i in len.saturating_sub(4)..len {
            tail.push(point(&prop(samples.clone(), n(i as f64))?)?);
        }
        let (mut vx, mut vy) = (0.0, 0.0);
        if tail.len() > 1 {
            let previous = tail[tail.len() - 2];
            let dt = (last.at - previous.at) / 1000.0;
            if dt > 0.0 {
                let dx = last.x - previous.x;
                let dy = last.y - previous.y;
                let mut first = 0;
                for i in (1..=tail.len().saturating_sub(2)).rev() {
                    let a = tail[i - 1];
                    let b = tail[i];
                    let c = tail[i + 1];
                    let ax = b.x - a.x;
                    let ay = b.y - a.y;
                    let bx = c.x - b.x;
                    let by = c.y - b.y;
                    if ax * bx + ay * by <= 0.0
                        || (ax * by - ay * bx).abs()
                            > 0.5 * Math::hypot(ax, ay) * Math::hypot(bx, by)
                    {
                        first = i;
                        break;
                    }
                }
                if dx != 0.0 || dy != 0.0 {
                    let (mut st, mut sx, mut sy, mut stt, mut stx, mut sty, mut count) =
                        (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
                    for p in &tail[first..] {
                        let t = (p.at - last.at) / 1000.0;
                        st += t;
                        sx += p.x;
                        sy += p.y;
                        stt += t * t;
                        stx += t * p.x;
                        sty += t * p.y;
                        count += 1.0;
                    }
                    let d = count * stt - st * st;
                    if d > 1e-10 {
                        vx = (count * stx - st * sx) / d;
                        vy = (count * sty - st * sy) / d;
                    }
                }
            }
        }
        if Math::hypot(vx, vy) > 1800.0 {
            vx = 0.0;
            vy = 0.0;
        }
        let curve = field(&target, "curve")?;
        let curve = if !nullish(&curve) && number(&curve, "streak")? >= 2.0 {
            curve
        } else {
            V::NULL
        };
        if truth(&curve) {
            let radius = number(&curve, "radius")?;
            let omega = number(&curve, "omega")?;
            let angle = number(&curve, "angle")?;
            vx = -radius * omega * Math::sin(angle);
            vy = radius * omega * Math::cos(angle);
        }
        let object = op("object", &[])?;
        for (k, v) in [
            ("x", n(last.x)),
            ("y", n(last.y)),
            ("vx", n(vx)),
            ("vy", n(vy)),
            ("age", n((at - last.at) / 1000.0)),
            ("weapon", field(&target, "weapon")?),
            ("samples", n(len as f64)),
            ("curve", curve),
        ] {
            let _ = op("define", &[object.clone(), s(k), s("value"), v, b(true)])?;
        }
        Ok(Some(object))
    })();
    result.map_err(|e| match e {
        Flow::Throw(v) => v,
        _ => js_sys::Error::new("Invalid motion completion").into(),
    })
}
