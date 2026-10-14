# Urban Night hangar

Asset: `hangar-urban-night.png`, created with the built-in Imagegen tool.
Edit target: `hangar-background-clear-lane.png`. Original assets are preserved.

## Final prompt

Use case: lighting-weather. Asset type: background plate for an existing military squad selection website, landscape 3:2. Input image: edit target, existing empty military hangar. Transform this same hangar into an urban nighttime deployment base. Preserve camera, perspective, steel beams, mezzanine catwalks, floor horizon at 61% image height, and completely empty foreground floor for existing animated soldier cutouts. Open the large rear hangar doors to reveal a distant nighttime city with softly defocused cyan, red and violet lights and faint purple haze. Cool navy and charcoal industrial interior, cyan practical lamps on left, crimson/pink practical light on right, believable subtle colored reflections on damp floor. Keep enough ambient light to see architecture, cinematic realistic game environment, military rather than futuristic cyberpunk. No people, no soldiers, no foreground vehicles or crates (separate props are composited later). No text, no logos, no season badges, no watermark. No daylight or warm sunlight.

## Integration

The seated soldier and chair face left through a horizontal CSS mirror. `portrait-night-light-mirrored.svg` reverses the lighting map before that mirror so the scene still lights the visible figure cyan from the left and red from the right. Scale and ground contact remain unchanged.

Uniform colors are desaturated before applying scene lighting to produce a shared charcoal/black palette. The seated portrait receives stronger desaturation to remove the olive fabric tint and a slightly lower exposure; selecting it retains that exposure. Cyan/red light remains visible after the base colors are neutralized.

The scene consists only of the new background plate and animated portraits with their ground shadows. The separate foreground props and animated truck, including their image files and animation styles, have been removed. Portraits use reduced exposure and saturation, softer highlights, and a cool color balance. An alpha-clipped SVG soft-light filter uses `portrait-night-light.svg` to apply restrained cyan light from the left and red light from the right to the character surfaces, without glowing silhouette outlines. The same filter treats complete animated rigs and static/fallback portraits. Existing Berlin time lighting signals still make subtle brightness changes within the night palette. Selection does not increase portrait brightness. Layout, soldier selection, portrait animation, and statistics behavior are unchanged.
