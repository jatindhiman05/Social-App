require('dotenv').config();
const app = require('./src/app');

const PORT = process.env.PORT || 3006;

app.listen(PORT, () => {
    console.log(`🖼️ Media Service running on port ${PORT}`);
});