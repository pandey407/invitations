# Wedding & reception — asset prompts

Theme: the gathbandhan knot, on handmade Nepali lokta kagaz. Bride in a Banarasi saree with dupatta; groom in a white
daura suruwal with gold embroidery. The same artwork serves the wedding and the reception.

Colours (picker defaults — swap the hex codes if you choose others):
envelope paper #a5524f · inner pages #f5e3db · bride's Banarasi #b8343a · groom's daura #f8f4ec · gold #c9a24a ·
text #6b2a2a

Save everything in `design/wedding/` with the file names below. Cutouts must be on **pure white (#ffffff), no shadow,
no ground**: the cutting script keys on the white. Ask for **no text** in every image.

## Shared style (paste at the start of every prompt)

```
Nepali wedding illustration, hand-painted watercolour and gouache with fine detail, warm, graceful and joyful, soft natural light. Palette: Banarasi red (#b8343a), white silk (#f8f4ec), antique gold (#c9a24a), marigold orange (#e8861f), leaf green (#4f7a3a), soft rose (#f5e3db). No text, no letters, no watermark.
```

## Paper

**lokta.jpeg** — already generated (the cream lokta). Save it here; it's tinted in code for the envelope and pages.

## Envelope

**1. knot.png** — the envelope's seal, cloths included: one image spanning the whole width of the envelope. Tapping
the knot unties it and the two cloths slide apart to open the envelope.
```
[style] A gathbandhan seen straight on: the end of the bride's Banarasi silk dupatta tied in a single soft, full knot to the groom's white silk patuka. From the knot, the groom's cloth runs all the way to the left edge: white silk (#f8f4ec) matching his daura suruwal, with fine gold thread embroidery (a delicate vine) along both long edges. The bride's cloth runs all the way to the right edge: rich Banarasi red silk (#b8343a) with a wide gold zari brocade border along both long edges and small woven gold buttas. Both cloths are straight, level and the same width, crossing the full image at mid-height with only gentle soft folds, and run off the left and right edges uncut. The knot sits exactly in the centre, with two short tails hanging down, one of each cloth. Isolated on pure white background. Very wide, 5:1, 5000x1000.
```

### The tying video on a keying background (Veo) — what the envelope uses next

knot-tie-video.mp4 (painted on cream paper with window light) is in use now, but the paper is so close to the white
silk that cutting it out costs sharpness and nibbles the silk's highlights. Make it again on a flat **chroma blue**:
not green (the leaves would be keyed out with it) and not white (the silk would). Save it as
`knot-tie-blue.mp4`; scripts/wedding/key-tie-video.py will be switched to key on the blue.

**V4. knot-tie-blue.mp4** — Gemini → Video (Veo), 16:9, the highest quality it offers (1080p), no starting image:
```
Hand-painted watercolour and gouache animation, crisp and finely detailed, sharp edges, no motion blur, camera completely locked off. The background is one perfectly flat, even, solid chroma-key blue (#0047BB) filling the whole frame for the entire clip: no paper texture, no light or window shadows, no gradient, no vignette, no shadows cast on it, nothing else in frame.
The groom's long white silk scarf (#f8f4ec, ivory white daura silk with a fine gold embroidered vine along both long edges) flies in from the left edge and the bride's long red Banarasi silk dupatta (#b8343a, wide gold zari brocade border, small woven gold buttas) flies in from the right edge, both rippling like flags as they come. Their free ends meet in the centre, cross, wrap once around each other and are pulled snug into a single soft, full knot, with two short tails hanging down, one of each cloth. After the knot, the two cloths run straight and level across the middle of the frame at the same height, out of the left and right edges.
Just after the knot is tied, a gentle burst of marigold petals, a few whole marigolds and small green mango leaves bursts out around the knot and drifts slowly down, staying well inside the frame.
Bright, even, soft studio light on the cloths. No glow, no sparkles, no light streaks, no text, no sound. 8 seconds.
```
What to check: the blue stays one flat colour everywhere (no darker corners, no shadow under the cloth), and the
cloths' edges are crisp. If Veo adds a light sweep or sparkles at the end, that part is cut off anyway.

### The tying, frame by frame (Gemini image editing) — replaced by the video

The knot is tied on screen in painted frames, like hand-drawn animation: the cloths fly in (cloth-daura.jpeg,
cloth-banarasi.jpeg), then these five in-betweens play in order and land on knot.jpeg. Make each one by **editing
knot.jpeg** (attach it): same 4640x928 canvas, same style. Only the **middle third** changes; the cloths outside it
must stay exactly as they are (the site only uses the middle of each frame). Save as tie-1.jpeg … tie-5.jpeg.

**tie-1.jpeg** — the free ends cross.
```
Edit this image. Keep everything outside the middle third exactly the same. In the middle, there is no knot yet: the white silk's loose end and the red Banarasi's loose end overlap and cross each other in an X at the centre, the white end on top, both ends long, soft and loose, hanging slightly. No petals or leaves. Pure white background. Same canvas, same watercolour style.
```

**tie-2.jpeg** — the white end goes round the red.
```
Edit this image. Keep everything outside the middle third exactly the same. In the middle, the white silk's loose end is wrapping around the red Banarasi: it passes over the red cloth and curls down behind it, forming the first open loop, the red end still hanging loose. No petals or leaves. Pure white background. Same canvas, same watercolour style.
```

**tie-3.jpeg** — the first loop made, loose.
```
Edit this image. Keep everything outside the middle third exactly the same. In the middle, the two ends have been wrapped once around each other into a loose, open knot: a soft, wide loop of white and red silk twisted together, both tails long and hanging down. No petals or leaves. Pure white background. Same canvas, same watercolour style.
```

**tie-4.jpeg** — being pulled tight.
```
Edit this image. Keep everything outside the middle third exactly the same. In the middle, the knot is being pulled tight: the twisted white and red silk is drawing together into a firm knot, slightly larger and softer than the finished one, the two tails swinging out to either side as if just tugged. No petals or leaves. Pure white background. Same canvas, same watercolour style.
```

**tie-5.jpeg** — tight, before the petals.
```
Edit this image. Keep everything exactly the same, including the knot, its size and position, but remove the marigold petals and green leaves around the knot. Pure white background. Same canvas, same watercolour style.
```

What to check: hold each frame over knot.jpeg (or flick between them): the cloths left and right of the middle
should not move at all, and the knot should sit at the same height. If a frame shifts or rescales, generate it again.

### The tying video, forwards (Gemini → Veo) — replaced by the frames above

The reversed clip moved like loosening played backwards. This one animates the actual tying. Its start frame,
**apart-green.png** (the two cloths apart, on green), was taken from the first video, so it lines up.

**V3. tie-forward.mp4**: in Gemini choose Video and attach apart-green.png as the starting image:
```
Starting exactly from this image, camera completely still. The groom's white silk from the left and the bride's red Banarasi silk from the right glide towards each other; their free ends meet in the centre, cross over, wrap once around each other, and are pulled gently snug into a single soft knot, with two short tails hanging down, one of each cloth. The cloths stay level at the same height. Then a few marigold petals and small green leaves drift down from above and settle around the knot. Graceful, natural silk motion, hand-painted watercolour look. The background stays solid flat chroma green (#00ff00) the whole time, no shadows on it, nothing else in frame, no text. No sound.
```
If you have Google Flow (labs.google/flow, "Frames to Video"), use apart-green.png as the first frame and
knot-green.jpeg as the last frame, so the clip ends exactly on the knot artwork.

### The tying video (Gemini → Veo), first version, reversed

The envelope plays a short clip: the two cloths come together and tie, and the marigold petals and leaves settle
around the knot. Veo in the Gemini app takes a start image only, so the clip is made **in reverse** (from the
finished knot, everything comes apart) and the site plays it backwards. Green background, so the white silk isn't
keyed out with it.

**V1. knot-green.png**: the finished knot, the clip's first frame. In Gemini, attach knot.jpeg:
```
Edit this image: make the background solid flat chroma green (#00ff00). Change nothing else: the cloths, the knot, the marigold petals and leaves around it, the colours, size and position all stay exactly the same. Wide 16:9, the cloths across the middle, green above and below.
```

**V2. tie.mp4**: in Gemini choose Video and attach knot-green.png as the starting image:
```
Starting exactly from this image, camera completely still. The marigold petals and leaves around the knot lift gently and drift outward and away, out of the frame; then the knot slowly and gracefully loosens, the two ends unwrap from around each other, and the groom's white silk draws away to the left while the bride's red Banarasi silk draws away to the right, until their free ends part in the middle and come to rest. Smooth, gentle, natural motion of silk and petals, hand-painted watercolour look, the cloths stay level at the same height. The background stays solid flat chroma green (#00ff00) the whole time, no shadows on it, nothing else in frame, no text. No sound.
```
Played backwards on the site: the cloths come together, the knot ties, and the petals and leaves drift in and
settle around it.

## Inner pages

**2. arch.png** — the frame around the couple's names.
```
Fine antique-gold (#c9a24a) line-art scalloped Mughal arch frame, thin double line with small dot and bud details at the peak and shoulders, completely empty inside, on pure white background, no fill, no text. Portrait 2:3, 2000x3000.
```

**3a. drape.png** — the bride's Banarasi silk, gathered at the page's top corner and falling down its side, framing
the pages (used on the left, and mirrored on the right).
```
[style] Soft Banarasi red silk drapery (#b8343a) gathered at the top-left corner and falling in gentle, loose folds down the left side, with its wide gold zari brocade border and small woven gold buttas, slightly translucent at the thinnest folds, flowing and airy, ending in a soft hem about two-thirds of the way down. Everything else empty. Isolated on pure white background. Portrait 1:2, 1200x2400.
```

**3b. bells.png** — brass bells hanging from the top of the opening page (they sway in code).
```
[style] Five slim strands hanging from the top edge at different lengths, each a red-and-gold silk cord threaded with a couple of small marigolds and ending in a small polished brass temple bell with a tiny red tassel, evenly spaced across the width, lots of empty space between the strands. Isolated on pure white background. Wide, 3:1, 3000x1000.
```

**4. feet.png** — saptapadi, for the details page. *Redone as an edit (on chroma blue, so the rice survives the cut; cut with scripts/wedding/cut-chroma.py):* "remove the silver toe rings from the bride's toes … replace the white background with one perfectly flat, even, solid chroma-key blue (#0047BB) …".
```
[style] Close view of the bride's and groom's bare feet stepping forward side by side. The bride's feet with red alta, silver anklets and toe rings, beneath the gold-bordered hem of her Banarasi red saree (#b8343a). The groom's feet beneath the white suruwal (#f8f4ec) with gold embroidered cuffs. A few marigold petals and rice grains on the ground under them. Isolated on pure white background. Portrait 3:4, 2000x2700.
```

**5. banana-corner.png** — corner foliage (used in mirrored pairs).
```
[style] A lush corner arrangement of banana leaves with a few marigolds and white jasmine buds, growing from the bottom-left corner diagonally up and right, leaves fanning out. Isolated on pure white background. Square, 2000x2000.
```

**6. kalash.png** — beside the date and venue.
```
[style] A brass purna kalash with a coconut on top, mango leaves fanned around its mouth, a red and gold sacred thread tied around its neck, a small swastik in sindoor on its belly, standing on a few rice grains and marigold petals. Isolated on pure white background. Portrait 3:4, 2000x2700.
```

**7. sindoor-potey.png** — closing page. *Redone as an edit (on chroma green, cut with scripts/wedding/cut-chroma.py):* the gold-pendant green potey replaced by "a traditional Nepali wedding potey: a coiled bundle of many strands of tiny glass beads in bright red and yellow, twisted together, no gold pendant, no tilhari".
```
[style] A small carved wooden sindoor box (sindoor-dani) with its lid open showing red sindoor powder, and a green glass-bead potey necklace with a gold tilhari pendant coiled beside it, a few rose and marigold petals scattered. Isolated on pure white background. Wide, 3:2, 2400x1600.
```

**8. petals.png** — a sheet of loose pieces for falling petals (cut into separate files).
```
[style] A sheet of about 25 loose, separate falling petals: marigold orange and yellow petals, deep red and soft pink rose petals, of different sizes and curl angles, plus 4 small green mango leaves and 3 tiny white jasmine flowers, scattered with clear white space between every piece, none touching or overlapping. Pure white background, no shadows.
```

## Link preview (WhatsApp)

**9. preview.jpeg** — the names and date are added in code; keep the middle open.
```
[style] Wide banner on handmade lokta paper with a soft red tint (#f5e3db): the gathbandhan knot of the white gold-embroidered silk and the Banarasi red silk with gold zari across the middle third, marigold strands hanging at the top corners, banana leaves at the bottom corners. The area above and below the knot kept open and plain. 1200x630.
```

## Optional — Joota Chuppai

**10. jutta.png** — only if we add the playful Joota Chuppai card.
```
[style] A pair of the groom's embroidered ivory-and-gold wedding shoes (nagra / mojari) with curled toes, tied together with a red ribbon and a small brass lock, a couple of marigolds beside them. Isolated on pure white background. Square, 2000x2000.
```

## Programme cards — a painted piece on each card (like the mehendi's peacock)

Attach **kalash.jpeg** to each as the style reference. All on flat **chroma blue** (none of them has blue in it), cut
with scripts/wedding/cut-chroma.py into src/events/wedding/assets/cards/<name>.webp.

**C1. card-janti.jpeg** — perched on the janti card's top-left corner.
```
Match the watercolour and gouache style of the attached image exactly. Naumati baja for a Nepali janti procession: a long curved brass narsingha horn resting diagonally across a small red-and-gold damaha drum, a marigold garland and a red cloth tassel tied around the horn, a few marigold petals beside them. A small, compact group, seen from slightly above. Background: one perfectly flat, even, solid chroma-key blue (#0047BB), no shadows on it, no gradient, no texture. Square, 2000x2000. No text.
```

**C2. card-ceremony.jpeg** — hanging over the wedding card's top edge.
```
Match the watercolour and gouache style of the attached image exactly. A pair of Nepali wedding jaimala garlands, thick strands of orange and yellow marigolds with red roses and small white jasmine buds, hanging side by side from a straight invisible horizontal line along the very top of the image, each falling in a deep U-shaped loop, with short tassels of marigolds at the bottom of each loop. Background: one perfectly flat, even, solid chroma-key blue (#0047BB), no shadows on it, no gradient, no texture. Wide 2:1, 2400x1200. No text.
```

**C3. card-reception.jpeg** — standing on the reception card's top-right corner.
```
Match the watercolour and gouache style of the attached image exactly. One traditional Nepali brass panas oil lamp, tall, ornate and polished, with a small steady flame in its oil bowl, a short marigold garland wrapped around its stem and a few marigold and rose petals at its base, standing upright. Background: one perfectly flat, even, solid chroma-key blue (#0047BB), no shadows on it, no gradient, no texture, and no glow or halo from the flame spreading onto it. Portrait 2:3, 1600x2400. No text.
```
