import axios from 'axios';

const AI_URL = process.env.AI_URL || 'http://localhost:8000';

// 1. Brain — AI se reply lo
export const getBrainResponse = async (message, userId) => {
  try {
    const response = await axios.post(`${AI_URL}/brain/respond`, { message, userId });
    return response.data;
  } catch (error) {
    return { reply: "I'm sorry, I couldn't process that. Please try again." };
  }
};

// 2. Sentiment — Emotion detect karo
export const getSentiment = async (message) => {
  try {
    const response = await axios.post(`${AI_URL}/sentiment/analyze`, { text: message });
    return response.data;
  } catch (error) {
    return { label: 'NEUTRAL', score: 0.5 };
  }
};

// 3. Vision — Image analyze karo
export const analyzeImage = async (imageBuffer) => {
  try {
    const response = await axios.post(`${AI_URL}/vision/analyze`, { image: imageBuffer });
    return response.data;
  } catch (error) {
    return { defect: 'unknown', confidence: 0 };
  }
};

// 4. Voice — Audio to text
export const transcribeVoice = async (audioBuffer) => {
  try {
    const response = await axios.post(`${AI_URL}/voice/transcribe`, { audio: audioBuffer });
    return response.data;
  } catch (error) {
    return { text: '' };
  }
};