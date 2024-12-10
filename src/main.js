const core = require("@actions/core");
const { context, getOctokit } = require("@actions/github");

async function run() {
  try {
    const token = process.env.GITHUB_TOKEN;
    if (token == null) {
      throw new Error("The GITHUB_TOKEN environment variable was not set");
    }

    const rawVersionSlug = core.getInput("version-slug");
    const rawVersionKey = core.getInput("version-key");
    const versionSlug = !rawVersionSlug ? "v$version" : rawVersionSlug;
    const versionKey = !rawVersionKey ? "version" : rawVersionKey;

    log("INPUTS:");
    log(`VERSION-SLUG: ${versionSlug}`);
    log(`VERSION-KEY: ${versionKey}`);

    log("Gathering commit...");

    // get commit information
    const commits = context.payload.commits;
    if (commits == null || commits.length === 0) {
      throw new Error("No commits found.");
    }
    const commit = commits[commits.length - 1];
    const pkgInfo = await getCommitInfo(token, "package.json", commit.id);

    log("Parsing version...");

    // load version
    const verRegex = new RegExp(`"${versionKey}":\s*"(.+)"`);
    const verMatch = verRegex.exec(pkgInfo);
    // const verMatch = /"version":\s*"(.+)"/.exec(pkgInfo);
    if (verMatch === null || !verMatch[1]) {
      return setFailed(
        `Version key "${versionKey}" was not found in package.json.`,
      );
    }
    const version = versionSlug.replace(/\$version/, verMatch[1]);

    log(`Found version: ${version}`);
    core.setOutput("version", version);
  } catch (e) {
    core.setFailed(e.message ?? "An error has occurred.");
  }
}

/**
 * Get a file's contents from a commit
 */
async function getCommitInfo(token, path, ref) {
  const gh = getOctokit(token);
  let response;

  try {
    response = await gh.rest.repos.getContent({
      ...context.repo,
      path,
      ref,
    });
  } catch (e) {
    return "";
  }

  const { data } = response;

  if (Array.isArray(data)) {
    throw new Error(
      `The path ${path} is a folder. Please provide a file path.`,
    );
  }

  if (data.type === "symlink" && !data.content) {
    return await getCommitInfo(data.target, ref);
  }

  if (data.type === "submodule") {
    throw new Error(`The file cannot be inside of a submodule`);
  }

  if (!data.content) {
    return "";
    // throw new Error( `Something went wrong when trying to get the file at ${path}`);
  }

  return Buffer.from(data.content, "base64").toString("binary");
}

function log(data) {
  console.log(...data);
}

module.exports = {
  run,
};
