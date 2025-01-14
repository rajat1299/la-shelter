const AWS = require('aws-sdk');
const config = require('../config/config');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

const s3 = new AWS.S3({
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
    region: config.aws.region
});

class ImageService {
    async uploadImage(imageBuffer, originalName) {
        try {
            // Optimize image
            const optimizedImage = await sharp(imageBuffer)
                .resize(1200, 1200, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality: 80 })
                .toBuffer();

            const key = `listings/${uuidv4()}-${originalName}`;
            
            await s3.putObject({
                Bucket: config.aws.bucketName,
                Key: key,
                Body: optimizedImage,
                ContentType: 'image/jpeg'
            }).promise();

            return `https://${config.aws.bucketName}.s3.amazonaws.com/${key}`;
        } catch (error) {
            throw new Error(`Failed to upload image: ${error.message}`);
        }
    }

    async deleteImage(imageUrl) {
        try {
            const key = imageUrl.split('.com/')[1];
            await s3.deleteObject({
                Bucket: config.aws.bucketName,
                Key: key
            }).promise();
        } catch (error) {
            throw new Error(`Failed to delete image: ${error.message}`);
        }
    }
}

module.exports = new ImageService(); 