import {readGardens} from '../experiments/way-guided/gardens.js'
import tandel from '../public/garden/fixture.json'
import hesperange from '../evidence/transfer/fixture.json'
import prompts from '../evidence/transfer/hesperange-prompts.json'
import bagua from '../evidence/segmentation/fixture.json'
import baguaInputs from '../evidence/segmentation/rgb-input.json'
import hesperangeImage from '../evidence/transfer/hesperange-ortho-2023.png?url'
import baguaImage from '../evidence/segmentation/bagua-ortho-2023.png?url'
import {krautgaartFixture, krautgaartKey} from './krautgaart-fixture.js'

const files = {
  'public/garden/fixture.json': {...tandel, image: {...tandel.image,
    url: `${import.meta.env.BASE_URL}garden/tandel-ortho-2023.png`}},
  'evidence/transfer/fixture.json': {...hesperange, image: {...hesperange.image, url: hesperangeImage}},
  'evidence/transfer/hesperange-prompts.json': prompts,
  'evidence/segmentation/fixture.json': {...bagua, image: {...bagua.image, url: baguaImage}},
  'evidence/segmentation/rgb-input.json': baguaInputs,
}

export const gardens = {...await readGardens(path => files[path]), [krautgaartKey]: krautgaartFixture}
