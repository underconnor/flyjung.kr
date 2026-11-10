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

The public preview is at http://127.0.0.1:4319/. Deploy only the contents of `public-dist/`, or the verified ZIP at `.runtime/deploy/flyjung-public.zip`, to a static host. Canonical URLs use `https://flyjung.kr`.

GitHub Actions builds and checks pushes to `main`, then deploys only `public-dist/` to GitHub Pages. The workflow can also be run manually; deployment is restricted to `main`. In the repository's Pages settings, select GitHub Actions and set the custom domain to `flyjung.kr`. Commits intended for deployment must not include `[skip ci]`.

The generated `_headers` file is specific to Cloudflare Pages and is ignored by GitHub Pages. The HTML Content-Security-Policy meta tags remain active.

Generated files and local drafts are excluded from Git. Keep credentials and private source materials outside the public asset tree.

## License

Source code is available under the [MIT License](LICENSE). Fonts, project screenshots, personal content and third-party marks have separate terms; see [NOTICE](NOTICE).
