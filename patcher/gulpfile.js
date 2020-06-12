const fs      = require('fs'),
      gulp    = require('gulp'),
      include = require('gulp-include'),
      rename  = require('gulp-rename'),
      zip     = require('gulp-zip'),
      del     = require('del')

gulp.task('clean', async function () {
  let moduleInfo = JSON.parse(fs.readFileSync('module.json').toString()),
      moduleId   = moduleInfo.id
  let modulePath = process.env.ZEDIT_PATH + 'modules\\' + moduleId
  let scriptPath = process.env.ZEDIT_PATH + 'scripts'
  del.sync(['dist/*'])
  del.sync([modulePath + '\\*'], { force: true })
  del.sync([scriptPath + '\\build-master.js'], { force: true })
})

gulp.task('build', gulp.series('clean', function () {
  let moduleInfo = JSON.parse(fs.readFileSync('module.json').toString()),
      moduleId   = moduleInfo.id
  let modulePath = process.env.ZEDIT_PATH + 'modules\\' + moduleId
  let scriptPath = process.env.ZEDIT_PATH + 'scripts'

  return Promise.all([

    gulp.src('index.js').pipe(include()).on('error', console.log).pipe(gulp.dest('dist')).pipe(gulp.dest(modulePath)),

    gulp.src('build-master.js')
        .pipe(include())
        .on('error', console.log)
        .pipe(gulp.dest('dist'))
        .pipe(gulp.dest(scriptPath)),

    gulp.src('partials/*.html').pipe(gulp.dest('dist/partials')).pipe(gulp.dest(modulePath)),

    gulp.src('docs/*.html').pipe(gulp.dest('dist/docs')).pipe(gulp.dest(modulePath)),

    gulp.src('module.json').pipe(gulp.dest('dist')).pipe(gulp.dest(modulePath)),
  ])
}))

gulp.task('release', function () {
  let moduleInfo    = JSON.parse(fs.readFileSync('module.json').toString()),
      moduleId      = moduleInfo.id,
      moduleVersion = moduleInfo.version,
      zipFileName   = `${moduleId}-v${moduleVersion}.zip`

  console.log(`Packaging ${zipFileName}`)

  return gulp.src('dist/**/*', { base: 'dist/' })
             .pipe(rename((path) => path.dirname = `${moduleId}/${path.dirname}`))
             .pipe(zip(zipFileName))
             .pipe(gulp.dest('.'))
})

gulp.task('default', gulp.series('build', 'release'))
