const gulp = require('gulp')
const rollup = require('rollup')
const rlsvelte = require('rollup-plugin-svelte')

gulp.task('js', function(){
    return rollup.rollup({
        input: 'main.js',
        plugins: [
            rlsvelte({
                include: 'components/**/*.html',
            }),
        ]
    }).then(bundle => {
        return bundle.write({
            file: './dist/main.js',
            format: 'iife',
        })
    })
})

gulp.task('the_rest', function(){
    return gulp.src(['index.html', 'styles.css', 'ok.svg', 'fail.svg'])
        .pipe(gulp.dest('dist'))
})

gulp.task('default', ['js', 'the_rest'])

gulp.task('watch', ['default'], function(){
    gulp.watch(['index.html', 'main.js', 'styles.css', 'components/*.html', 'lib/*.js', '*.svg'], ['default'])
})
