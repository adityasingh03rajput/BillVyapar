
const KEY = 'AIzaSyB-FiynMMuu0j0GryZnrBpvzY5rNYJwmS4';
const URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

async function getCoordinates(location) {
  const prompt = `Get the latitude and longitude of ${location}. Return ONLY a valid JSON object: {"lat": float, "lng": float}. No markdown.`;
  
  try {
    const response = await fetch(`${URL}?key=${KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error('Gemini Error:', data.error.message);
      return;
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error('Empty response from model. Full result:', JSON.stringify(data, null, 2));
      return;
    }

    const cleanJson = text.replace(/```json|```/g, '').trim();
    const coords = JSON.parse(cleanJson);
    
    console.log(`\nLocation identified: ${location}`);
    console.log(`Latitude:  ${coords.lat}`);
    console.log(`Longitude: ${coords.lng}\n`);
    return coords;
  } catch (error) {
    console.error('Script Error:', error.message);
  }
}

getCoordinates('Narsinghpur, Madhya Pradesh, India');
