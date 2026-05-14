import express from 'express';
import { handleGenerateReadme, handleGenerateReadmeStream } from '../controllers/generateController.js';

const router = express.Router();

router.post('/generate', handleGenerateReadme);
router.get('/generate-stream', handleGenerateReadmeStream);

export default router;