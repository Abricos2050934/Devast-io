// Numeric kernels for the existing strafe fits. Control flow and thresholds
// match the owned source; only numeric storage/loops move out of JsValue.
use super::*;
use js_sys::Math;

#[derive(Clone, Copy)]
pub(super) struct Point {
    pub x: f64,
    pub y: f64,
    pub at: f64,
}
#[derive(Clone, Copy)]
pub(super) struct Circle {
    pub cx: f64,
    pub cy: f64,
    pub radius: f64,
    pub omega: f64,
    pub angle: f64,
    pub at: f64,
}
fn fit_circle(samples: &[Point]) -> Option<Circle> {
    if samples.len() < 5 {
        return None;
    }
    let last = *samples.last()?;
    if last.at - samples[0].at < 250.0 - 1e-6 {
        return None;
    }
    let count = samples.len() as f64;
    let points: Vec<_> = samples
        .iter()
        .map(|p| Point {
            x: p.x - last.x,
            y: p.y - last.y,
            at: (p.at - last.at) / 1000.0,
        })
        .collect();
    let (mut mx, mut my, mut mz) = (0.0, 0.0, 0.0);
    for p in &points {
        mx += p.x / count;
        my += p.y / count;
        mz += (p.x * p.x + p.y * p.y) / count;
    }
    let (mut xx, mut xy, mut yy, mut xz, mut yz) = (0.0, 0.0, 0.0, 0.0, 0.0);
    for p in &points {
        let x = p.x - mx;
        let y = p.y - my;
        let z = p.x * p.x + p.y * p.y - mz;
        xx += x * x;
        xy += x * y;
        yy += y * y;
        xz += x * z;
        yz += y * z;
    }
    let det = xx * yy - xy * xy;
    let orthogonal =
        Math::sqrt(((xx + yy - Math::hypot(xx - yy, 2.0 * xy)) / (2.0 * count)).max(0.0));
    if det < 1e-7 * ((xx + yy) * (xx + yy)) || orthogonal < 0.55 {
        return None;
    }
    let cx = (xz * yy - yz * xy) / (2.0 * det);
    let cy = (yz * xx - xz * xy) / (2.0 * det);
    let radius = Math::sqrt(cx * cx + cy * cy + mz - 2.0 * cx * mx - 2.0 * cy * my);
    let tolerance = (radius * 0.01).max(1.5).min(3.0);
    if !radius.is_finite() || radius + tolerance < 50.0 || radius > 5000.0 {
        return None;
    }
    let (mut previous, mut angle, mut first, mut st, mut sa, mut stt, mut sta) =
        (None, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
    let mut rates = Vec::with_capacity(points.len());
    let mut angles = Vec::with_capacity(points.len());
    for (i, p) in points.iter().enumerate() {
        if (Math::hypot(p.x - cx, p.y - cy) - radius).abs() > tolerance {
            return None;
        }
        let a = Math::atan2(p.y - cy, p.x - cx);
        if let Some(before) = previous {
            let delta = Math::atan2(Math::sin(a - before), Math::cos(a - before));
            let dt = p.at - points[i - 1].at;
            if dt <= 0.0 {
                return None;
            }
            angle += delta;
            rates.push(delta / dt);
        } else {
            first = a;
            angle = a;
        }
        previous = Some(a);
        angles.push(angle);
        st += p.at;
        sa += angle;
        stt += p.at * p.at;
        sta += p.at * angle;
    }
    let omega = (count * sta - st * sa) / (count * stt - st * st);
    let speed = omega.abs() * radius;
    let sweep = (angle - first).abs();
    let sagitta = radius * (1.0 - Math::cos(sweep / 2.0));
    let intercept = (sa - omega * st) / count;
    let mut residual = 0.0;
    for (i, p) in points.iter().enumerate() {
        let e = radius * (angles[i] - intercept - omega * p.at);
        residual += e * e;
    }
    let timing = Math::sqrt(residual / count);
    if speed < 30.0
        || speed > 1200.0
        || sweep < 0.08
        || sweep > std::f64::consts::PI
        || sagitta < 1.5
        || timing > 2.5
        || rates.iter().any(|r| r * omega <= 0.0)
    {
        return None;
    }
    Some(Circle {
        cx: last.x + cx,
        cy: last.y + cy,
        radius,
        omega,
        angle,
        at: last.at,
    })
}
pub(super) fn circle(samples: &[Point]) -> Option<Circle> {
    if samples.len() < 5 {
        return None;
    }
    let last = *samples.last()?;
    let previous = samples[samples.len() - 2];
    if last.at - samples[0].at < 250.0 - 1e-6 {
        return None;
    }
    let dx = previous.x - last.x;
    let dy = previous.y - last.y;
    if dx == 0.0 && dy == 0.0 {
        return None;
    }
    if samples
        .iter()
        .all(|p| (p.x - last.x) * dy == (p.y - last.y) * dx)
    {
        return None;
    }
    for count in (5..=samples.len()).rev() {
        if let Some(fit) = fit_circle(&samples[samples.len() - count..]) {
            return Some(fit);
        }
    }
    None
}
pub(super) fn circle_object(circle: Circle, streak: f64) -> E {
    let object = op("object", &[])?;
    for (key, value) in [
        ("cx", circle.cx),
        ("cy", circle.cy),
        ("radius", circle.radius),
        ("omega", circle.omega),
        ("angle", circle.angle),
        ("at", circle.at),
        ("streak", streak),
    ] {
        let _ = op(
            "define",
            &[object.clone(), s(key), s("value"), n(value), b(true)],
        )?;
    }
    Ok(object)
}
fn points(args: &V) -> EPoints {
    let array = prop(args.clone(), n(0.0))?;
    if !js_sys::Array::is_array(&array) {
        return Ok(None);
    }
    let Some(len) = prop(array.clone(), s("length"))?.as_f64() else {
        return Ok(None);
    };
    if len > 256.0 {
        return Ok(None);
    }
    let mut out = Vec::with_capacity(len as usize);
    for i in 0..len as usize {
        let point = prop(array.clone(), n(i as f64))?;
        let (Some(x), Some(y), Some(at)) = (
            prop(point.clone(), s("x"))?.as_f64(),
            prop(point.clone(), s("y"))?.as_f64(),
            prop(point, s("at"))?.as_f64(),
        ) else {
            return Ok(None);
        };
        if !x.is_finite() || !y.is_finite() || !at.is_finite() {
            return Ok(None);
        }
        out.push(Point { x, y, at });
    }
    Ok(Some(out))
}
type EPoints = Result<Option<Vec<Point>>, Flow>;
fn model(
    parent: &V,
    id: f64,
    name: &str,
    speed: f64,
    vx: f64,
    vy: f64,
    variables: &[(&'static str, f64)],
) -> E {
    let env = op("scope", &[parent.clone()])?;
    for (key, value) in variables {
        let _ = op("decl", &[env.clone(), s(key), s("const")])?;
        let _ = op("init", &[env.clone(), s(key), n(*value)])?;
    }
    let offset = op(
        "fn",
        &[
            n(id),
            env,
            s("offset"),
            n(1.0),
            b(false),
            b(false),
            b(false),
        ],
    )?;
    let object = op("object", &[])?;
    for (key, value) in [
        ("name", V::from_str(name)),
        ("speed", n(speed)),
        ("vx", n(vx)),
        ("vy", n(vy)),
        ("offset", offset),
    ] {
        let _ = op(
            "define",
            &[object.clone(), s(key), s("value"), value, b(true)],
        )?;
    }
    Ok(object)
}
fn segment_error(rows: &[(f64, f64)], start: usize, end: usize) -> f64 {
    let count = (end - start) as f64;
    let (mut st, mut sz, mut stt, mut stz, mut szz) = (0.0, 0.0, 0.0, 0.0, 0.0);
    for &(t, z) in &rows[start..end] {
        st += t;
        sz += z;
        stt += t * t;
        stz += t * z;
        szz += z * z;
    }
    let variance = stt - st * st / count;
    let covariance = stz - st * sz / count;
    (szz - sz * sz / count
        - if variance > 0.0 {
            covariance * covariance / variance
        } else {
            0.0
        })
    .max(0.0)
}
pub(super) fn fit_strafe(parent: &V, args: &V) -> Result<Option<V>, V> {
    let result: Result<Option<V>, Flow> = (|| {
        let Some(samples) = points(args)? else {
            return Ok(None);
        };
        let count = samples.len();
        if count < 6 {
            return Ok(Some(V::NULL));
        }
        let last = samples[count - 1];
        let previous = samples[count - 2];
        if last.at - samples[0].at < 420.0 || last.x == previous.x && last.y == previous.y {
            return Ok(Some(V::NULL));
        }
        let (mut ax, mut ay, mut extent) = (0.0, 0.0, 0.0);
        for p in &samples {
            let x = p.x - last.x;
            let y = p.y - last.y;
            let d = Math::hypot(x, y);
            if d > extent {
                ax = x;
                ay = y;
                extent = d;
            }
        }
        if extent < 13.0 {
            return Ok(Some(V::NULL));
        }
        ax /= extent;
        ay /= extent;
        let mut rows = Vec::with_capacity(count);
        for p in &samples[..count - 1] {
            let x = p.x - last.x;
            let y = p.y - last.y;
            if (y * ax - x * ay).abs() > 2.5 {
                return Ok(Some(V::NULL));
            }
            rows.push(((p.at - last.at) / 1000.0, x * ax + y * ay));
        }
        let (mut tt, mut tz) = (0.0, 0.0);
        for &(t, z) in &rows {
            tt += t * t;
            tz += t * z;
        }
        let slope = tz / tt;
        let mut line_error = 0.0;
        for &(t, z) in &rows {
            let e = z - slope * t;
            line_error += e * e;
        }
        if line_error / (count as f64) < 2.1 {
            return Ok(Some(V::NULL));
        }
        // a, b, omega, amplitude, error, score
        let mut best: Option<[f64; 6]> = None;
        let mut terms = Vec::with_capacity(rows.len());
        for index in 0..=21 {
            let omega = 0.75 + index as f64 * 0.25;
            terms.clear();
            for &(t, z) in &rows {
                terms.push((Math::cos(omega * t) - 1.0, Math::sin(omega * t), z));
            }
            let (mut cc, mut cs, mut ss, mut cz, mut sz) = (0.0, 0.0, 0.0, 0.0, 0.0);
            for &(c, s, z) in &terms {
                cc += c * c;
                cs += c * s;
                ss += s * s;
                cz += c * z;
                sz += s * z;
            }
            let det = cc * ss - cs * cs;
            if det < 1e-9 {
                continue;
            }
            let a = (cz * ss - sz * cs) / det;
            let b = (sz * cc - cz * cs) / det;
            let amplitude = Math::hypot(a, b);
            if amplitude < 10.0 || amplitude > 240.0 || amplitude * omega > 700.0 {
                continue;
            }
            let (mut error, mut peak) = (0.0, 0.0_f64);
            for &(c, s, z) in &terms {
                let r = (z - a * c - b * s).abs();
                error += r * r;
                peak = peak.max(r);
            }
            if peak > 3.25 || error / count as f64 > 1.9 * 1.9 || error > line_error * 0.24 {
                continue;
            }
            let ratio = amplitude / 110.0;
            let score = error / (count as f64) + 0.1 * (ratio * ratio);
            if best.map_or(true, |old| score < old[5]) {
                best = Some([a, b, omega, amplitude, error, score]);
            }
        }
        let Some([a, bv, omega, amplitude, error, _]) = best else {
            return Ok(Some(V::NULL));
        };
        rows.push((0.0, 0.0));
        for split in 3..=rows.len() - 3 {
            if segment_error(&rows, 0, split) + segment_error(&rows, split, rows.len())
                < error * 0.6
            {
                return Ok(Some(V::NULL));
            }
        }
        Ok(Some(model(
            parent,
            138.0,
            "strafe",
            amplitude * omega,
            ax * bv * omega,
            ay * bv * omega,
            &[
                ("a", a),
                ("b", bv),
                ("omega", omega),
                ("axisX", ax),
                ("axisY", ay),
            ],
        )?))
    })();
    result.map_err(|error| match error {
        Flow::Throw(value) => value,
        _ => js_sys::Error::new("Invalid numeric fit completion").into(),
    })
}
pub(super) fn fit_drifting(parent: &V, args: &V) -> Result<Option<V>, V> {
    let result: Result<Option<V>, Flow> = (|| {
        let Some(samples) = points(args)? else {
            return Ok(None);
        };
        let count = samples.len();
        if count < 10 {
            return Ok(Some(V::NULL));
        }
        let last = samples[count - 1];
        let previous = samples[count - 2];
        let span = (last.at - samples[0].at) / 1000.0;
        if span < 0.65 || last.x == previous.x && last.y == previous.y {
            return Ok(Some(V::NULL));
        }
        let rows: Vec<_> = samples[..count - 1]
            .iter()
            .map(|p| ((p.at - last.at) / 1000.0, p.x - last.x, p.y - last.y))
            .collect();
        let (mut tt, mut tx, mut ty) = (0.0, 0.0, 0.0);
        for &(t, x, y) in &rows {
            tt += t * t;
            tx += t * x;
            ty += t * y;
        }
        let slope_x = tx / tt;
        let slope_y = ty / tt;
        let mut straight_error = 0.0;
        for &(t, x, y) in &rows {
            let ex = x - slope_x * t;
            let ey = y - slope_y * t;
            straight_error = straight_error + ex * ex + ey * ey;
        }
        if straight_error < (rows.len() * 9) as f64 {
            return Ok(Some(V::NULL));
        }
        // ax, ay, bx, by, omega, driftX, driftY, amplitude, error
        let mut best: Option<[f64; 9]> = None;
        let mut basis = Vec::with_capacity(rows.len());
        for index in 0..=28 {
            let omega = 2.0 + index as f64 * 0.25;
            if omega * span < 4.0 {
                continue;
            }
            basis.clear();
            for &(t, _, _) in &rows {
                basis.push((Math::cos(omega * t) - 1.0, Math::sin(omega * t)));
            }
            let (mut tc, mut ts) = (0.0, 0.0);
            for (i, &(t, _, _)) in rows.iter().enumerate() {
                tc += basis[i].0 * t;
                ts += basis[i].1 * t;
            }
            let slope_c = tc / tt;
            let slope_s = ts / tt;
            let (mut cc, mut cs, mut ss, mut cx, mut sx, mut cy, mut sy) =
                (0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0);
            for (i, &(t, x, y)) in rows.iter().enumerate() {
                let c = basis[i].0 - slope_c * t;
                let s = basis[i].1 - slope_s * t;
                cc += c * c;
                cs += c * s;
                ss += s * s;
                cx += c * x;
                sx += s * x;
                cy += c * y;
                sy += s * y;
            }
            let det = cc * ss - cs * cs;
            if det <= 1e-6 {
                continue;
            }
            let ax = (cx * ss - sx * cs) / det;
            let ay = (cy * ss - sy * cs) / det;
            let bx = (sx * cc - cx * cs) / det;
            let by = (sy * cc - cy * cs) / det;
            let ra = Math::hypot(ax, ay);
            let rb = Math::hypot(bx, by);
            let amplitude = Math::hypot(ra, rb);
            if amplitude < 12.0
                || amplitude * omega > 700.0
                || (ax * by - ay * bx).abs() > amplitude * 1.8
            {
                continue;
            }
            let dx = slope_x - slope_c * ax - slope_s * bx;
            let dy = slope_y - slope_c * ay - slope_s * by;
            let (axis_x, axis_y) = if ra > rb {
                (ax / ra, ay / ra)
            } else {
                (bx / rb, by / rb)
            };
            if (dx * axis_y - dy * axis_x).abs() < 20.0 || Math::hypot(dx, dy) > 600.0 {
                continue;
            }
            let (mut error, mut peak) = (0.0, 0.0_f64);
            for (i, &(t, x, y)) in rows.iter().enumerate() {
                let (c, s) = basis[i];
                let r = Math::hypot(x - dx * t - ax * c - bx * s, y - dy * t - ay * c - by * s);
                error += r * r;
                peak = peak.max(r);
            }
            if peak > 4.0 || error > ((4 * rows.len()) as f64).min(0.15 * straight_error) {
                continue;
            }
            if best.map_or(true, |old| error < old[8]) {
                best = Some([ax, ay, bx, by, omega, dx, dy, amplitude, error]);
            }
        }
        let Some([ax, ay, bx, by, omega, dx, dy, amplitude, _]) = best else {
            return Ok(Some(V::NULL));
        };
        Ok(Some(model(
            parent,
            148.0,
            "drifting-strafe",
            Math::hypot(dx, dy) + amplitude * omega,
            dx + bx * omega,
            dy + by * omega,
            &[
                ("ax", ax),
                ("ay", ay),
                ("bx", bx),
                ("by", by),
                ("omega", omega),
                ("driftX", dx),
                ("driftY", dy),
            ],
        )?))
    })();
    result.map_err(|error| match error {
        Flow::Throw(value) => value,
        _ => js_sys::Error::new("Invalid numeric fit completion").into(),
    })
}
