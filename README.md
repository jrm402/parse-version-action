# Parse Version Action

GitHub Action that will parse and get a version from the `package.json` file.

## Run Parse Version Action

This action will install `npm` and extracts the version from your `package.json` file.

### Usage

```yaml
- uses: actions/checkout@v4
- uses: jrm402/parse-version-action@latest
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

In the most basic usage, the `parse-version-action` requires only that you set the `GITHUB_TOKEN` environment variable so it can interact with the GitHub repository to read the `package.json` file.

View available [configuration options](#options) below.

### Options

#### version-slug

_Optional_

Specify the slug value to use for the returned version. The slug `$version` is replaced with the version obtained from the `package.json` file.

```yaml
- uses: jrm402/parse-version-action@latest
  with:
    version-slug: "ver-$version"
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Default value:** `v$version`

#### version-key

_Optional_

Specify the version key in the `package.json` file that should be used for the version.

```yaml
- uses: jrm402/parse-version-action@latest
  with:
    version-key: "releaseVersion"
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

`package.json`:

```json
{
  "name": "sample-package",
  "releaseVersion": "4.0.2"
}
```

**Default value: `version`**

### Outputs

This action will register the `version-slug` value with `$version` relpaced with the version found in the `package.json` file.

The version found can be used by referencing the step outputs (see [examples](#examples) below): `steps.step-id.outputs.version`

Here is an example table to demonstrate various matches.

| `package.json` version | `version-slug` | Version Output |
| ---------------------- | -------------- | -------------- |
| 1.2.0                  | `v$version`    | v1.2.0         |
| 0.5.1                  | `ver-$version` | ver-0.5.1      |
| 42.0.2                 | `$version`     | 42.0.2         |

### Examples

This section contains some sample workflows that show how to use `parse-version-action`.

#### Get Version for Package Push to `ghcr.io`

The following workflow demonstrates how to use `parse-version-action` in a basic scenario:

```yaml
name: Build package
run-name: Build and push a package to ghcr.io
on:
  push:
    branches: ["main"]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # Checkout codebase
      - name: Checkout codebase
        uses: actions/checkout@v4

      # Gather verion details
      - name: Gather version
	    id: get-version
	  	uses: jrm402/parse-version-action@latest
		env:
		  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # Login against a Docker registry
      - name: Log into registry ${{ env.REGISTRY }}
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      # Build and push the docker image
      - name: Build the Docker image
        run: docker build . -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ steps.get-version.outputs.version }} -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest --push
```

This workflow is triggered when you push changes to the `main` branch of the repository. Two environment variables are set for the action to use later.

The workflow will first checkout the code. Then, `parse-version-action` runs to get the package version. Next the Docker login is performed. Finally, the codebase is built and pushed to the repo with two tags: one with the version and one with `latest`.

#### Get Custom Version from `package.json`

The following workflow demonstrates how to use custom version key and slug options.

```yaml
name: Print version
on:
  push:
    branches: ["main"]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      # Gather verion details
      - name: Gather version
        id: get-version
        uses: jrm402/parse-version-action@latest
        with:
          version-slug: "ver-$version"
          version-key: "release-version"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      # Print results
      - name: Print results
        run: echo "${{ steps.get-version.outputs.version }}"
```

This workflow is triggered when you push changes to the `main` branch of the repository.

The workflow will first run the `parse-version-action` to get the package version. Custom options are passed to the action: A new `version-slug` and the appropriate key to search the `package.json` file for. Then, the version is printed to the action log.

## License

This project is licensed under the [MIT License](/LICENSE).
