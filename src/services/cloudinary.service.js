const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);
const os = require('os');
const path = require('path');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadFile = async (filePath, folder) => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            resource_type: "raw",
            folder: folder || "webperf_artifacts",
            use_filename: true
        });
        return result.secure_url;
    } catch (error) {
        console.error("Cloudinary file upload failed:", error);
        throw new Error("File upload failed");
    }
};

const uploadJSON = async (jsonData, folder) => {
    try {
        const tempPath = path.join(os.tmpdir(), `temp_${Date.now()}.json`);
        fs.writeFileSync(tempPath, JSON.stringify(jsonData, null, 2));
        const url = await uploadFile(tempPath, folder);
        await unlinkFile(tempPath);
        return url;
    } catch (error) {
        console.error("Cloudinary upload failed:", error);
        throw new Error("Artifact upload failed");
    }
};

module.exports = { uploadJSON, uploadFile };
