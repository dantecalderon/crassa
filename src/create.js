const path = require('path')
const fs = require('fs')
const childProcess = require('child_process')

const { copyDir, replaceAll, colorize } = require('./util')
const { packageRootPath } = require('./paths')

const { version } = require('../package.json')

async function create({ projectName, projectFolderName, manager, urlTemplate }) {
  const download = require('download-git-repo')
  const rimraf = require('rimraf')
  const folderNameToUse = projectFolderName || projectName
  const pathToUse = path.resolve(process.cwd(), folderNameToUse)
  const [ , name ] = urlTemplate.split('/')
  const tmp = '../tmp'
  const templatePath = tmp + name

  console.log(`Creating project ${colorize(projectName).FgCyan()} in ${colorize(pathToUse).FgCyan()}...`)

  const packageJSONTemplate = fs.readFileSync(path.resolve(__dirname, './templates/package.template.json'))
  let packageJSON = replaceAll(packageJSONTemplate.toString(), '{-- project-name --}', projectName)
  packageJSON = replaceAll(packageJSON.toString(), '{-- project-version --}', version)

  if(fs.existsSync(path.resolve(__dirname, tmp))) {
    if(fs.existsSync(path.resolve(__dirname, tmp, name))) rimraf.sync(path.resolve(__dirname, tmp, name))
    fs.mkdirSync(path.resolve(__dirname, tmp, name))
  } else {
    fs.mkdirSync(path.resolve(__dirname, tmp))
    fs.mkdirSync(path.resolve(__dirname, tmp, name))
  }

  download(urlTemplate, path.resolve(__dirname, templatePath), async function(err) {
    if(err) {
      console.log(err)
    } else {
      await copyDir({
        source     : path.resolve(__dirname, templatePath, 'template'),
        destination: pathToUse
      })

      // Create real package.json
      fs.writeFileSync(path.join(pathToUse, 'package.json'), packageJSON)

      const vscodeConfigTemplate = fs.readFileSync(path.resolve(__dirname, './templates/settings.template.json'))
      const vscodeConfig = replaceAll(vscodeConfigTemplate.toString(), '{-- eslintrcPath --}', path.join(packageRootPath, '.eslintrc'))

      const vscodeFolder = path.join(pathToUse, '.vscode')
      if(!fs.existsSync(vscodeFolder)) fs.mkdirSync(vscodeFolder)

      fs.writeFileSync(path.join(vscodeFolder, 'settings.json'), vscodeConfig)

      const gitIgnore = fs.readFileSync(path.resolve(__dirname, './templates/gitignore.template'))
      fs.writeFileSync(path.join(pathToUse, '.gitignore'), gitIgnore)

      const npmrc = fs.readFileSync(path.resolve(__dirname, './templates/npmrc.template'))
      fs.writeFileSync(path.join(pathToUse, '.npmrc'), npmrc)

      const packageManager = {
        params: '',
        output: 'yarn dev'
      }

      if(manager === 'npm') {
        packageManager.params = 'install'
        packageManager.output = 'npm run dev'
      }
      // Install all dependencies
      setTimeout(() => {
        childProcess.spawnSync(manager, [ packageManager.params ], {
          cwd  : pathToUse,
          stdio: 'inherit'
        })
        childProcess.execSync('git init . && git add . && git commit -m "Initialized app with crassa!"', { cwd: pathToUse })
        console.log(colorize('Project was successfully created.').FgGreen())
        console.log(colorize('To get started, execute:').FgCyan())
        console.log(colorize(`cd ${folderNameToUse}`).Underscore())
        console.log(colorize(packageManager.output).Underscore())
      }, 300)
    }
  })
}

module.exports = create
