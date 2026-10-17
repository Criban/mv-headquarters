# Criban black armor and low-ready rifle carry

Created with the built-in `image_gen` tool from two user screenshots. The middle soldier in the first screenshot supplies the weapon pose; the middle black masked soldier in the second supplies the appearance. Whole portrait: `../criban-black-armor-low-ready.png`. Previous gas-mask portrait and rig are preserved.

## Whole portrait prompt

Match the central black soldier from the second screenshot: black tactical helmet with four raised night-vision tubes, glossy angular full-face mask with narrow blue eye slits and pointed lower faceplate, charcoal textured jacket, shoulder armor, black chest rig with muted tan details and magazine pouches, front drop pouch, dark trousers, thigh equipment, knee protection, black gloves and boots. Do not retain the previous gas mask or orange buckles. Use the first screenshot's middle soldier's relaxed rifle carry: right elbow bent, forearm across abdomen, glove on pistol grip, buttstock near right chest (viewer-left), receiver near abdomen, curved magazine at waist, barrel and suppressor pointing diagonally down toward left knee (viewer-right). Other arm relaxed at side. Front-facing full-body stance, realistic rendering, neutral lighting, transparent 1024 x 1536 canvas, complete helmet and boots. No other figures, floor, halo, shoulder launcher or text overlay.

## Layer extraction prompt set

Edit target: the new whole portrait. Preserve exact skin, materials, lighting and pose on the same transparent 1024 x 1536 canvas. No zoom, crop, recentering or enlarging. Removed regions transparent, no backdrop, halo or labels. SVG image rectangles compensate for extraction placement changes.

- `legs.png`: Keep belt, pelvis, drop pouch, thigh equipment, trousers, kneepads and boots; remove upper body, both arms and entire rifle. Reconstruct behind rifle; add 30px upward waist overlap.
- `torso.png`: Keep only sleeveless jacket torso, collar, shoulder harness straps, plate carrier, tan details, magazines/pouches and waist hem. Remove head, both entire upper arms/sleeves, both outer shoulder armor caps, rifle and lower body. Retain small dark cloth shoulder sockets under harness straps for overlap. Shoulder armor belongs exclusively to the separate arm layers.
- `head.png`: Keep helmet, all four raised night-vision tubes, angular mask, blue eye slits and neck; remove all other parts. Add 25px neck overlap.
- `arm-left.png`: Viewer-left arm / soldier's right arm, including shoulder, bent sleeve, glove and complete diagonal muzzle-down rifle as one connected layer. Remove torso, head, other arm and lower body. Add 25px shoulder overlap.
- `arm-right.png`: Viewer-right arm / soldier's left arm, including shoulder, lowered sleeve and glove. Remove all other parts. Add 25px shoulder overlap.

Torso, head and both arms retain separate breathing animations. The arm/rifle layer renders in front of the torso. Scene lighting, reduced-motion support and whole-portrait fallback apply to the updated skin.

Two fixed SVG radial contact shadows sit directly beneath the soles at (359, 1486) and (721, 1508) in the assembled portrait. They anchor the boots to the scene floor and remain stationary with the leg layer throughout the breathing cycle.

## Duplicate-arm correction

The initial torso extraction retained short upper sleeves and shoulder caps, producing a second arm contour behind the independent arm layers. A built-in `image_gen` edit removes both complete sleeves and outer shoulder caps from the torso while preserving the central collar, vest, harness, pouches, textures, lighting and transparent canvas. Small cloth shoulder sockets remain for overlap; the separate arm layers supply the complete arms and shoulder armor.
