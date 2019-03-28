const childProcess = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const prtJsonPath = path.join(os.homedir(), ".prt.json");

const prtJson = JSON.parse(fs.readFileSync(prtJsonPath).toString());

module.exports = function(argv) {
  switch (argv[1]) {
    case "add": {
      const user = argv[2];
      const repo = argv[3];
      const number = argv[4];
      return add(user, repo, number);
    }

    case "open": {
      const index = argv[2];

      return open(index);
    }

    case "rm": {
      const id = argv[2];

      return remove(id);
    }

    default: {
      return list();
    }
  }
};

function add(user, repo, number) {
  console.log(`🐕 Adding tracked pull request ${user}/${repo} #${number}...\n`);

  const newId =
    1 + Object.keys(prtJson.prs).reduce((max, id) => Math.max(max, id), 0);

  prtJson.prs[newId] = { user, repo, number };

  fs.writeFileSync(prtJsonPath, JSON.stringify(prtJson, null, 2));
}

function open(id) {
  console.log(`🐕 Opening tracked pull request [${id}]...\n`);

  const prs = id == "all" ? prtJson.prs : [prtJson.prs[id]];

  prs.forEach(pr => {
    const { user, repo, number } = pr;

    run("pr", "-B", "--user", user, "--repo", repo, "--number", number);
  });
}

function remove(id) {
  console.log(`🐕 Removing tracked pull request [${id}]...\n`);

  delete prtJson.prs[id];

  fs.writeFileSync(prtJsonPath, JSON.stringify(prtJson, null, 2));
}

function list() {
  console.log("🐕 Listing tracked pull requests...\n");

  Object.entries(prtJson.prs).forEach(([id, pr]) => {
    const { user, repo, number } = pr;

    console.log(`🐕 [${id}] https://github.com/${user}/${repo}/pull/${number}`);

    const proc = run("pr", "-I", "-u", user, "-r", repo, "-n", number);

    console.log(`${proc.stdout}\n`);
  });

  prtJson.repos.forEach(repo => {
    const parts = repo.split("/");

    console.log(`🐕 https://www.github.com/${repo}/pulls`);

    const proc = run("pr", "-l", "-u", parts[0], "-r", parts[1]);

    console.log(`${proc.stdout}\n`);
  });
}

function run(...args) {
  const proc = childProcess.spawnSync("gh", args, {
    shell: true,
    stdio: "pipe"
  });

  if (proc.error) {
    console.error(proc.error);
    process.exit(1);
  }

  let out = proc.stdout.toString();

  while (out.charAt(out.length - 1) == "\n") {
    out = out.substr(0, out.length - 1);
  }

  proc.stdout = out;

  return proc;
}
