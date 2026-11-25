use super::*;
// Coarse rejection of non-hovered world objects before the detailed overlay.
// The existing overlay retains drawing, ownership and interaction decisions.
pub(super) fn draw_records(env: &V, tile_x: V, tile_y: V) -> E {
    let settings = get(env, "MOD")?;
    if !truth(&prop(settings.clone(), s("ShowBuildingOwner"))?)
        && !truth(&prop(settings, s("RightClickDoors"))?)
    {
        return get(env, "playerRecords");
    }
    let all = get(env, "records")?;
    let players = prop(prop(get(env, "B")?, s("categories"))?, s("player"))?;
    let filtered = op("array", &[])?;
    let length = prop(all.clone(), s("length"))?.as_f64().unwrap_or(0.0) as usize;
    let mut cursor: Option<V> = None;
    for index in 0..length {
        let record = prop(all.clone(), n(index as f64))?;
        if prop(record.clone(), s("type"))? == players {
            let _ = op("push", &[filtered.clone(), record])?;
            continue;
        }
        let entity = prop(record.clone(), s("e"))?;
        let Some(x) = prop(entity.clone(), tile_x.clone())?.as_f64() else {
            continue;
        };
        let point = if let Some(point) = &cursor {
            point.clone()
        } else {
            let point = op("call0", &[get(env, "cursorWorld")?, u()])?;
            let _ = op("write", &[env.clone(), s("ownerCursor"), point.clone()])?;
            let _ = op("write", &[env.clone(), s("ownerCursorRead"), b(true)])?;
            cursor = Some(point.clone());
            point
        };
        if !truth(&point) {
            continue;
        }
        let px = (prop(point.clone(), s("x"))?.as_f64().unwrap_or(f64::NAN) / 100.0).floor();
        let py = (prop(point, s("y"))?.as_f64().unwrap_or(f64::NAN) / 100.0).floor();
        if x == px && prop(entity, tile_y.clone())?.as_f64() == Some(py) {
            let _ = op("push", &[filtered.clone(), record])?;
        }
    }
    Ok(filtered)
}
