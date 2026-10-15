# Blackhawk hooded M16 skin

Generated with the built-in image_gen tool from the user's skin front/side screenshots and rifle/optic closeups. Final whole portrait: `../8lackh4wk-hooded-m16.png`. The old portrait and rig are preserved.

Outfit: mottled grey hood, black skullcap, dark goggles and face mask, navy jacket, grey plate carrier with two magazine pouches and radio, pale blue belt cloth, black trousers with grey fabric knee panels. Weapon: M16 with fixed solid stock, suppressor and compact cylindrical round thermal optic; no vertical, angled or barrel grip. Supporting hand rests under the horizontal handguard.

Four transparent 1024 x 1536 layers are assembled and aligned in `soldier-portrait.component.html`. Legs stay fixed; torso, head and connected arms/rifle share the existing Blackhawk breathing cycle. Both hands and the entire weapon remain on one layer. Scene lighting applies to the assembled SVG, reduced motion disables animation, and a failed layer load falls back to the whole portrait.

## Prompt set

Whole portrait edits: match supplied hooded skin screenshots while preserving the existing wide stance and aiming pose. Apply navy jacket, two grey magazine pouches, radio/cable, pale blue belt cloth, fabric knee panels, hood/skullcap/goggles/mask. Replace the original weapon with the reference M16, solid fixed stock, suppressor and compact ROUND THERMAL OPTIC with circular glass. Remove all foregrips; support hand grips the ordinary horizontal handguard. Preserve full body and rifle framing on transparent background.

Shared extraction instructions: preserve exact original skin, pose, rendering, textures and lighting on a transparent 1024 x 1536 canvas, without zoom/crop/recentering. Removed areas fully transparent; reconstruct only hidden joint overlaps. No background, glow, shadow or labels. Generated parts required SVG alignment corrections.

- `legs.png`: Keep belt, jacket hem, blue cloth, pelvis, holster, legs and boots. Remove all upper body and rifle. Extend waist fabric upward 25px.
- `torso.png`: Keep shirt, vest, straps, radio/cable, two magazine pouches and neck socket. Remove head/hood, arms, entire rifle, belt and lower body. Reconstruct vest behind forearms/rifle; add 25px shoulder, neck and waist overlap.
- `head.png`: Keep entire hood, skullcap, goggles, mask and neck. Remove all body and equipment. Reconstruct lower hood behind rifle and add 20px neck overlap.
- `arms-weapon.png`: Keep both complete arms/gloves and entire M16 as one connected layer, preserving fixed stock, perforated handguard, triangular front sight, long barrel/suppressor and round thermal optic. No foregrip; support hand under handguard. Remove all head/torso/lower body and keep gaps transparent, adding 20px shoulder overlap.
