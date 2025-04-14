const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;
const { MongoClient } = require('mongodb');

// Determine if we're in production (like on Render.com)
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Running in ${isProduction ? 'production' : 'development'} mode`);

// MongoDB connection string - replace with your actual connection string
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/studypeak';
let dbClient = null;
let db = null;

// Connect to MongoDB (in production)
async function connectToMongo() {
  if (isProduction) {
    try {
      console.log('Connecting to MongoDB...');
      console.log('Attempting connection to MongoDB Atlas...');
      dbClient = new MongoClient(mongoUri, {
        connectTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      await dbClient.connect();
      db = dbClient.db();
      console.log('Connected to MongoDB successfully');
      
      // Ensure collections exist
      await ensureCollections();
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err);
    }
  }
}

// Ensure all required collections exist
async function ensureCollections() {
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);
  
  if (!collectionNames.includes('questions')) await db.createCollection('questions');
  if (!collectionNames.includes('topics')) await db.createCollection('topics');
  if (!collectionNames.includes('resources')) await db.createCollection('resources');
  if (!collectionNames.includes('timemanagement')) await db.createCollection('timemanagement');
  
  // Initialize resources document if it doesn't exist
  const resourcesCount = await db.collection('resources').countDocuments();
  if (resourcesCount === 0) {
    await db.collection('resources').insertOne({ 
      videos: [], 
      notes: [], 
      ebooks: [] 
    });
  }
  
  // Initialize timemanagement document if it doesn't exist
  const timeCount = await db.collection('timemanagement').countDocuments();
  if (timeCount === 0) {
    await db.collection('timemanagement').insertOne({ 
      stats: [], 
      timeAllocation: [] 
    });
  }
}

// In-memory data store as fallback
const memoryStore = {
  questions: [],
  topics: [],
  resources: { videos: [], notes: [], ebooks: [] },
  timemanagement: { stats: [], timeAllocation: [] }
};

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Data directory
const dataDir = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir) && !isProduction) {
    fs.mkdirSync(dataDir);
    console.log(`Created data directory: ${dataDir}`);
}

// Helper function to read data
async function readData(collection) {
    if (isProduction && db) {
        try {
            if (collection === 'resources') {
                return await db.collection('resources').findOne({}) || { videos: [], notes: [], ebooks: [] };
            } else if (collection === 'timemanagement') {
                return await db.collection('timemanagement').findOne({}) || { stats: [], timeAllocation: [] };
            } else {
                return await db.collection(collection).find({}).toArray();
            }
        } catch (err) {
            console.error(`Error reading from MongoDB (${collection}):`, err);
            return collection === 'resources' ? memoryStore.resources : 
                   collection === 'timemanagement' ? memoryStore.timemanagement : 
                   memoryStore[collection];
        }
    }
    
    return readJsonData(`${collection}.json`);
}

// Helper function to write data
async function writeData(collection, data) {
    if (isProduction && db) {
        try {
            if (collection === 'resources' || collection === 'timemanagement') {
                await db.collection(collection).deleteMany({});
                await db.collection(collection).insertOne(data);
            } else {
                await db.collection(collection).deleteMany({});
                if (data.length > 0) {
                    await db.collection(collection).insertMany(data);
                }
            }
        } catch (err) {
            console.error(`Error writing to MongoDB (${collection}):`, err);
            memoryStore[collection] = data;
        }
        return;
    }
    
    writeJsonData(`${collection}.json`, data);
}

// Legacy helper functions for JSON files
const readJsonData = (filename) => {
    if (isProduction) {
        // Use in-memory store in production
        const key = filename.replace('.json', '');
        console.log(`Reading from memory store: ${key}`);
        return memoryStore[key] || (key === 'resources' ? { videos: [], notes: [], ebooks: [] } : []);
    }
    
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) {
        console.log(`File does not exist: ${filePath}`);
        return filename === 'resources.json' ? { videos: [], notes: [], ebooks: [] } : [];
    }
    
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error(`Error reading ${filePath}:`, err);
        return filename === 'resources.json' ? { videos: [], notes: [], ebooks: [] } : [];
    }
};

const writeJsonData = (filename, data) => {
    if (isProduction) {
        // Store in memory in production
        const key = filename.replace('.json', '');
        console.log(`Writing to memory store: ${key}`);
        memoryStore[key] = data;
        return;
    }
    
    const filePath = path.join(dataDir, filename);
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error(`Error writing to ${filePath}:`, err);
    }
};

// Initialize memory store from files if they exist (helps during deployment)
if (isProduction) {
    try {
        console.log('Initializing memory store from data files...');
        if (fs.existsSync(path.join(dataDir, 'questions.json'))) {
            memoryStore.questions = JSON.parse(fs.readFileSync(path.join(dataDir, 'questions.json'), 'utf8'));
        }
        if (fs.existsSync(path.join(dataDir, 'topics.json'))) {
            memoryStore.topics = JSON.parse(fs.readFileSync(path.join(dataDir, 'topics.json'), 'utf8'));
        }
        if (fs.existsSync(path.join(dataDir, 'resources.json'))) {
            memoryStore.resources = JSON.parse(fs.readFileSync(path.join(dataDir, 'resources.json'), 'utf8'));
        }
        if (fs.existsSync(path.join(dataDir, 'timemanagement.json'))) {
            memoryStore.timemanagement = JSON.parse(fs.readFileSync(path.join(dataDir, 'timemanagement.json'), 'utf8'));
        }
        console.log('Memory store initialized successfully');
    } catch (err) {
        console.error('Error initializing memory store:', err);
    }
}

// API routes for questions
app.get('/api/questions', async (req, res) => {
    try {
        const questions = await readData('questions');
        res.json(questions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

app.get('/api/questions/:id', async (req, res) => {
    try {
        const questions = await readData('questions');
        const question = questions.find(q => q.id === req.params.id);
        
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        
        res.json(question);
    } catch (error) {
        console.error('Error fetching question:', error);
        res.status(500).json({ error: 'Failed to fetch question' });
    }
});

app.post('/api/questions', async (req, res) => {
    try {
        const questions = await readData('questions');
        const newQuestion = req.body;
        newQuestion.id = Date.now().toString(); // Simple unique ID generation
        questions.push(newQuestion);
        await writeData('questions', questions);
        res.status(201).json(newQuestion);
    } catch (error) {
        console.error('Error adding question:', error);
        res.status(500).json({ error: 'Failed to add question' });
    }
});

app.put('/api/questions/:id', async (req, res) => {
    try {
        let questions = await readData('questions');
        const updatedQuestion = req.body;
        
        // Find and update the question
        questions = questions.map(q => q.id === req.params.id ? updatedQuestion : q);
        
        await writeData('questions', questions);
        res.json(updatedQuestion);
    } catch (error) {
        console.error('Error updating question:', error);
        res.status(500).json({ error: 'Failed to update question' });
    }
});

app.delete('/api/questions/:id', async (req, res) => {
    try {
        let questions = await readData('questions');
        
        // Filter out the question to delete
        questions = questions.filter(q => q.id !== req.params.id);
        
        await writeData('questions', questions);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

// API routes for topics (converted to async)
app.get('/api/topics', async (req, res) => {
    try {
        const topics = await readData('topics');
        res.json(topics);
    } catch (error) {
        console.error('Error fetching topics:', error);
        res.status(500).json({ error: 'Failed to fetch topics' });
    }
});

app.get('/api/topics/:id', async (req, res) => {
    try {
        const topics = await readData('topics');
        const topic = topics.find(t => t.id === req.params.id);
        
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        
        res.json(topic);
    } catch (error) {
        console.error('Error fetching topic:', error);
        res.status(500).json({ error: 'Failed to fetch topic' });
    }
});

app.post('/api/topics', async (req, res) => {
    try {
        const topics = await readData('topics');
        const newTopic = req.body;
        newTopic.id = Date.now().toString();
        topics.push(newTopic);
        await writeData('topics', topics);
        res.status(201).json(newTopic);
    } catch (error) {
        console.error('Error adding topic:', error);
        res.status(500).json({ error: 'Failed to add topic' });
    }
});

app.put('/api/topics/:id', async (req, res) => {
    try {
        let topics = await readData('topics');
        const updatedTopic = req.body;
        
        topics = topics.map(t => t.id === req.params.id ? updatedTopic : t);
        
        await writeData('topics', topics);
        res.json(updatedTopic);
    } catch (error) {
        console.error('Error updating topic:', error);
        res.status(500).json({ error: 'Failed to update topic' });
    }
});

app.delete('/api/topics/:id', async (req, res) => {
    try {
        let topics = await readData('topics');
        
        topics = topics.filter(t => t.id !== req.params.id);
        
        await writeData('topics', topics);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting topic:', error);
        res.status(500).json({ error: 'Failed to delete topic' });
    }
});

// API routes for resources (converted to async)
app.get('/api/resources', async (req, res) => {
    try {
        const resources = await readData('resources');
        
        // Ensure all resource arrays exist
        if (!resources.videos) resources.videos = [];
        if (!resources.notes) resources.notes = [];
        if (!resources.ebooks) resources.ebooks = [];
        
        res.json(resources);
    } catch (error) {
        console.error('Error serving resources:', error);
        res.status(500).json({ 
            error: 'Failed to load resources',
            message: error.message
        });
    }
});

app.post('/api/resources', async (req, res) => {
    try {
        const resources = await readData('resources');
        const newResource = req.body;
        
        // Handle different types of resources (videos, notes, ebooks)
        if (newResource.type === 'video') {
            newResource.id = Date.now().toString();
            delete newResource.type;
            resources.videos.push(newResource);
        } else if (newResource.type === 'note') {
            newResource.id = Date.now().toString();
            delete newResource.type;
            resources.notes.push(newResource);
        } else if (newResource.type === 'ebook') {
            newResource.id = Date.now().toString();
            delete newResource.type;
            resources.ebooks.push(newResource);
        } else {
            return res.status(400).json({ error: 'Invalid resource type' });
        }
        
        await writeData('resources', resources);
        res.status(201).json(newResource);
    } catch (error) {
        console.error('Error adding resource:', error);
        res.status(500).json({ error: 'Failed to add resource' });
    }
});

app.put('/api/resources/:type/:id', async (req, res) => {
    try {
        const resources = await readData('resources');
        const { type, id } = req.params;
        const updatedResource = req.body;
        
        // Remove type before saving
        delete updatedResource.type;
        
        if (type === 'video') {
            resources.videos = resources.videos.map(v => v.id === id ? updatedResource : v);
        } else if (type === 'note') {
            resources.notes = resources.notes.map(n => n.id === id ? updatedResource : n);
        } else if (type === 'ebook') {
            resources.ebooks = resources.ebooks.map(e => e.id === id ? updatedResource : e);
        } else {
            return res.status(400).json({ error: 'Invalid resource type' });
        }
        
        await writeData('resources', resources);
        res.json(updatedResource);
    } catch (error) {
        console.error('Error updating resource:', error);
        res.status(500).json({ error: 'Failed to update resource' });
    }
});

app.delete('/api/resources/:type/:id', async (req, res) => {
    try {
        const resources = await readData('resources');
        const { type, id } = req.params;
        
        if (type === 'video') {
            resources.videos = resources.videos.filter(v => v.id !== id);
        } else if (type === 'note') {
            resources.notes = resources.notes.filter(n => n.id !== id);
        } else if (type === 'ebook') {
            resources.ebooks = resources.ebooks.filter(e => e.id !== id);
        } else {
            return res.status(400).json({ error: 'Invalid resource type' });
        }
        
        await writeData('resources', resources);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting resource:', error);
        res.status(500).json({ error: 'Failed to delete resource' });
    }
});

// API routes for time management data (converted to async)
app.get('/api/timemanagement', async (req, res) => {
    try {
        const timeData = await readData('timemanagement');
        res.json(timeData);
    } catch (error) {
        console.error('Error fetching time management data:', error);
        res.status(500).json({ error: 'Failed to fetch time management data' });
    }
});

app.put('/api/timemanagement', async (req, res) => {
    try {
        const timeData = req.body;
        
        // Calculate chart percentages for time allocation
        if (timeData.timeAllocation && timeData.timeAllocation.length > 0) {
            const totalHours = timeData.timeAllocation.reduce((sum, item) => sum + item.hours, 0);
            
            timeData.timeAllocation = timeData.timeAllocation.map(item => {
                item.chartPercentage = (item.hours / totalHours) * 100;
                return item;
            });
        }
        
        await writeData('timemanagement', timeData);
        res.json(timeData);
    } catch (error) {
        console.error('Error updating time management data:', error);
        res.status(500).json({ error: 'Failed to update time management data' });
    }
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Connect to MongoDB and then start the server
(async function startServer() {
    try {
        if (isProduction) {
            await connectToMongo();
        }
        
        app.listen(port, () => {
            console.log(`StudyPeak server running at http://localhost:${port}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
})();
