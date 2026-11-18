# Wikibooks recipe text

`inspiration-text.json` contains text by Wikibooks contributors, reformatted as recipe headings, paragraphs and list items. The `source` field links to the corresponding Wikibooks revision and its page history for attribution.

The recipe text and the formatting adaptations are distributed under the [Creative Commons Attribution-ShareAlike 4.0 International license](https://creativecommons.org/licenses/by-sa/4.0/). See the [Wikibooks copyright policy](https://en.wikibooks.org/wiki/Wikibooks:Copyrights).

To refresh the package after updating the recipe index, run `node scripts/update-inspiration-text.mjs`. Use `--refresh` to refresh the text for existing entries too.
