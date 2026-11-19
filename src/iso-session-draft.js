const key = 'season-by-season.iso-draft.v1'

export function fieldGeometrySignature(geometry, usable) {
  return JSON.stringify([geometry, usable])
}

export function savedFieldGeometry(snapshot, fieldId) {
  return fieldGeometrySignature(snapshot.regions.find(field => field.id === fieldId)?.geometry,
    snapshot.net.regions.find(field => field.id === fieldId)?.geometry)
}

export function readIsoDraft() {
  let value
  try {
    value = JSON.parse(sessionStorage.getItem(key))
  } catch (error) {
    if (error instanceof SyntaxError) return null
    throw error
  }
  const {projectId, revision, state} = value ?? {}
  const {fieldId, id, draft, blocked} = state ?? {}
  if (typeof projectId !== 'string' || !Number.isSafeInteger(revision) || revision < 1 ||
      typeof fieldId !== 'string' || typeof id !== 'string' ||
      (id !== fieldId && !id.startsWith(`${fieldId}:strip:`)) || typeof blocked !== 'boolean' ||
      !draft || (draft.split === undefined && draft.culture === undefined)) return null
  if (draft.split !== undefined &&
      (typeof draft.split?.count !== 'string' ||
        (typeof draft.split.angle !== 'string' && !['length', 'cross'].includes(draft.split.direction)))) return null
  if (draft.culture !== undefined && typeof draft.culture !== 'string') return null
  return value
}

export function writeIsoDraft(project, state) {
  if (project && state?.draft) {
    const checkpointState = state.blocked ? state : {
      ...state,
      sourceRevision: project.revision,
      baseSplit: project.planning.splits[state.fieldId] ?? null,
      ...(state.id !== state.fieldId && {baseGeometry: savedFieldGeometry(project.snapshot, state.fieldId)}),
    }
    sessionStorage.setItem(key, JSON.stringify({projectId: project.id, revision: project.revision, state: checkpointState}))
  } else {
    sessionStorage.removeItem(key)
  }
}
