const express = require('express');
const axios = require('axios');
require('dotenv').config();
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));


app.post('/api/generate-posts', async (req, res) => {
  try {
    const { businessName, businessType, notesText } = req.body;

    // Appel à Claude API
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-5',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Tu es un expert en marketing pour les petits commerces.

Crée 5 posts professionnels pour les réseaux sociaux (Instagram, TikTok, Facebook).

Informations du commerce:
- Nom: ${businessName}
- Type: ${businessType}
- Notes/Détails: ${notesText}

Pour CHAQUE post, fournis:
1. Le texte du post (150-200 caractères max)
2. Les hashtags les plus pertinents
3. L'emoji qui correspond

Format ta réponse ainsi:
POST 1:
Texte: [texte ici]
Hashtags: #hashtag1 #hashtag2
Emoji: [emoji]

POST 2:
[etc...]`
        }
      ]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });

    // Extrait la réponse
    const content = response.data.content[0].text;

    res.json({
      success: true,
      posts: content
    });

  } catch (error) {
    console.error('Erreur:', error.message);
    res.status(500).json({ error: error.message });
  }
}); // Lancer le serveur
const PORT = process.env.PORT || 3000;
console.log('PORT utilisé:', PORT);
console.log('ANTHROPIC_API_KEY existe?', !!process.env.ANTHROPIC_API_KEY);
app.listen(PORT, () => { 
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
}); 
