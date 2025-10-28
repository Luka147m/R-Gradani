const express = require('express');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const openApiPath = path.join(__dirname, 'openapi.yaml');
const openApiSpec = yaml.load(fs.readFileSync(openApiPath, 'utf8'));

app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'R-Gradani backend' });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
  console.log(`API documentation available at http://localhost:${port}/docs`);
});