/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*eslint no-fallthrough: "error"*/
/*global define */
define(function (require, exports, module) {
    "use strict";

    var LanguageManager = require('language/LanguageManager');
    var Sizes = require("filesystem/impls/filer/lib/Sizes");
    var Strings = require("strings");
    var StringUtils = require("utils/StringUtils");
    var FilerUtils = require('filesystem/impls/filer/FilerUtils');
    var Path = FilerUtils.Path;

    function _getLanguageId(ext) {
        ext = FilerUtils.normalizeExtension(ext, true);
        var language = LanguageManager.getLanguageForExtension(ext);
        return language ? language.getId() : "";
    }

    module.exports = {
        isImage: function(ext) {
            var id = _getLanguageId(ext);
            return id === "image" || id === "svg";
        },

        isResizableImage: function(ext) {
            ext = FilerUtils.normalizeExtension(ext);
            return ext === '.png' || ext === '.jpg' || ext === '.jpeg';
        },

        isHTML: function(ext) {
            var id = _getLanguageId(ext);
            return id === "html";
        },

        isCSS: function(ext) {
            var id = _getLanguageId(ext);
            return id === "css";
        },

        needsRewriting: function(ext) {
            return this.isHTML(ext) || this.isCSS(ext);
        },

        isMarkdown: function(ext) {
            var id = _getLanguageId(ext);
            return id === "markdown";
        },

        isArchive: function(ext) {
            ext = FilerUtils.normalizeExtension(ext);
            return ext === '.zip' || ext === '.tar'; 
        },

        mimeFromExt: function(ext) {
            ext = FilerUtils.normalizeExtension(ext);

            switch(ext) {
            case '.html':
            // fallsthrough
            case '.htmls':
            // fallsthrough
            case '.htm':
            // fallsthrough
            case '.htx':
            // fallsthrough            
            case '.md':
            // fallsthrough
            case '.markdown':
                return 'text/html';
            case '.ico':
                return 'image/x-icon';
            case '.bmp':
                return 'image/bmp';
            case '.css':
                return 'text/css';
            case '.js':
                return 'text/javascript';
            case '.txt':
                return 'text/plain';
            case '.svg':
                return 'image/svg+xml';
            case '.png':
                return 'image/png';
            case '.ico':
                return 'image/x-icon';
            case '.jpg':
            case '.jpe':
            case '.jpeg':
                return 'image/jpeg';
            case '.gif':
                return 'image/gif';
            // Some of these media types can be video or audio, prefer video.
            case '.mp4':
                return 'video/mp4';
            case '.mpeg':
                return 'video/mpeg';
            case '.ogg':
            case '.ogv':
                return 'video/ogg';
            case '.mov':
            case '.qt':
                return 'video/quicktime';
            case '.webm':
                return 'video/webm';
            case '.avi':
            case '.divx':
                return 'video/avi';
            case '.mpa':
            case '.mp3':
                return 'audio/mpeg';
            case '.wav':
                return 'audio/vnd.wave';
            // Web Fonts
            case '.eot':
                return 'application/vnd.ms-fontobject';
            case '.otf':
                return 'application/x-font-opentype';
            case '.ttf':
                return 'application/x-font-ttf';
            case '.woff':
                return 'application/font-woff';
            }

            return 'application/octet-stream';
        },

        // Whether or not this is a text/* mime type
        isTextType: function(mime) {
            return (/^text/).test(mime);
        },

        // Check if the file can be read in utf8 encoding
        isUTF8Encoded: function(ext) {
            var mime = this.mimeFromExt(ext);
            return this.isTextType(mime);
        },

        // Test if the given URL is really a relative path (into the fs)
        isRelativeURL: function(url) {
            if(!url) {
                return false;
            }

            return !(/\:?\/\//.test(url) || /\s*data\:/.test(url));
        },

        // Test for a Blob URL, eg: blob:http://localhost:8000/bf64f1e0-044d-4673-ba7d-156251db09f8
        isBlobURL: function(url) {
            if(!url) {
                return false;
            }

            return /^blob\:/.test(url);
        },

        /**
         * Determine whether we want to allow a file to be imported based on name and size.
         */
        shouldRejectFile: function(filename, size) {
            var ext = Path.extname(filename);
            var mime = this.mimeFromExt(ext);
            var isArchive = this.isArchive(ext);

            var sizeLimit;
            if(this.isResizableImage(ext)) {
                sizeLimit = Sizes.RESIZABLE_IMAGE_FILE_LIMIT_MB;
            } else if(isArchive) {
                sizeLimit = Sizes.ARCHIVE_FILE_LIMIT_MB;
            } else {
                sizeLimit = Sizes.REGULAR_FILE_SIZE_LIMIT_MB;
            }
            var sizeLimitMb = (sizeLimit / (Sizes.MB)).toString();

            if (size > sizeLimit) {
                return new Error(StringUtils.format(Strings.DND_MAX_SIZE_EXCEEDED, sizeLimitMb));
            }

            // If we don't know about this language type, or the OS doesn't think
            // it's text, reject it.
            var isSupported = !!LanguageManager.getLanguageForExtension(FilerUtils.normalizeExtension(ext, true));
            var typeIsText = this.isTextType(mime);

            if (isSupported || typeIsText || isArchive) {
                return null;
            }
            return new Error(Strings.DND_UNSUPPORTED_FILE_TYPE);
        },


        /**
         * Test if image data size is too big (250K)
         */
        isImageTooLarge: function(byteLength) {
            return byteLength > Sizes.RESIZED_IMAGE_TARGET_SIZE_KB;
        }

    };
});
