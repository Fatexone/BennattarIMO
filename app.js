const express = require('express');
const path = require('path');
const Web3 = require('web3');
const bodyParser = require('body-parser');
const RSSParser = require('rss-parser');

const rssParser = new RSSParser();

// Initialisation correcte de Web3 avec Infura
const web3 = new Web3(new Web3.providers.HttpProvider('https://mainnet.infura.io/v3/2619645d5aa24f27ab30f8f0d6a70326'));

// Vérification de la version de Web3
console.log(`Web3 version: ${web3.version}`);

// Configuration d'Express
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

// Liste des propriétés
const properties = [
    { id: 1, title: "Appartement de luxe", address: "123 Rue de Rivoli, Paris", lat: 48.8606, lng: 2.3376, price: "1,200,000 €", avgPrice: "12,000 €/m²" },
    { id: 2, title: "Maison familiale", address: "45 Avenue des Champs-Élysées, Paris", lat: 48.8566, lng: 2.3522, price: "2,300,000 €", avgPrice: "15,000 €/m²" },
    { id: 3, title: "Studio moderne", address: "78 Boulevard Saint-Germain, Paris", lat: 48.8575, lng: 2.3531, price: "450,000 €", avgPrice: "10,500 €/m²" },
    { id: 4, title: "Duplex spacieux", address: "32 Rue de la Paix, Paris", lat: 48.8681, lng: 2.3303, price: "3,200,000 €", avgPrice: "14,000 €/m²" },
    { id: 5, title: "Villa avec jardin", address: "12 Rue des Rosiers, Saint-Ouen", lat: 48.9109, lng: 2.3408, price: "980,000 €", avgPrice: "8,000 €/m²" },
    { id: 6, title: "Loft industriel", address: "56 Quai de Jemmapes, Paris", lat: 48.8758, lng: 2.3624, price: "1,500,000 €", avgPrice: "11,000 €/m²" },
    { id: 7, title: "Penthouse avec vue", address: "24 Rue de la Boétie, Paris", lat: 48.8708, lng: 2.3095, price: "4,000,000 €", avgPrice: "16,000 €/m²" },
    { id: 8, title: "Maison de charme", address: "7 Rue de Passy, Paris", lat: 48.8575, lng: 2.2768, price: "2,100,000 €", avgPrice: "13,000 €/m²" },
    { id: 9, title: "Appartement cosy", address: "15 Rue de la Huchette, Paris", lat: 48.8527, lng: 2.3470, price: "600,000 €", avgPrice: "9,000 €/m²" },
    { id: 10, title: "Maison de ville", address: "3 Rue Mouffetard, Paris", lat: 48.8422, lng: 2.3509, price: "1,800,000 €", avgPrice: "12,500 €/m²" }
];

// Route principale
app.get('/', (req, res) => res.render('index'));

// Route pour les transactions Blockchain
app.get('/blockchain', async (req, res) => {
    try {
        const blockNumber = await web3.eth.getBlockNumber();
        res.render('blockchain', { message: `Le numéro de bloc actuel est ${blockNumber}` });
    } catch (error) {
        res.render('blockchain', { message: `Erreur : ${error.message}` });
    }
});

// Route pour les transactions traditionnelles
app.get('/traditional', (req, res) => res.render('traditional'));

// Route pour afficher les détails des transactions
app.get('/transaction/:hash', async (req, res) => {
    try {
        const hash = req.params.hash;
        const transaction = await web3.eth.getTransaction(hash);
        res.render('transaction', { transaction });
    } catch (error) {
        res.send(`Erreur : ${error.message}`);
    }
});

// Routes pour les pages À Propos, Services, Biens Immobiliers, Actualités et Contact
app.get('/about', (req, res) => res.render('about'));
app.get('/services', (req, res) => res.render('services'));
app.get('/properties', (req, res) => res.render('properties', { properties }));

app.get('/news', async (req, res) => {
    try {
        const feed = await rssParser.parseURL('https://www.lemonde.fr/immobilier/rss_full.xml');
        res.render('news', { articles: feed.items, message: null });
    } catch (error) {
        res.render('news', { articles: [], message: `Erreur : ${error.message}` });
    }
});

app.get('/contact', (req, res) => res.render('contact'));

// Route pour gérer l'envoi du formulaire de contact
app.post('/send-message', (req, res) => {
    const { name, email, message } = req.body;
    console.log(`Message reçu de ${name} (${email}): ${message}`);
    res.send('Merci pour votre message. Nous vous contacterons bientôt.');
});

// Route pour afficher les détails d'une propriété
app.get('/property/:id', (req, res) => {
    const propertyId = parseInt(req.params.id, 10);
    const property = properties.find(p => p.id === propertyId);
    if (property) {
        res.render('property', { property });
    } else {
        res.status(404).send('Propriété non trouvée');
    }
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
