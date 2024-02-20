# NER Highlighter

First, credit where it's due: this plugin is a Frankenstein's monster of a plugin, from sewing the `compromise` (NER) head from [akosbalasko](https://github.com/akosbalasko)'s [autotagger plugin](https://github.com/akosbalasko/obsidian-autotagger-plugin) onto the `codemirror` body [Hady](https://github.com/hadynz)'s [sidekick plugin](https://github.com/hadynz/obsidian-sidekick).  Or maybe I got the head and body mixed up.  Either way, I got it to work, but there's probably a lot of bloat and inefficiencies as a result of combining them and not being comfortable with typescript.  Pull requests are welcome.  But I digress.  Akos doesn't have any way I've seen to contribute financially to him, but Hady does, so please visit his project for links to do so if you feel so inclined.

## Why

I like the NER from the autotagger plugin, but I don't personally use tags much in Obsidian, so I just wanted to highlight the entities where they were in the note.  Ideally some of them will pop out at the user as new connecting notes.  One downfall of the current version is that clicking the highlighted text will replace it with a link, with no warning.  I'd prefer to have some type of pop-up akin to the Sidekick plugin's functionality, but I don't have time right now to implement that.

## Future Enhancements
I'd like to add a settings page to allow toggling on/off the different classes of named entities, as well as adding custom colors.

### Preview

![](https://i.imgur.com/Y3dyAwY.png)

## License

[MIT](LICENSE)
