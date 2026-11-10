# flyjung.

Jiwon Jung’s personal portfolio and blog at [flyjung.kr](https://flyjung.kr/).

A small static site with a local writing interface, an ASCII Boeing 787 and constellations linked to projects and experience. Built with HTML, CSS and JavaScript, using Node.js for page generation. No package installation is required.

## Local development

Requires Node.js 20 or later. Python 3 is needed only for ZIP packaging.

```sh
npm run check
npm run preview
```

Open http://127.0.0.1:4318/. To edit content, use `site/data/` for the CV and projects. Homepage layout is in `site/home/`; browser scripts, styles and assets are in `src/`.

## Writing

```sh
npm run write
```

Open http://127.0.0.1:4320/. Drafts stay in `.runtime/`. Register a finished post for publication to add it to `content/posts/`, then rebuild the site. Saving in the editor does not deploy anything.

## Public build

```sh
npm run check:public
npm run preview:public
npm run package:public
```

The public preview is at http://127.0.0.1:4319/. Deploy only the contents of `public-dist/`, or the verified ZIP at `.runtime/deploy/flyjung-public.zip`, to a static host. The output includes Cloudflare Pages headers and canonical URLs for `https://flyjung.kr`.

Generated files and local drafts are excluded from Git. Keep credentials and private source materials outside the public asset tree.

## License

Source code is available under the [MIT License](LICENSE). Fonts, project screenshots, personal content and third-party marks have separate terms; see [NOTICE](NOTICE).
