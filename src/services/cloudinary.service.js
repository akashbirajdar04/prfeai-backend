const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const os = require('os');
const path = require('path');

const uploadJSON = async (jsonData, folder) => {
    try {
        // Create temp file in system temp dir to avoid nodemon restarts
        const tempPath = path.join(os.tmpdir(), `temp_${Date.now()}.json`);
        fs.writeFileSync(tempPath, JSON.stringify(jsonData, null, 2));

        const result = await cloudinary.uploader.upload(tempPath, {
            resource_type: "raw",
            folder: folder || "webperf_artifacts",
            use_filename: true
        });

        // Cleanup
        await unlinkFile(tempPath);

        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        throw new Error("Artifact upload failed");
    }
};

module.exports = { uploadJSON };
