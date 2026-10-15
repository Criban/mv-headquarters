# KingCoffee coffee-break animation

Created with the built-in image_gen tool from the approved coffee-break portrait in `../kingcoffee-coffee-break.png`. The original portrait and earlier support-soldier rig remain available. Four transparent 1024 x 1536 PNG layers are assembled in `soldier-portrait.component.html`; generated parts need explicit SVG scale and position correction.

Base (legs and crate) stays fixed. Torso with slung rifle, head, and arms with mug breathe on a shared 6.2-second cycle. Arms move only 1.2 source pixels to maintain contact with the crate. Scene lighting applies to the assembled portrait. Layer loading failures fall back to the approved whole portrait; reduced motion disables animation.

## Generation prompt set

Shared instruction: Extract one animation layer from the supplied approved KingCoffee coffee-break portrait. Preserve character identity, pose, realistic 3D rendering, textures, colors and lighting. Transparent 1024 x 1536 canvas; retain original coordinates, scale and placement without recentering or cropping. All removed areas transparent. Extend hidden joints for overlap. No backdrop, shadow or text.

- `base.png`: Keep only complete supply crate, belt, pelvis, crossed legs and boots. Remove head, upper torso, both arms, mug and entire rifle. Reconstruct occluded crate and waist, extending waist fabric upward behind torso.
- `torso.png`: Keep scarf, vest, pouches, radio, shirt, shoulder sockets and hanging rifle with sling. Remove head, arms, mug, crate and lower body. Reconstruct vest behind forearm and add shoulder/waist overlaps.
- `head.png`: Keep helmet, goggles, headphones, sunglasses, face, microphone and short neck. Remove scarf and all remaining body, objects and equipment. Extend neck beneath scarf.
- `arms.png`: Keep both complete arms and gloves, with mug and steam in the original grip. Remove everything else, including all content between arms. Extend shoulder fabric for overlap.
