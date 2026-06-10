const faceapi = require('face-api.js');
const canvas = require('canvas');
const path = require('path');

const { Canvas, Image, ImageData } = canvas;

// 🔥 Patch environment for Node.js
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

let modelsLoaded = false;

// ✅ Correct model path (FIXED)
const modelPath = path.join(__dirname, 'models');

const loadModels = async () => {
    try {
        if (!modelsLoaded) {
            console.log("📦 Loading face models from:", modelPath);

            await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
            await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
            await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);

            modelsLoaded = true;
            console.log("✅ Face models loaded");
        }
    } catch (err) {
        console.error("❌ Error loading face models:", err);
        throw err;
    }
};

// ✅ Get face embedding
const getFaceEmbedding = async (imagePath) => {
    try {
        await loadModels();

        const img = await canvas.loadImage(imagePath);

        const detection = await faceapi
            .detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            console.log("⚠️ No face detected in image");
            return null;
        }

        return detection.descriptor;

    } catch (err) {
        console.error("❌ Face embedding error:", err);
        return null;
    }
};

// ✅ Face similarity (improved)
const faceSimilarity = (desc1, desc2) => {
    if (!desc1 || !desc2) return 0;

    let sum = 0;

    for (let i = 0; i < desc1.length; i++) {
        sum += Math.pow(desc1[i] - desc2[i], 2);
    }

    const distance = Math.sqrt(sum);

    // 🔥 Better normalization (0–100%)
    const similarity = (1 / (1 + distance)) * 100;

    return Number(similarity.toFixed(2));
};

module.exports = {
    getFaceEmbedding,
    faceSimilarity
};