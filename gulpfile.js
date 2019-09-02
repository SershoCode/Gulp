const fs = require('fs'),
	gulp = require('gulp'),
	sass = require('gulp-sass'),
	size = require('gulp-size'),
	clean = require('gulp-clean'),
	rigger = require('gulp-rigger'),
	concat = require('gulp-concat'),
	htmlmin = require('gulp-htmlmin'),
	plumber = require('gulp-plumber'),
	imagemin = require('gulp-imagemin'),
	cleanCSS = require('gulp-clean-css'),
	prefix = require('gulp-autoprefixer'),
	sourcemaps = require('gulp-sourcemaps'),
	uglify = require('gulp-uglify-es').default,
	compress = require('imagemin-jpeg-recompress'),
	browserSync = require('browser-sync').create();

//*Выбираем CSS препроцессор (.sass .scss .less .styl)
const preProcessor = '.sass';

//*Подпапки в папке APP
const foldersCreate = ['IMG', 'JS', 'FONTS', 'TEMPLATES'];
//*Подпапки в папке стилей
const stylesCreate = ['_mixins', '_header', '_navbar', '_aside-left', '_content', '_footer', '_media'];
//*Подпапки в папке html шаблонов
const htmlsCreate = ['head', 'header', 'navbar', 'aside-left', 'footer', 'scripts'];

//#region Выполнение
//*Пути файлов
let preProcessorName = preProcessor.replace('.', '').toUpperCase();
const paths = {
	htmlSrc: 'APP/*.html',
	prpSrc: `APP/${preProcessorName}`,
	prpFiles: `APP/${preProcessorName}/**/*${preProcessor}`,
	jsSrc: 'APP/JS/**/*.js',
	imgSrc: 'APP/IMG/**/*',
	tempSrc: 'APP/TEMPLATES/**/*.html',
	fontSrc: 'APP/FONTS*',
	htmlDist: 'DIST',
	cssDist: 'DIST',
	jsDist: 'DIST',
	imgDist: 'DIST/IMG',
	fontDist: 'DIST',
};

//*Создаем файлы и папки, заполняем их
gulp.task('start', done => {
	new Promise(() => {
		//*Создаем папки APP и DIST и папку препроцессора
		setTimeout(() => {}, 1000);
		if (!fs.existsSync('APP')) fs.mkdirSync('APP');
		if (!fs.existsSync('DIST')) fs.mkdirSync('DIST');
		if (!fs.existsSync(paths.prpSrc)) fs.mkdirSync(paths.prpSrc);

		//*Создаем основные папки
		foldersCreate.forEach(folder => {
			if (!fs.existsSync(`APP/${folder}`)) fs.mkdirSync(`APP/${folder}`);
		});

		//*Cоздаем файлы стилей
		stylesCreate.forEach(styleFile => {
			let fileName = `${paths.prpSrc}/${styleFile}${preProcessor}`;
			if (!fs.existsSync(fileName)) fs.writeFileSync(fileName, '');
		});

		//*Cоздаем HTML файлы
		htmlsCreate.forEach(htmlFile => {
			let fileName = `APP/TEMPLATES/${htmlFile}.html`;
			if (!fs.existsSync(fileName)) fs.writeFileSync(fileName, '');
		});

		//*Заполняем нужные файлы контентом
		fs.writeFileSync('APP/index.html', indexContent);
		fs.writeFileSync('APP/TEMPLATES/head.html', headContent);
		fs.writeFileSync('APP/TEMPLATES/scripts.html', scriptsContent);
		fs.writeFileSync('.gitignore', 'node_modules\n.log');
		fs.writeFileSync(`${paths.prpSrc}/styles${preProcessor}`, '');

		//* Контент style файла
		(() => {
			let styleFile = `${paths.prpSrc}/styles${preProcessor}`;

			stylesCreate.forEach(fileName => {
				if (preProcessor === '.scss' || preProcessor === '.less') {
					fs.appendFileSync(styleFile, `@import '${fileName.replace('_', '')}';\n`);
				} else if (preProcessor === '.sass') {
					fs.appendFileSync(styleFile, `@import '${fileName.replace('_', '')}'\n`);
				} else {
					fs.appendFileSync(styleFile, `@import '${fileName}.styl';\n`);
				}
			});
		})();
	}).then(console.log(`Style файлы созданы!\nРаботаем с препроцессором => ${preProcessor.replace('.', '').toUpperCase()}`));
	done();
});

//*Обрабатываем HTML
gulp.task('html', () => {
	return gulp
		.src(paths.htmlSrc)
		.pipe(plumber())
		.pipe(size())
		.pipe(rigger())
		.pipe(htmlmin({ collapseWhitespace: true, removeComments: true, removeEmptyAttributes: true, removeEmptyElements: true, sortAttributes: true, sortClassName: true })) //Минифицируем html код
		.pipe(gulp.dest(paths.htmlDist))
		.pipe(size())
		.pipe(browserSync.stream());
});

//*Обрабатываем CSS
gulp.task('css', () => {
	return gulp
		.src(`${paths.prpFiles}`)
		.pipe(plumber())
		.pipe(size())
		.pipe(sourcemaps.init())
		.pipe(sass().on('error', sass.logError))
		.pipe(prefix('last 2 versions'))
		.pipe(concat('styles.min.css'))
		.pipe(cleanCSS({ level: 2 }))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(paths.cssDist))
		.pipe(size())
		.pipe(browserSync.stream());
});

//*Обрабатываем JS
gulp.task('js', () => {
	return gulp
		.src(paths.jsSrc)
		.pipe(plumber())
		.pipe(size())
		.pipe(concat('scripts.min.js'))
		.pipe(uglify({ toplevel: true }))
		.pipe(gulp.dest(paths.jsDist))
		.pipe(size())
		.pipe(browserSync.stream());
});

//*Обрабатываем IMG
gulp.task('img', () => {
	return gulp
		.src(paths.imgSrc)
		.pipe(plumber())
		.pipe(
			imagemin([
				compress({
					loops: 4,
					min: 70,
					max: 80,
					quality: 'veryhigh',
				}),
				imagemin.gifsicle(),
				imagemin.optipng(),
				imagemin.svgo(),
			]),
		)
		.pipe(gulp.dest(paths.imgDist))
		.pipe(browserSync.stream());
});

//* Обрабатываем шрифты
gulp.task('fonts', () => {
	return gulp
		.src(paths.fontSrc)
		.pipe(plumber())
		.pipe(gulp.dest(paths.fontDist));
});

//* Удаляем папку DIST
gulp.task('clean', () => {
	return gulp.src(['DIST/*', '!DIST/favicon.ico'], { read: false }).pipe(clean());
});

//* Следим за изменениями
gulp.task('watch', () => {
	//Запускаем browser-Sync
	browserSync.init({
		server: {
			baseDir: 'DIST',
		},
		port: 80,
		notify: false,
	});
	//Следим за HTML
	gulp.watch([paths.htmlSrc, paths.tempSrc], gulp.series('html'));
	//Следим за CSS
	gulp.watch(paths.prpFiles, gulp.series('css'));
	//Следим за JS
	gulp.watch(paths.jsSrc, gulp.series('js'));
});

//* Gulp build
gulp.task('build', gulp.series('clean', 'html', 'css', 'js', 'img', 'fonts'));

//* Gulp default
gulp.task('default', gulp.series('build', 'watch'));

//* Содержимое файлов
//#region Contents

//*Контент head.html
const headContent = `<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<!-- !Favicon -->
<link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
<!-- !Normalize.css -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css" />
<!-- !Bootstrap -->
<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous" />
<!-- !Animate.css -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/3.7.2/animate.min.css" />
<!-- !Google Fonts -->
<link href="https://fonts.googleapis.com/css?family=Livvic|Pacifico&display=swap" rel="stylesheet" />
<!-- !Font Awesome -->
<link href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css" rel="stylesheet" integrity="sha384-wvfXpqpZZVQGK6TAh5PVlGOfQNHSoD2xbE+QkPxCAFlNEevoEH3Sl0sibVcOQVnN" crossorigin="anonymous" />
<!-- !Main Scripts -->
<link rel="stylesheet" href="styles.min.css" />
`;

//* Контент scripts.html
const scriptsContent = `<!-- !jQuery -->
<script src="https://code.jquery.com/jquery-3.4.1.min.js" integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" crossorigin="anonymous"></script>
<!-- !Popper.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.12.9/umd/popper.min.js" integrity="sha384-ApNbgh9B+Y1QKtv3Rn7W3mgPxhU9K/ScQsAP7hUibX39j7fakFPskvXusvfa0b4Q" crossorigin="anonymous"></script>
<!-- !Bootstrap -->
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/js/bootstrap.min.js" integrity="sha384-JZR6Spejh4U02d8jOt6vLEHfe/JQGiRRSQQxSfFWpi1MquVdAyjUar5+76PVCmYl" crossorigin="anonymous"></script>
<!-- !Main Scripts -->
<script src="scripts.min.js"></script>`;

//* Контент index.html
const indexContent = `<!DOCTYPE html>
<html lang="ru">
	<head>
		<title>Главная страница</title>
		//= 'TEMPLATES/head.html'
	</head>
	<body>
		<div class="container-fluid body-container"></div>

		<!-- Header -->
		<header>
			//= 'TEMPLATES/header.html'
		</header>
		<!-- Header -->

		<!-- Navbar -->
		<nav></nav>
		<!-- Aside -->

		<!-- Aside -->
		<aside></aside>
		<!-- Aside -->

		<!-- Main -->
		<main></main>
		<!-- Main -->

		<!-- Footer -->
		<footer></footer>
		<!-- Footer -->

	</div>
		<!-- Scripts connection -->
		//= 'TEMPLATES/scripts.html'
		<!-- Scripts connection -->
	</body>
</html>`;

//#endregion

//#endregion
