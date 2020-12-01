var fs = require('fs');
var path = require('path');

var readdir = (root, filter, files, prefix) => {
  prefix = prefix || ''
  files = files || [];
  filter = filter || function () {};

  var dir = path.join(root, prefix);
  if (!fs.existsSync(dir)) return files;
  if (fs.statSync(dir).isDirectory()) {
    fs.readdirSync(dir)
    .filter(function (name, index) {
      return filter(name, index, dir)
    })
    .forEach(function (name) {
      readdir(root, filter, files, path.join(prefix, name));
    });
  } else {
    files.push(prefix);
  }

  return files
}

var root = path.join(__dirname, "..", "..", "src");
var filePaths = readdir(root, (name, index, dir) => {
  return name.endsWith(".html") || name.indexOf(".") === -1;
});

var results = [];
filePaths.forEach((fPath) => {
  if (fPath.indexOf(".") === -1) {
    return;
  }
  var content = fs.readFileSync(path.join(root, fPath), { encoding: "utf8" });
  var matches = content.match(/\{\{\n*?\s*?(('|").+?('|"))\s*?\|\s+?translate\s*?\n*?\}\}/g);
  if (matches) {
    results = results.concat(matches.map((matched) => {
      return matched.replace(/\n/g, "").replace(/^.+(('|")(.+?)('|"))\s*?\|\s*?translate.+$/g, "$3");
    }));
  }
});

var translationsFilePath = path.join(root, "assets", "translation-keys.json");
if (!fs.existsSync(translationsFilePath)) {
  translationsFilePath = path.join(root, "assets", "i18n", "translation-keys.json")
}

var currentTranslations = new Set(JSON.parse(fs.readFileSync(translationsFilePath, { encoding: "utf8" })));
results.forEach((item) => {
  currentTranslations.add(item);
});

fs.writeFileSync(translationsFilePath, JSON.stringify(Array.from(currentTranslations), null, 2));
