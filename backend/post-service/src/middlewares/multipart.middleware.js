const Busboy = require('busboy');

function parseMultipartFormData(req, res, next) {
    // Check if it's multipart/form-data
    if (!req.headers['content-type'] ||
        !req.headers['content-type'].includes('multipart/form-data')) {
        return next();
    }

    const busboy = Busboy({
        headers: req.headers,
        limits: {
            fileSize: 10 * 1024 * 1024 // 10MB
        }
    });

    const fields = {};
    const files = {};

    busboy.on('field', (fieldname, value) => {
        console.log(`Field [${fieldname}]: value: ${value}`);
        fields[fieldname] = value;
    });

    busboy.on('file', (fieldname, file, info) => {
        console.log(`File [${fieldname}]: filename: ${info.filename}`);
        const { filename, mimeType } = info;

        const chunks = [];
        file.on('data', (chunk) => {
            chunks.push(chunk);
        });

        file.on('end', () => {
            if (!files[fieldname]) {
                files[fieldname] = [];
            }

            files[fieldname].push({
                fieldname,
                originalname: filename,
                mimetype: mimeType,
                buffer: Buffer.concat(chunks),
                size: Buffer.concat(chunks).length
            });
        });
    });

    busboy.on('finish', () => {
        console.log('Multipart parsing finished');
        console.log('Fields:', Object.keys(fields));
        console.log('Files:', Object.keys(files));

        req.body = fields;
        req.files = files;
        next();
    });

    busboy.on('error', (err) => {
        console.error('Multipart parsing error:', err);
        next(err);
    });

    req.pipe(busboy);
}

module.exports = parseMultipartFormData;