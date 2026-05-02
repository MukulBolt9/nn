const GEMINI_API_KEY = 'AIzaSyC356BnpkkFlWyIclsX5aB1OMvY-uNW0Hk';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(prompt: string): Promise<string> {
  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      contents: [{parts: [{text: prompt}]}],
      generationConfig: {temperature: 0.7, maxOutputTokens: 1500},
    }),
  });

  if (!response.ok) throw new Error(`Gemini error: ${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return text.replace(/```json|```/g, '').trim();
}

export async function getDailySummary(weatherSummary: string): Promise<{
  greeting: string;
  weatherTip: string;
  motivationalQuote: string;
  musicMood: string;
  quickTip: string;
  energyLevel: string;
}> {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const date = new Date().toLocaleDateString('en-US', {weekday: 'long', month: 'long', day: 'numeric'});

  const prompt = `You are NowBrief, a warm smart assistant. Create a brief ${timeOfDay} summary.
Weather: ${weatherSummary}
Date: ${date}

Return ONLY this JSON:
{
  "greeting": "Warm personalized ${timeOfDay} greeting (max 12 words)",
  "weatherTip": "Weather advice based on conditions (max 15 words)",
  "motivationalQuote": "Uplifting quote or thought (max 15 words)",
  "musicMood": "Perfect music vibe for now (max 8 words)",
  "quickTip": "Useful life tip for today (max 15 words)",
  "energyLevel": "Energy and focus advice (max 12 words)"
}`;

  try {
    const json = await callGemini(prompt);
    return JSON.parse(json);
  } catch {
    return {
      greeting: `Good ${timeOfDay}! Ready for a great day?`,
      weatherTip: 'Stay comfortable and prepared today',
      motivationalQuote: 'Every moment is a fresh beginning',
      musicMood: 'Upbeat feel-good vibes',
      quickTip: 'Take short breaks to stay refreshed',
      energyLevel: 'Maintain a steady, focused pace',
    };
  }
}

export async function getMusicRecs(mood: string, weather: string): Promise<Array<{
  title: string; artist: string; genre: string; emoji: string; thumbnailColor: string; duration: string;
}>> {
  const prompt = `Recommend 4 songs for mood "${mood}" with weather "${weather}".
Return ONLY JSON array:
[{"title":"Song name","artist":"Artist","genre":"Genre","emoji":"🎵","thumbnailColor":"#1DB954","duration":"3:45"}]`;

  try {
    const json = await callGemini(prompt);
    return JSON.parse(json);
  } catch {
    return [
      {title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Pop', emoji: '⚡', thumbnailColor: '#FF6B6B', duration: '3:20'},
      {title: 'Good Days', artist: 'SZA', genre: 'R&B', emoji: '🌅', thumbnailColor: '#4ECDC4', duration: '4:38'},
      {title: 'Levitating', artist: 'Dua Lipa', genre: 'Pop', emoji: '✨', thumbnailColor: '#A855F7', duration: '3:23'},
      {title: 'Heat Waves', artist: 'Glass Animals', genre: 'Indie', emoji: '🌊', thumbnailColor: '#F59E0B', duration: '3:58'},
    ];
  }
}

export async function getNewsForCategory(category: string): Promise<Array<{
  title: string; summary: string; category: string; readTime: string; sentiment: string; emoji: string;
}>> {
  const prompt = `Generate 5 realistic news headlines for "${category}" category.
Return ONLY JSON array:
[{"title":"Headline","summary":"Two sentence summary of the story.","category":"${category}","readTime":"2 min read","sentiment":"positive","emoji":"📰"}]`;

  try {
    const json = await callGemini(prompt);
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [
      {title: `Latest ${category} Update`, summary: 'Breaking developments emerging. Experts share insights on the latest news.', category, readTime: '2 min read', sentiment: 'neutral', emoji: '📰'},
    ];
  }
}

export async function getWeatherInsights(weatherSummary: string): Promise<{
  whatToWear: string; activitySuggestion: string; healthTip: string; travelAdvice: string; moodBooster: string;
}> {
  const prompt = `Analyze weather "${weatherSummary}" and give helpful tips.
Return ONLY JSON:
{"whatToWear":"Clothing advice","activitySuggestion":"Best activity suggestion","healthTip":"Health tip","travelAdvice":"Travel tip","moodBooster":"Positive weather spin"}`;

  try {
    const json = await callGemini(prompt);
    return JSON.parse(json);
  } catch {
    return {
      whatToWear: 'Dress in comfortable, weather-appropriate layers',
      activitySuggestion: 'Perfect for a relaxing walk outside',
      healthTip: 'Stay hydrated and well-rested today',
      travelAdvice: 'Allow extra time for your journey',
      moodBooster: 'Every day has its own unique beauty',
    };
  }
}
