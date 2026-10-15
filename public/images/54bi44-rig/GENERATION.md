# Layered breathing animation

Generated with the built-in image_gen tool from `../54bi44-camping-chair.png`. Source preserved. Four transparent 1024 x 1536 PNG layers. Generated parts required alignment in soldier-portrait.component.html; they are not pixel-identical extractions. Keep the source portrait as the reference for proportions when adjusting alignment.

Chair and lower body remain fixed. Torso, hood/head and resting arms use a gentle 7.3-second breathing cycle. The arms move only 1.5 source pixels to keep contact with the chair.

Portrait lighting applies to the assembled SVG. Failed layer loads fall back to the original portrait. Reduced motion disables animations.

## Generation instructions

Each output was requested as one aligned photorealistic transparent layer on the original 1024 x 1536 canvas, preserving source identity, texture, lighting and pose. No zoom, recentering, background, shadows or labels. Reconstruct only hidden joint overlaps. The generator changed placement/scale despite those constraints; SVG rectangles compensate.

### base

Retain ONLY entire camping chair INCLUDING backrest armrests seat and all struts, plus belt pelvis legs boots and thigh pistol from y=795 down. Remove head torso BOTH arms and hands. Reconstruct chair backrest hidden behind upper body and armrests under hands so chair is complete. Preserve exact original pose and placement. Add waist fabric overlap to y=770.

### torso

Retain ONLY neck scarf, shoulder straps and armored torso with attached pouches/radio, approximately x=295..665 y=475..820. Remove hood head BOTH arms gloves chair legs and background. Reconstruct filled shoulder sockets and add 30px neck and waist overlaps. Preserve exact vest identity.

### head

Retain ONLY complete hood, goggles, masked face and neck scarf down to y=545, approximately x=325..585 y=245..545. Remove body, arms, chair, legs and background. Extend lower scarf 20px for overlap.

### arms

Retain ONLY BOTH complete arms and gloves resting on chair armrests as ONE layer, exactly original pose: left x=110..375 y=505..840 and right x=615..910 y=525..885. Remove ALL chair, armrests, head, torso, vest, legs and background. Transparent space between arms, no vest remnants. Add 25px shoulder fabric overlap.

