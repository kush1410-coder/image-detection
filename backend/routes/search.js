const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const { getEmbedding } = require('../embedding');
const { cosineSimilarity } = require('../similarity');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('image'), async (req, res) => {
    try {
        const inputImage = req.file;

        const inputEmbedding = await getEmbedding(inputImage.path);

        const embeddingsData = JSON.parse(
            fs.readFileSync(path.join(__dirname, '../embeddings.json'))
        );

        let results = [];

        for (let item of embeddingsData) {
            const similarity = cosineSimilarity(
                inputEmbedding,
                item.embedding
            );

            results.push({
                image: item.image,
                similarity: (similarity * 100).toFixed(2)
            });
        }

        results.sort((a, b) => b.similarity - a.similarity);

        // Add prefix path to access images via static server
        const enrichedMatches = results.map(item => ({
            ...item,
            imageUrl: `http://localhost:5000/dataset/${item.image}`
        }));

        res.json({ matches: enrichedMatches });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error searching images" });
    }
});

module.exports = router;