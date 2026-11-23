const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const source = path.resolve(__dirname, '..');
const baseEnvironment = { ...process.env };
for (const key of ['CI', 'HUSKY', 'NODE_ENV', 'npm_config_omit']) {
  delete baseEnvironment[key];
}

function run(cwd, command, args, env = {}) {
  return execFileSync(command, args, {
    cwd,
    env: { ...baseEnvironment, ...env },
    encoding: 'utf8',
    stdio: 'pipe',
  }).trim();
}

function fixture(work) {
  const directory = fs.mkdtempSync(
    path.join(os.tmpdir(), 'coding-labs-maintenance-')
  );
  try {
    for (const file of [
      'package.json',
      'package-lock.json',
      '.prettierrc',
      '.prettierignore',
      'lint-staged.config.mjs',
      '.husky/pre-commit',
    ]) {
      const target = path.join(directory, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(source, file), target);
    }
    return work(directory);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function initializeGit(directory) {
  run(directory, 'git', ['init', '--quiet']);
  run(directory, 'git', ['config', 'user.name', 'Tooling fixture']);
  run(directory, 'git', ['config', 'user.email', 'fixture@example.invalid']);
  run(directory, 'git', ['config', 'commit.gpgsign', 'false']);
}

test('clean developer install, hook formatting, partial staging and commit rejection', () => {
  fixture((directory) => {
    initializeGit(directory);
    run(directory, 'npm', ['ci', '--no-audit', '--no-fund']);
    assert.equal(
      run(directory, 'git', ['config', '--get', 'core.hooksPath']),
      '.husky/_'
    );
    const file = path.join(directory, 'example.ts');
    fs.writeFileSync(
      file,
      'export const staged = 0;\nexport const unstaged = 0;\n'
    );
    fs.writeFileSync(
      path.join(directory, '.gitignore'),
      'node_modules/\n.husky/_/\n'
    );
    run(directory, 'git', ['add', 'example.ts']);
    run(directory, 'git', ['commit', '--quiet', '-m', 'fixture baseline']);
    fs.writeFileSync(
      file,
      'export const staged=1;\nexport const unstaged = 0;\n'
    );
    run(directory, 'git', ['add', 'example.ts']);
    fs.writeFileSync(
      file,
      'export const staged=1;\nexport const unstaged = 2;\n'
    );
    fs.writeFileSync(
      path.join(directory, 'unrelated.txt'),
      'untouched unstaged data'
    );
    fs.mkdirSync(path.join(directory, 'contracts'));
    const generated = 'export const generated=1;\n';
    fs.writeFileSync(path.join(directory, 'contracts/generated.ts'), generated);
    run(directory, 'git', ['add', 'contracts/generated.ts']);
    run(directory, 'git', ['commit', '--quiet', '-m', 'fixture formatted']);
    assert.equal(
      run(directory, 'git', ['show', 'HEAD:example.ts']),
      'export const staged = 1;\nexport const unstaged = 0;'
    );
    assert.equal(
      fs.readFileSync(file, 'utf8'),
      'export const staged = 1;\nexport const unstaged = 2;\n'
    );
    assert.equal(
      fs.readFileSync(path.join(directory, 'unrelated.txt'), 'utf8'),
      'untouched unstaged data'
    );
    assert.equal(
      fs.readFileSync(path.join(directory, 'contracts/generated.ts'), 'utf8'),
      generated
    );
    const previousCommit = run(directory, 'git', ['rev-parse', 'HEAD']);
    fs.writeFileSync(file, 'export const =;\n');
    run(directory, 'git', ['add', 'example.ts']);
    assert.throws(() =>
      run(directory, 'git', ['commit', '--quiet', '-m', 'must fail'])
    );
    assert.equal(run(directory, 'git', ['rev-parse', 'HEAD']), previousCommit);
    const violation = 'export const bad=1;\n';
    fs.writeFileSync(file, violation);
    assert.throws(() =>
      run(directory, 'node', [
        'node_modules/prettier/bin/prettier.cjs',
        '--check',
        'example.ts',
      ])
    );
    assert.equal(fs.readFileSync(file, 'utf8'), violation);
    run(directory, 'git', ['config', '--unset', 'core.hooksPath']);
    run(directory, 'npm', ['run', 'prepare'], { HUSKY: '0' });
    assert.notEqual(
      spawnSync('git', ['config', '--get', 'core.hooksPath'], {
        cwd: directory,
      }).status,
      0
    );
  });
});

for (const scenario of [
  { name: 'CI install with Git', git: true, env: { CI: 'true' }, args: [] },
  {
    name: 'Docker-style package-only install without Git',
    git: false,
    env: {},
    args: [],
  },
  {
    name: 'production install omitting devDependencies with Git',
    git: true,
    env: { NODE_ENV: 'production' },
    args: ['--omit=dev'],
  },
]) {
  test(scenario.name, () =>
    fixture((directory) => {
      if (scenario.git) initializeGit(directory);
      // Docker copies only package manifests before npm ci, not hook/config files.
      if (!scenario.git) {
        fs.rmSync(path.join(directory, '.husky'), { recursive: true });
        for (const file of [
          '.prettierrc',
          '.prettierignore',
          'lint-staged.config.mjs',
        ]) {
          fs.unlinkSync(path.join(directory, file));
        }
      }
      run(
        directory,
        'npm',
        ['ci', '--no-audit', '--no-fund', ...scenario.args],
        scenario.env
      );
      if (scenario.git) {
        assert.notEqual(
          spawnSync('git', ['config', '--get', 'core.hooksPath'], {
            cwd: directory,
          }).status,
          0
        );
      }
      if (scenario.args.includes('--omit=dev')) {
        assert.equal(
          fs.existsSync(path.join(directory, 'node_modules/husky')),
          false
        );
      }
    })
  );
}
