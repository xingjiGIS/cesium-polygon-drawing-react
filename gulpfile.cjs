const fs = require("fs");
const path = require("path");
const globby = require("globby");
const glslStripComments = require("glsl-strip-comments");
const gulp = require("gulp");
const rimraf = require("rimraf");

const minifyShaders = false;

gulp.task("build", function (done) {
    glslToJavaScript(minifyShaders, "src/cesium/shaders/minifyShaders.state");
    done();
});

function glslToJavaScript(minify, minifyStateFilePath) {
    fs.writeFileSync(minifyStateFilePath, minify.toString());
    const minifyStateFileLastModified = fs.existsSync(minifyStateFilePath)
        ? fs.statSync(minifyStateFilePath).mtime.getTime()
        : 0;

    // collect all currently existing JS files into a set, later we will remove the ones
    // we still are using from the set, then delete any files remaining in the set.
    const leftOverJsFiles = {};

    globby.sync(["src/cesium/shaders/**/*.js"]).forEach(function (file) {
        leftOverJsFiles[path.normalize(file)] = true;
    });

    const glslFiles = globby.sync([
        "src/cesium/shaders/**/*.glsl",
        "src/core/wind/glsl/*.frag",
        "src/core/wind/glsl/*.vert"
    ]);

    glslFiles.forEach(function (glslFile) {
        glslFile = path.normalize(glslFile);
        const baseName = path.basename(glslFile, ".glsl");
        const jsFile = path.join(path.dirname(glslFile), baseName) + ".js";

        delete leftOverJsFiles[jsFile];

        const jsFileExists = fs.existsSync(jsFile);
        const jsFileModified = jsFileExists ? fs.statSync(jsFile).mtime.getTime() : 0;
        const glslFileModified = fs.statSync(glslFile).mtime.getTime();

        if (jsFileExists && jsFileModified > glslFileModified && jsFileModified > minifyStateFileLastModified) {
            return;
        }

        let contents = fs.readFileSync(glslFile, "utf8");
        contents = contents.replace(/\r\n/gm, "\n");

        let copyrightComments = "";
        const extractedCopyrightComments = contents.match(/\/\*\*(?:[^*\/]|\*(?!\/)|\n)*?@license(?:.|\n)*?\*\//gm);
        if (extractedCopyrightComments) {
            copyrightComments = extractedCopyrightComments.join("\n") + "\n";
        }

        if (minify) {
            contents = glslStripComments(contents);
            contents = contents.replace(/\s+$/gm, "").replace(/^\s+/gm, "").replace(/\n+/gm, "\n");
            contents += "\n";
        }

        contents = contents.split('"').join('\\"').replace(/\n/gm, "\\n\\\n");
        contents =
            copyrightComments +
            '\
//This file is automatically rebuilt by the build process.\n\
export default "' +
            contents +
            '";\n';

        fs.writeFileSync(jsFile, contents);
    });

    // delete any left over JS files from old shaders
    Object.keys(leftOverJsFiles).forEach(function (filepath) {
        rimraf.sync(filepath);
    });
}
