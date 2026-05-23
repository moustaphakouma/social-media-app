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
    const { businessName, businessType, notesText, language } = req.body;

    // Validation
    if (!businessName || businessName.trim() === '') {
      return res.status(400).json({ error: 'Le nom du commerce est requis' });
    }

    // Prompt selon la langue
    const isEnglish = language === 'en';
   
    const promptFr = `Tu es un expert en marketing pour les petits commerces.

Crée 5 posts professionnels pour les réseaux sociaux (Instagram, TikTok, Facebook).

Informations du commerce:
- Nom: ${businessName}
- Type: ${businessType}
- Notes/Détails: ${notesText || 'Aucune note particulière'}

IMPORTANT: Utilise EXACTEMENT ce format pour chaque post (rien d'autre, pas d'introduction, pas de conclusion):

===POST===
Texte: [Le texte du post, 150-200 caractères max avec un emoji intégré]
Hashtags: #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5
Emoji: [un emoji principal]
===POST===
Texte: [...]
Hashtags: [...]
Emoji: [...]
===POST===
[etc pour les 5 posts]

Commence directement par le premier ===POST=== sans aucun texte avant.`;

    const promptEn = `You are a marketing expert for small businesses.

Create 5 professional posts for social media (Instagram, TikTok, Facebook).

Business information:
- Name: ${businessName}
- Type: ${businessType}
- Notes/Details: ${notesText || 'No special notes'}

IMPORTANT: Use EXACTLY this format for each post (nothing else, no introduction, no conclusion):

===POST===
Text: [Post text, max 150-200 characters with an emoji included]
Hashtags: #hashtag1 #hashtag2 #hashtag3 #hashtag4 #hashtag5
Emoji: [one main emoji]
===POST===
Text: [...]
Hashtags: [...]
Emoji: [...]
===POST===
[etc for all 5 posts]

Start directly with the first ===POST=== without any text before.`;

    // Appel à Claude API
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: isEnglish ? promptEn : promptFr
        }
      ]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
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
   
    // Message d'erreur clair selon le type
    let errorMessage = 'Une erreur est survenue. Réessaie dans quelques instants.';
   
    if (error.response) {
      if (error.response.status === 401) {
        errorMessage = 'Erreur d\'authentification API. Contacte l\'administrateur.';
      } else if (error.response.status === 429) {
        errorMessage = 'Trop de requêtes. Attends une minute avant de réessayer.';
      } else if (error.response.status === 529) {
        errorMessage = 'Le service est temporairement surchargé. Réessaie dans 1 minute.';
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'La requête a pris trop de temps. Réessaie.';
    }
   
    res.status(500).json({ error: errorMessage });
  }
});

// Lancer le serveur
const PORT = process.env.PORT || 3000;
console.log('PORT utilisé:', PORT);
console.log('ANTHROPIC_API_KEY existe?', !!process.env.ANTHROPIC_API_KEY);
app.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
}); 
