# Scentory catalogue v2

Snapshot: 2026-10-20. These are first-party product facts, not a clone of another fragrance encyclopedia.

Sources: Amouage, Parfums de Marly, Xerjoff, Memo Paris, BDK Parfums, Etat Libre d’Orange, Goldfield & Banks, Roja, Thameen, Maison Crivelli and Tom Ford public product listings. The existing 50 fragrance identifiers are preserved for library compatibility, including designer brands outside the expanded sources.

`public/catalog.json` contains 573 distinct catalogue IDs across 21 brands, with 543 official image URLs and 432 records whose notes were verified from a brand page or its explicitly declared product note tags. Source URL and checked date accompany verified note records. Official photography remains hosted by its source. Bottle size, label and packaging can change; the image describes the source's current presentation.

Each record separately declares `imageStatus` and `notesStatus`: `official`, `legacy`, `custom` or `unavailable` as applicable. An official image does not turn legacy notes into verified notes. Media-only updates are recorded in `data/media-overrides.json`. Image URLs are preserved; the UI fits the entire image without masks or clipping the bottle.

Brands do not always publish top/heart/base pyramids. In that case explicitly published key notes appear as key notes. A missing fact stays missing. We do not infer release year from a store's creation date, ingredient proportions from marketing order, or longevity/sillage from note structure. Family filters are editorial classifications derived from declared notes, not laboratory measurements or brand-certified accord percentages. Unknown materials do not silently become amber.

The note illustrations are original SVG drawings. These communicate a material or family and are not raw-material product photographs. Arabic translations cover common materials, while the original source name remains visible in the detail view. Untranslated material names remain in the source language.

Refresh uses Python's standard library. The ignored `.catalog-cache` avoids repeated requests during a build and expires at the UTC day boundary. Source failures do not justify inventing notes. Review changes before committing and publishing a new catalogue snapshot. Do not add a third-party database or scraped community content without verifying its authorization and terms first.

Account-specific custom fragrances supplement the catalogue without being relabeled as official. Backup files include user-owned lists, notes, journal and custom entries. Account data is not included in the catalogue or application source.
