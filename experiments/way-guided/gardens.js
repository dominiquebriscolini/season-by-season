export async function readGardens(readJson) {
  const [tandel, hesperange, prompts, bagua, baguaInputs] = await Promise.all([
    readJson('public/garden/fixture.json'),
    readJson('evidence/transfer/fixture.json'),
    readJson('evidence/transfer/hesperange-prompts.json'),
    readJson('evidence/segmentation/fixture.json'),
    readJson('evidence/segmentation/rgb-input.json'),
  ])
  return {
    tandel: {fixture: tandel, timeZone: 'Europe/Luxembourg', axes: [tandel.analysisPrompts.path.axis]},
    hesperange: {fixture: hesperange, timeZone: 'Europe/Luxembourg', axes: [prompts.path.axis]},
    bagua: {fixture: bagua, timeZone: 'Europe/Luxembourg', axes: baguaInputs.objects.map(object => object.points.slice(2))},
  }
}
// Independent interpretation of the raw Bagua image and the experimental boundary.
export const baguaNetwork = [
  [[398,245],[415,225],[439,207],[468,202],[498,202],[516,207],[539,230],[548,252],[549,281]],
  [[549,281],[549,301],[536,320],[517,335],[490,344]],
  [[490,344],[466,345],[443,342],[422,331],[407,317],[398,299]],
  [[398,299],[398,278],[398,245]],
  [[398,299],[381,306],[365,310]],
  [[490,344],[496,354],[499,366]],
  [[516,207],[524,195],[529,186]],
]
