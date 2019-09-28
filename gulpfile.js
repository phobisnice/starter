"user strict";

const gulp = require("gulp");
const pug = require("gulp-pug");
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const cleanCSS = require("gulp-clean-css");
const sourcemaps = require("gulp-sourcemaps");
const del = require("del");
const imagemin = require("gulp-imagemin");
const svgstore = require("gulp-svgstore");
const rename = require("gulp-rename");
const gulpif = require("gulp-if");
const webpack = require("webpack-stream");
const browserSync = require("browser-sync").create();

const isDev = !process.argv.includes("--prod");

const webpackConfig = {
  output: {
    filename: "bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      }
    ]
  },
  mode: isDev ? "development" : "production",
  devtool: isDev ? "eval-source-map" : "none"
};

function html() {
  return gulp
    .src("src/pug/pages/**/*.pug")
    .pipe(
      pug({
        pretty: true
      })
    )
    .pipe(gulp.dest("build"))
    .pipe(gulpif(isDev, browserSync.stream()));
}

function fonts() {
  return gulp
    .src("src/fonts/*")
    .pipe(gulp.dest("build/fonts"))
    .pipe(gulpif(isDev, browserSync.stream()));
}

function php() {
  return gulp
    .src("src/*.php")
    .pipe(gulp.dest("build"))
    .pipe(gulpif(isDev, browserSync.stream()));
}

function styles() {
  return gulp
    .src("src/scss/style.scss")
    .pipe(gulpif(isDev, sourcemaps.init()))
    .pipe(sass().on("error", sass.logError))
    .pipe(
      autoprefixer({
        cascade: false,
        overrideBrowserslist: ["> 0.1%"]
      })
    )
    .pipe(
      cleanCSS({
        level: 2
      })
    )
    .pipe(gulpif(isDev, sourcemaps.write()))
    .pipe(gulp.dest("build/css"))
    .pipe(gulpif(isDev, browserSync.stream()));
}

function scripts() {
  return gulp
    .src("./src/js/index.js")
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest("build/js"))
    .pipe(gulpif(isDev, browserSync.stream()));
}

function img() {
  return gulp
    .src("src/img/**/*.{jpg, png, gif}")
    .pipe(
      imagemin([
        imagemin.gifsicle({ interlaced: true }),
        imagemin.jpegtran({ progressive: true }),
        imagemin.optipng({ optimizationLevel: 7 })
      ])
    )
    .pipe(gulp.dest("build/img"));
}

function svg() {
  return gulp
    .src("src/img/svg/*.svg")
    .pipe(
      imagemin([
        imagemin.svgo({
          plugins: [{ cleanupIDs: true }]
        })
      ])
    )
    .pipe(svgstore({ inlineSvg: true }))
    .pipe(rename("sprite.svg"))
    .pipe(gulp.dest("build/img"))
    .pipe(gulpif(isDev, browserSync.stream()));
}

function watch() {
  gulp.watch("src/pug/**/*.pug", html);
  gulp.watch("src/scss/**/*.scss", styles);
  gulp.watch("src/js/**/*.js", scripts);
  gulp.watch("src/img/svg/*.svg", svg);
}

gulp.task("clear", function() {
  return del("build/*");
});

gulp.task("serve", function() {
  browserSync.init({
    server: {
      baseDir: "./build"
    }
  });
});

gulp.task("pug", html);
gulp.task("styles", styles);
gulp.task("watch", watch);
gulp.task("scripts", scripts);
gulp.task("img", img);
gulp.task("svg", svg);
gulp.task("fonts", fonts);
gulp.task("php", php);

let build = gulp.series(
  "clear",
  gulp.parallel("pug", "styles", "scripts", "img", "svg", "fonts", "php")
);

gulp.task("build", build);

gulp.task("default", gulp.series(build, gulp.parallel("watch", "serve")));
