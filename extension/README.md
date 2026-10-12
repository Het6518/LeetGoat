# LeetGoat — extension source

Install instructions, features and publishing steps are in the [main README](../README.md).

```bash
npm install
npm run dev        # rebuild on change + UI playground at /playground.html
npm run build      # production build → dist/  (load it at chrome://extensions → Load unpacked)
npm run release    # build + zip → release/leetgoat-<version>.zip
npm run lint
```

For how the pieces fit together, open [`docs/how-it-works.html`](docs/how-it-works.html) in a browser.
