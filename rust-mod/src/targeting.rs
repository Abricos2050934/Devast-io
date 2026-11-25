use super::*;
fn field(o: &V, k: &'static str) -> E {
    prop(o.clone(), s(k))
}
fn num(v: V) -> Result<f64, Flow> {
    if let Some(n) = v.as_f64() {
        Ok(n)
    } else {
        Ok(op("unary", &[s("+"), v])?.as_f64().unwrap_or(f64::NAN))
    }
}
fn xy(v: &V) -> Result<(f64, f64), Flow> {
    Ok((num(field(v, "x")?)?, num(field(v, "y")?)?))
}
fn distance(a: (f64, f64), b: (f64, f64)) -> f64 {
    let dx = a.0 - b.0;
    let dy = a.1 - b.1;
    (dx * dx + dy * dy).sqrt().floor()
}
fn snapshot_player(
    ent: &V,
    own_id: &V,
    environment: &V,
    info: &V,
    clan_info: &V,
    own_team: &V,
    allow: bool,
    clan: &mut Option<V>,
) -> Result<Option<bool>, Flow> {
    if !truth(&ent) || !truth(&field(ent, "active")?) {
        return Ok(Some(false));
    }
    let id = field(ent, "id")?;
    if !id
        .as_f64()
        .is_some_and(|id| id >= 1.0 && id.is_finite() && id.fract() == 0.0)
    {
        return Ok(None);
    }
    let check: Result<bool, Flow> = (|| {
        if id == *own_id {
            return Ok(false);
        }
        let p = xy(ent)?;
        if !p.0.is_finite() || !p.1.is_finite() || p.0 < 0.0 || p.1 < 0.0 {
            return Ok(false);
        }
        let metadata = op("call1", &[info.clone(), environment.clone(), id])?;
        if !truth(&field(&metadata, "exists")?) {
            return Ok(false);
        }
        if !allow && *own_team != n(-1.0) && field(&metadata, "team")? == *own_team {
            let c = if let Some(c) = clan {
                c.clone()
            } else {
                let c = op(
                    "call1",
                    &[clan_info.clone(), environment.clone(), own_team.clone()],
                )?;
                *clan = Some(c.clone());
                c
            };
            if !truth(&field(&c, "exists")?) {
                return Ok(false);
            }
            let membership = field(&metadata, "membership")?;
            let current = field(&c, "membership")?;
            if membership.is_undefined() || current.is_undefined() || membership == current {
                return Ok(false);
            }
        }
        Ok(true)
    })();
    Ok(Some(check.unwrap_or(false)))
}
pub(super) fn nearest(parent: &V, receiver: &V, args: &V) -> Result<Option<V>, V> {
    let result: Result<Option<V>, Flow> = (|| {
        let anchor = prop(args.clone(), n(0.0))?;
        let fov = num(prop(args.clone(), n(1.0))?)?;
        if !truth(&anchor) || !(fov > 0.0) {
            return Ok(Some(V::NULL));
        }
        let origin = xy(&anchor)?;
        if !origin.0.is_finite() || !origin.1.is_finite() {
            return Ok(Some(V::NULL));
        }
        let targets = get(parent, "GetAllTargets")?;
        let players = field(&targets, "players")?;
        let ghouls = field(&targets, "ghouls")?;
        if !js_sys::Array::is_array(&players) || !js_sys::Array::is_array(&ghouls) {
            return Ok(None);
        }
        let settings = get(parent, "MOD")?;
        let world = get(parent, "World")?;
        let self_id = prop(field(&world, "PLAYER")?, get(parent, "օ̖̏")?)?;
        let me = prop(players.clone(), self_id.clone())?;
        let me_position = if truth(&me) { Some(xy(&me)?) } else { None };
        let max = num(field(&settings, "aimMaxRange")?)?;
        let max = if max == 0.0 || max.is_nan() {
            2400.0
        } else {
            max
        };
        let stick = num(field(&settings, "aimStick")?)?;
        let stick = if stick >= 0.0 { stick } else { 240.0 };
        let current = field(receiver, "targetPlayer")?;
        let filter = field(receiver, "isPlayerCandidate")?;
        let environment = get(parent, "environment")?;
        let info = field(&environment, "playerInfo")?;
        let clan_info = field(&environment, "clanInfo")?;
        // Only our own known adapter/predicate can use snapshots. External
        // predicates and direct core integrations retain the original path.
        let snapshots = bridge_function_id(&filter) == 27
            && bridge_function_id(&info) == 193
            && bridge_function_id(&clan_info) == 194;
        let allow = truth(&field(&settings, "TargetTeammate")?);
        let own_team = if snapshots && !allow {
            field(
                &op(
                    "call1",
                    &[info.clone(), environment.clone(), self_id.clone()],
                )?,
                "team",
            )?
        } else {
            n(-1.0)
        };
        let mut own_clan = None;
        let mode = field(&settings, "target")?;
        let mut selected = V::NULL;
        let mut best = fov;
        for (array, is_player, enabled) in [
            (
                players.clone(),
                true,
                mode == s("players") || mode == s("all"),
            ),
            (ghouls, false, mode == s("ghouls") || mode == s("all")),
        ] {
            if !enabled {
                continue;
            }
            let len = field(&array, "length")?.as_f64().unwrap_or(0.0) as usize;
            // High ghoul UIDs can extend these sparse arrays to 65k slots.
            // Ordinary array index keys retain the source's numeric tie order.
            let keys = js_sys::Object::keys(&js_sys::Object::from(array.clone()));
            for index in 0..keys.length() {
                let key = keys.get(index);
                let Some(id) = key.as_string().and_then(|key| key.parse::<usize>().ok()) else {
                    continue;
                };
                if id == 0 || id >= len {
                    continue;
                }
                let ent = prop(array.clone(), key)?;
                let eligible = if is_player {
                    let snapshot = if snapshots {
                        snapshot_player(
                            &ent,
                            &self_id,
                            &environment,
                            &info,
                            &clan_info,
                            &own_team,
                            allow,
                            &mut own_clan,
                        )?
                    } else {
                        None
                    };
                    if let Some(eligible) = snapshot {
                        eligible
                    } else {
                        truth(&op(
                            "call1",
                            &[
                                field(receiver, "isPlayerCandidate")?,
                                receiver.clone(),
                                ent.clone(),
                            ],
                        )?)
                    }
                } else {
                    if !truth(&ent) || !truth(&field(&ent, "active")?) {
                        false
                    } else {
                        let p = xy(&ent)?;
                        p.0.is_finite() && p.0 >= 0.0 && p.1 >= 0.0
                    }
                };
                if !eligible || !truth(&ent) {
                    continue;
                }
                let point = xy(&ent)?;
                if let Some(me) = me_position {
                    if me.0.is_finite() && me.0 >= 0.0 {
                        let md = distance(me, point);
                        if !md.is_finite() || md > max {
                            continue;
                        }
                    }
                }
                let d = distance(origin, point);
                if !d.is_finite() {
                    continue;
                }
                let score = if current == ent && d < fov + stick {
                    d - stick
                } else {
                    d
                };
                if score < best {
                    selected = ent;
                    best = score;
                }
            }
        }
        let date = get(parent, "Date")?;
        let now = num(op("call0", &[field(&date, "now")?, date])?)?;
        let held = field(receiver, "_heldTarget")?;
        let hold = num(field(&settings, "aimHoldMs")?)?;
        let hold = if hold >= 0.0 { hold } else { 200.0 };
        let until = field(receiver, "_heldUntil")?;
        let until = if truth(&until) { num(until)? } else { 0.0 };
        if truth(&held) && held != selected && now < until {
            let held_player = prop(players, field(&held, "id")?)? == held;
            let eligible = if held_player {
                truth(&op(
                    "call1",
                    &[
                        field(receiver, "isPlayerCandidate")?,
                        receiver.clone(),
                        held.clone(),
                    ],
                )?)
            } else {
                if !truth(&field(&held, "active")?) {
                    false
                } else {
                    let p = xy(&held)?;
                    p.0.is_finite() && p.0 >= 0.0 && p.1.is_finite() && p.1 >= 0.0
                }
            };
            if eligible {
                if let Some(me) = me_position {
                    if me.0.is_finite() && me.0 >= 0.0 {
                        let d = distance(me, xy(&held)?);
                        if d.is_finite() && d <= max {
                            selected = held.clone();
                        }
                    }
                }
            }
        }
        if selected != held {
            let _ = op(
                "set",
                &[receiver.clone(), s("_heldTarget"), selected.clone()],
            )?;
            let _ = op(
                "set",
                &[
                    receiver.clone(),
                    s("_heldUntil"),
                    n(if truth(&selected) { now + hold } else { 0.0 }),
                ],
            )?;
        }
        Ok(Some(selected))
    })();
    result.map_err(|e| match e {
        Flow::Throw(v) => v,
        _ => js_sys::Error::new("Invalid target completion").into(),
    })
}
