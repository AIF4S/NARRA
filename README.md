# NARRA website

This directory contains the public project website for **NARRA: Self-Adapting Video World Models at Test Time**.

## Preview locally

From this directory, run:

```bash
python3 serve_local.py 4174
```

Then open `http://127.0.0.1:4174`.

## Publishing

The `dist` directory is the deployable static site. During development, keep this version local and publish only when
the release content is approved.

Large source assets and the original, higher-bitrate delivery videos are preserved outside this folder at
`/home/paula/NARRA_website_source_archive_20261014`.
