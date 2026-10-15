# Layered breathing animation

Generated with the built-in image_gen tool from `../kingcoffee-support-transparent.png`. Source preserved. Four transparent 1024 x 1536 PNG layers. Generated parts required alignment in soldier-portrait.component.html; they are not pixel-identical extractions. Keep the source portrait as the reference for proportions when adjusting alignment.

Legs remain fixed; torso, head and connected arms/rifle animate together on a 6.2-second cycle. Arms and rifle share a layer to preserve hand grips.

Portrait lighting applies to the assembled SVG. Failed layer loads fall back to the original portrait. Reduced motion disables animations.

## Generation instructions

Each output was requested as one aligned photorealistic transparent layer on the original 1024 x 1536 canvas, preserving source identity, texture, lighting and pose. No zoom, recentering, background, shadows or labels. Reconstruct only hidden joint overlaps. The generator changed placement/scale despite those constraints; SVG rectangles compensate.

### legs

Retain ONLY belt, pelvis, legs, thigh equipment and boots from y=700 downward. Remove head, torso, arms and ENTIRE rifle including suppressor. Reconstruct waist behind removed rifle and gloves with matching black fabric, extend waist up to y=665 for overlap.

### torso

Retain ONLY neck scarf, shoulder straps and armored torso with magazines, approximately x=325..675 y=195..745. Remove head, BOTH arms, hands, entire rifle, legs. Inpaint complete vest and shirt behind rifle and forearms. Fill shoulder sockets, neck and waist with 30px hidden overlap.

### head

Retain ONLY helmet, headset, goggles, sunglasses, face and neck, approximately x=400..600 y=15..240. Remove ALL body, scarf, arms, weapon and legs. Add 20px neck overlap.

### arms-weapon

Retain ONLY BOTH complete arms, gloves and ENTIRE rifle including stock, magazine and suppressor as ONE layer, exactly original connected pose and hand grips. Arms span x=220..770 y=245..735, rifle spans x=300..850 y=420..865. Remove head, torso, vest, all legs and background. Empty gaps between arms must be transparent. Extend shoulder fabric roots 25px.

