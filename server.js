const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // votre adresse email
        pass: process.env.EMAIL_PASS  // votre mot de passe ou clé d'application
    }
});


const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();
const RSSParser = require('rss-parser');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

const properties = [
    {
        id: 1,
        title: "Appartement de luxe",
        address: "123 Rue de Rivoli, Paris",
        lat: 48.8606,
        lng: 2.3376,
        price: "1,200,000 €",
        avgPrice: "12,000 €/m²",
        photos: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg']
    },
    {
        id: 2,
        title: "Maison familiale",
        address: "45 Avenue des Champs-Élysées, Paris",
        lat: 48.8566,
        lng: 2.3522,
        price: "2,300,000 €",
        avgPrice: "15,000 €/m²",
        photos: ['photo4.jpg', 'photo5.jpg', 'photo6.jpg']
    },
    {
        id: 3,
        title: "Studio moderne",
        address: "78 Boulevard Saint-Germain, Paris",
        lat: 48.8575,
        lng: 2.3531,
        price: "450,000 €",
        avgPrice: "10,500 €/m²",
        photos: ['photo7.jpg', 'photo8.jpg', 'photo9.jpg']
    },
    {
        id: 4,
        title: "Duplex spacieux",
        address: "32 Rue de la Paix, Paris",
        lat: 48.8681,
        lng: 2.3303,
        price: "3,200,000 €",
        avgPrice: "14,000 €/m²",
        photos: ['spacious_duplex1.jpg', 'spacious_duplex2.jpg', 'spacious_duplex3.jpg']
    },
    {
        id: 5,
        title: "Villa avec jardin",
        address: "12 Rue des Rosiers, Saint-Ouen",
        lat: 48.9109,
        lng: 2.3408,
        price: "980,000 €",
        avgPrice: "8,000 €/m²",
        photos: ['garden_villa1.jpg', 'garden_villa2.jpg', 'garden_villa3.jpg']
    },
    {
        id: 6,
        title: "Loft industriel",
        address: "56 Quai de Jemmapes, Paris",
        lat: 48.8758,
        lng: 2.3624,
        price: "1,500,000 €",
        avgPrice: "11,000 €/m²",
        photos: ['industrial_loft1.jpg', 'industrial_loft2.jpg', 'industrial_loft3.jpg']
    },
    {
        id: 7,
        title: "Penthouse avec vue",
        address: "24 Rue de la Boétie, Paris",
        lat: 48.8708,
        lng: 2.3095,
        price: "4,000,000 €",
        avgPrice: "16,000 €/m²",
        photos: ['view_penthouse1.jpg', 'view_penthouse2.jpg', 'view_penthouse3.jpg']
    },
    {
        id: 8,
        title: "Maison de charme",
        address: "7 Rue de Passy, Paris",
        lat: 48.8575,
        lng: 2.2768,
        price: "2,100,000 €",
        avgPrice: "13,000 €/m²",
        photos: ['charming_house1.jpg', 'charming_house2.jpg', 'charming_house3.jpg']
    },
    {
        id: 9,
        title: "Appartement cosy",
        address: "15 Rue de la Huchette, Paris",
        lat: 48.8527,
        lng: 2.3470,
        price: "600,000 €",
        avgPrice: "9,000 €/m²",
        photos: ['cozy_apartment1.jpg', 'cozy_apartment2.jpg', 'cozy_apartment3.jpg']
    },
    {
        id: 10,
        title: "Maison de ville",
        address: "3 Rue Mouffetard, Paris",
        lat: 48.8422,
        lng: 2.3509,
        price: "1,800,000 €",
        avgPrice: "12,500 €/m²",
        photos: ['townhouse1.jpg', 'townhouse2.jpg', 'townhouse3.jpg']
    }
];


app.get('/', (req, res) => {
    res.render('index');
});

app.get('/about', (req, res) => {
    res.render('about');
});

app.get('/services', (req, res) => {
    res.render('services');
});

app.get('/blockchain', (req, res) => {
    res.render('blockchain');
});


app.post('/contact-blockchain', (req, res) => {
    const { name, email, message } = req.body;

    const mailOptions = {
        from: email,
        to: process.env.EMAIL_USER,
        subject: 'Nouvelle demande de transaction blockchain',
        text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Erreur lors de l\'envoi de l\'email.');
        }
        res.send('Merci de nous avoir contactés ! Nous reviendrons vers vous sous peu.');
    });
});

app.get('/properties', (req, res) => {
    res.render('properties', { properties });
});

app.get('/news', async (req, res) => {
    try {
        const rssParser = new RSSParser();
        const feed = await rssParser.parseURL('https://www.lemonde.fr/immobilier/rss_full.xml');
        res.render('news', { articles: feed.items, message: null });
    } catch (error) {
        res.render('news', { articles: [], message: `Erreur : ${error.message}` });
    }
});

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.get('/property/:id', (req, res) => {
    const propertyId = parseInt(req.params.id, 10);
    const property = properties.find(p => p.id === propertyId);
    if (property) {
        res.render('property', { property });
    } else {
        res.status(404).send('Propriété non trouvée');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});