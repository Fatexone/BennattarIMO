import { requireLogin } from './middlewares/authMiddleware.js';
import cors from 'cors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import mongoose from 'mongoose';
import flash from 'connect-flash';
import dotenv from 'dotenv';
import methodOverride from 'method-override';
import MongoStore from 'connect-mongo';
import multer from 'multer';
import fs from 'fs';
import AWS from 'aws-sdk';
import adminRoutes from './routes/adminRoutes.js';
import clientRoutes from './routes/clientRoutes.js';
import authRoutes from './routes/authRoutes.js';
import fetchRSSFeeds from './utils/fetchRSSFeeds.js';

// Charger les variables d'environnement
dotenv.config();

// Créer une application Express
const app = express();
const port = process.env.PORT || 3000;

// Déterminer le chemin absolu du dossier courant
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Connexion à MongoDB
const isProduction = process.env.NODE_ENV === 'production'; // Détecte si on est en production

// Utilise l'URI de MongoDB en fonction de l'environnement (local ou production)
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/benattar';




// Connexion à MongoDB
mongoose.connect(mongoURI, {
    serverSelectionTimeoutMS: 5000, // Timeout pour la sélection du serveur
    socketTimeoutMS: 45000, // Timeout pour les connexions
})
    .then(() => {
        console.log(`Connected to MongoDB (${isProduction ? 'Production' : 'Local'})`);
    })
    .catch(error => {
        console.error('MongoDB connection error:', error.message);
        process.exit(1); // Arrête l'application si la connexion échoue
    });






    // Configuration AWS S3
    const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'eu-north-1', // Spécifiez explicitement la région
    });
    


// Fonction pour déterminer si on utilise S3 ou le stockage local
const useS3 = process.env.USE_S3 === 'true';

// Configuration de Multer pour le stockage local
const storageLocal = multer.diskStorage({
    destination: (req, file, cb) => {
        let folder = 'public/uploads/';
        if (file.fieldname === 'photos') {
            folder += 'photos/';
        } else if (file.fieldname === 'videos') {
            folder += 'videos/';
        }
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});


// Middleware Multer pour le téléchargement de fichiers
const storage = useS3 ? multer.memoryStorage() : storageLocal;
const upload = multer({ storage });

// Fonction pour uploader un fichier vers S3 (mise à jour sans ACL)
const uploadToS3 = (file, folder) => {
    const params = {
        Bucket: process.env.S3_BUCKET_NAME, // Le nom du bucket
        Key: `${folder}/${Date.now()}-${file.originalname}`, // Chemin et nom de fichier sur S3
        Body: file.buffer,
        ContentType: file.mimetype // Spécifier le type de fichier
    };
    return s3.upload(params).promise(); // Upload vers S3
};


// Configurer les sessions
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
   
   
    cookie: {
        secure: true,  // Les cookies ne seront envoyés que via HTTPS
        httpOnly: true,  // Bloque l'accès aux cookies depuis le JavaScript côté client
        maxAge: 1000 * 60 * 60 * 24,  // 1 jour
        sameSite: 'lax',  // Protection contre les attaques CSRF
    }
    


}));





app.use((req, res, next) => {
    console.log('Session:', req.session);
    next();
});



// Configurer les options CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' ? 'https://www.alexandrebenattar.com' : 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));




app.use(methodOverride('_method'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(flash());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));




// Middleware unique pour les messages flash, logs et Google Maps API Key
app.use((req, res, next) => {
    res.locals.googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg') || '';
    res.locals.error = req.flash('error');
    console.log(`Request URL: ${req.url}`);
    next();
});






// Routes de l'application
app.use(authRoutes);
app.use('/admin', requireLogin, adminRoutes);
app.use('/', clientRoutes);

// Route pour uploader une photo
app.post('/upload/photo', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Aucun fichier uploadé.');
    }

    if (useS3) {
        try {
            const result = await uploadToS3(req.file, 'photos');
            return res.send({ fileUrl: result.Location, message: 'Photo uploadée avec succès sur S3' });
        } catch (error) {
            console.error('Erreur lors de l\'upload sur S3:', error);
            return res.status(500).send('Erreur lors de l\'upload');
        }
    } else {
        return res.send({ fileUrl: `/uploads/photos/${req.file.filename}`, message: 'Photo uploadée localement' });
    }
});

// Route pour uploader une vidéo
app.post('/upload/video', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send('Aucun fichier uploadé.');
    }

    if (useS3) {
        try {
            const result = await uploadToS3(req.file, 'videos');
            return res.send({ fileUrl: result.Location, message: 'Vidéo uploadée avec succès sur S3' });
        } catch (error) {
            console.error('Erreur lors de l\'upload sur S3:', error);
            return res.status(500).send('Erreur lors de l\'upload');
        }
    } else {
        return res.send({ fileUrl: `/uploads/videos/${req.file.filename}`, message: 'Vidéo uploadée localement' });
    }
});

// Route pour supprimer un fichier de S3 ou localement
app.delete('/file/:key', async (req, res) => {
    const { key } = req.params;
    if (useS3) {
        try {
            const params = { Bucket: process.env.S3_BUCKET_NAME, Key: key };
            const data = await s3.deleteObject(params).promise();
            console.log('Fichier supprimé de S3:', data);
            return res.send('Fichier supprimé avec succès de S3');
        } catch (error) {
            console.error('Erreur lors de la suppression sur S3:', error);
            return res.status(500).send('Erreur lors de la suppression du fichier');
        }
    } else {
        const filePath = path.join(__dirname, 'public', 'uploads', key);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return res.send('Fichier supprimé localement');
        } else {
            return res.status(404).send('Fichier non trouvé');
        }
    }
});


// Middleware pour gérer les routes non trouvées (404)
app.use((req, res) => {
    res.status(404).send('Page non trouvée');
});

// Middleware global pour la gestion des erreurs (500)
app.use((err, req, res, next) => {
    console.error('Error stack:', err.stack);
    res.status(500).send(`Something broke! ${err.message}`);
});

// Lancer le serveur
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    fetchRSSFeeds('https://news.google.com/rss/search?q=immobilier&hl=fr&gl=FR&ceid=FR:fr')
        .then(() => console.log('RSS Feeds fetched successfully'))
        .catch(error => console.error('Erreur lors de la récupération du flux RSS:', error));
});

export default app;
