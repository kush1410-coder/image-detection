const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { getEmbedding } = require('../embedding');
const { cosineSimilarity } = require('../similarity');
const { fetchImageUrls, downloadImage } = require('../externalSearch');
const { analyzeImage } = require('../gemini');
const { getFaceEmbedding, faceSimilarity } = require('../faceSimilarity');

const router = express.Router();

// uploads folder
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({ dest: uploadDir });

const getPiracyLevel = (score) => {
    if (score > 85) return "HIGH ⚠️";
    if (score > 70) return "MEDIUM ⚠️";
    return "LOW";
};

router.post('/', upload.single('image'), async (req, res) => {
    let tempFiles = [];

    try {
        const inputImage = req.file;

        if (!inputImage) {
            return res.status(400).json({ error: "Please upload an image" });
        }

        console.log("📸 Processing input image...");

        // INPUT EMBEDDINGS
        const inputEmbedding = await getEmbedding(inputImage.path);
        const inputFace = await getFaceEmbedding(inputImage.path);

        // GEMINI
        const aiResult = await analyzeImage(inputImage.path);

        let queries = aiResult.queries || [];
        const entity = (aiResult.entity || "unknown").toLowerCase();

        console.log("🎯 Entity:", entity);
        console.log("🔍 Queries:", queries);

        if (!queries.length) {
            queries = [
                "football player",
                "sports image",
                "match highlight",
                "stadium action"
            ];
        }

        queries = queries.slice(0, 4);

        // FETCH URLS
        let allUrls = [];

        for (let q of queries) {
            const urls = await fetchImageUrls(q);
            allUrls.push(...urls);
        }

        allUrls = [...new Set(allUrls)];

        console.log("🌍 URLs:", allUrls.length);

        const results = await Promise.all(
            allUrls.slice(0, 10).map(async (url, i) => {
                const filePath = path.join(uploadDir, `ext_${Date.now()}_${i}.jpg`);

                try {
                    console.log("⬇️", url);

                    await downloadImage(url, filePath);
                    tempFiles.push(filePath);

                    // CLIP
                    const emb = await getEmbedding(filePath);
                    const similarity = cosineSimilarity(inputEmbedding, emb);

                    // FACE
                    const dbFace = await getFaceEmbedding(filePath);

                    let faceScore = 0;
                    if (inputFace && dbFace) {
                        faceScore = faceSimilarity(inputFace, dbFace);
                    }

                    const faceNormalized = faceScore / 100;

                    // COMBINED SCORE
                    let combinedScore = (similarity * 0.7) + (faceNormalized * 0.3);
                    let percentage = combinedScore * 100;

                    // ENTITY BOOST
                    if (entity !== "unknown" && url.toLowerCase().includes(entity)) {
                        console.log("⚡ Entity boost");
                        percentage += 10;
                    }

                    if (percentage > 100) percentage = 100;

                    console.log(
                        `📊 CLIP: ${similarity.toFixed(2)} | FACE: ${faceScore.toFixed(2)} | FINAL: ${percentage.toFixed(2)}`
                    );

                    return {
                        url,
                        similarity: Number(percentage.toFixed(2)),
                        piracy: getPiracyLevel(percentage)
                    };

                } catch (err) {
                    console.log("❌ Skipping:", url);
                    return null;
                }
            })
        );

        const cleanResults = results.filter(r => r !== null);

        cleanResults.sort((a, b) => b.similarity - a.similarity);

        let filtered = cleanResults.filter(r => {
            if (r.similarity > 85) return true;
            if (r.similarity > 70 && r.piracy === "MEDIUM ⚠️") return true;
            return false;
        });

        if (!filtered.length) {
            filtered = cleanResults.slice(0, 3);
        }

        res.json({
            message: "External search completed",
            detected_entity: entity,
            queries_used: queries,
            matches: filtered.slice(0, 5)
        });

    } catch (err) {
        console.error("❌ Error:", err);
        res.status(500).json({ error: "External search failed" });
    } finally {
        tempFiles.forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
        });
    }
});

module.exports = router;