# Blackhawk forward aim

Created with the built-in `image_gen` tool. Whole portrait: `../8lackh4wk-forward-m16.png`. Reference/edit target: `../8lackh4wk-hooded-m16.png`. Previous portrait and layers are preserved.

## Whole portrait prompt

Change only the upper-body aiming orientation: turn head, gaze, shoulders, both arms and M16 about 55 degrees toward the camera. Look and aim forward out of the screen, with only a slight angle toward image-right. Strongly foreshorten the rifle so it no longer points sideways at Criban. Maintain natural shouldered aim, eye aligned with thermal scope and coherent hand grips. Preserve mottled gray hood, black skullcap, goggles, mask, navy sleeves, gray vest, two magazine pouches, radio, pale blue belt cloth, trousers, knee panels, holster and boots. Preserve M16 fixed stock, perforated handguard, triangular front sight, suppressor and cylindrical round thermal optic; no foregrip. Preserve full-body stance, proportions, head height and realistic rendering on a transparent 1024 x 1536 canvas.

## Layer extraction prompt set

Edit target: new forward-aiming whole portrait. Preserve placement, scale, perspective, orientation, textures and lighting on the same transparent 1024 x 1536 canvas. No zoom, crop or recentering. Removed regions transparent; no backdrop, halo, shadows or labels.

- `legs.png`: Keep belt, jacket hem, blue cloth, pelvis, holster, legs and boots; remove upper body. Reconstruct 25px upward waist overlap.
- `torso.png`: Keep shirt, vest, straps, radio/cable, two magazine pouches and neck socket. Remove head/hood, arms, rifle, belt and lower body. Reconstruct hidden vest and add 25px shoulder, neck and waist overlap.
- `head.png`: Keep hood, skullcap, goggles, mask and neck in the forward-looking orientation. Remove body, arms, rifle and equipment. Reconstruct lower hood and add 20px neck overlap.
- `arms-weapon.png`: Keep both complete sleeves, arms/gloves and entire forward-aiming M16 as one layer. Preserve foreshortening, fixed stock, triangular sight, round thermal optic and support hand under handguard; no foregrip. Remove head, torso and lower body. Add 20px shoulder overlap.

The assembled SVG retains separate torso, head and arms/rifle breathing animations, ambient lighting, reduced-motion support and whole-portrait fallback.
